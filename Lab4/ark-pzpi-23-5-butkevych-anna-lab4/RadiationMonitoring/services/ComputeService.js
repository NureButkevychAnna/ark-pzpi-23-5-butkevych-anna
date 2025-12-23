const { SensorReading, ComputedReading, DeviceHealth } = require("../models");
const { Op } = require("sequelize");

class ComputeService {
  static normalize(value, unit) {
    if (!unit) return value;
    if (unit === "mSv/h") return value * 1000;
    return value;
  }

  static async computeCumulativeDose(deviceId, from, to) {
    const readings = await SensorReading.findAll({
      where: {
        device_id: deviceId,
        measured_at: { [Op.between]: [from, to] },
      },
      order: [["measured_at", "ASC"]],
    });

    if (!readings || readings.length < 2) return { cumulative: 0, points: [] };

    let cumulative = 0;
    const points = [];

    for (let i = 0; i < readings.length - 1; i++) {
      const r1 = readings[i];
      const r2 = readings[i + 1];
      const v1 = this.normalize(Number(r1.value), r1.unit);
      const v2 = this.normalize(Number(r2.value), r2.unit);
      const t1 = new Date(r1.measured_at).getTime();
      const t2 = new Date(r2.measured_at).getTime();
      const deltaHours = (t2 - t1) / (1000 * 60 * 60);
      if (deltaHours <= 0) continue;
      const area = ((v1 + v2) / 2) * deltaHours; // µSv/h * hours -> µSv
      cumulative += area;
      points.push({ from: r1.measured_at, to: r2.measured_at, area });
    }

    return { cumulative, points };
  }

  static async computeEWMA(deviceId, from, to, alpha = 0.3) {
    const readings = await SensorReading.findAll({
      where: { device_id: deviceId, measured_at: { [Op.between]: [from, to] } },
      order: [["measured_at", "ASC"]],
    });

    if (!readings || readings.length === 0) return { ewma: null, series: [] };

    let ewma = null;
    const series = [];
    for (const r of readings) {
      const v = this.normalize(Number(r.value), r.unit);
      if (ewma === null) ewma = v;
      else ewma = alpha * v + (1 - alpha) * ewma;
      series.push({ measured_at: r.measured_at, ewma });
    }

    return { ewma, series };
  }

  static async detectPeaks(deviceId, from, to, clusterWindowMinutes = 5) {
    const readings = await SensorReading.findAll({
      where: { device_id: deviceId, measured_at: { [Op.between]: [from, to] } },
      order: [["measured_at", "ASC"]],
    });

    if (!readings || readings.length < 3) return { peaks: [] };

    const values = readings.map((r) => this.normalize(Number(r.value), r.unit));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const threshold = mean + 2 * std;

    const rawPeaks = [];
    for (let i = 1; i < readings.length - 1; i++) {
      const v = values[i];
      if (v > values[i - 1] && v > values[i + 1] && v >= threshold) {
        rawPeaks.push({
          index: i,
          measured_at: readings[i].measured_at,
          value: v,
        });
      }
    }

    const clusters = [];
    for (const p of rawPeaks) {
      const t = new Date(p.measured_at).getTime();
      const last = clusters[clusters.length - 1];
      if (!last) {
        clusters.push({ start: p.measured_at, end: p.measured_at, peaks: [p] });
      } else {
        const lastEnd = new Date(last.end).getTime();
        if ((t - lastEnd) / (1000 * 60) <= clusterWindowMinutes) {
          last.end = p.measured_at;
          last.peaks.push(p);
        } else {
          clusters.push({
            start: p.measured_at,
            end: p.measured_at,
            peaks: [p],
          });
        }
      }
    }

    return { peaks: clusters };
  }

  static async predictTimeToThreshold(deviceId, threshold, from, to) {
    const readings = await SensorReading.findAll({
      where: { device_id: deviceId, measured_at: { [Op.between]: [from, to] } },
      order: [["measured_at", "ASC"]],
    });

    if (!readings || readings.length < 2) return { eta: null };

    const xs = readings.map(
      (r) => new Date(r.measured_at).getTime() / (1000 * 60 * 60)
    );
    const ys = readings.map((r) => this.normalize(Number(r.value), r.unit));

    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumXX = xs.reduce((s, x) => s + x * x, 0);

    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return { eta: null };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    if (slope <= 0) return { eta: null };

    const xTarget = (threshold - intercept) / slope;
    const etaMs = xTarget * 60 * 60 * 1000;
    const etaDate = new Date(etaMs);
    return { eta: etaDate.toISOString(), slope, intercept };
  }

  static async computeDeviceHealth(deviceId) {
    const last = await SensorReading.findOne({
      where: { device_id: deviceId },
      order: [["measured_at", "DESC"]],
    });

    const lastSeen = last ? new Date(last.measured_at) : null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count24 = await SensorReading.count({
      where: { device_id: deviceId, measured_at: { [Op.gte]: since } },
    });

    const expected = 24;
    const uptimePct = Math.min(100, Math.round((count24 / expected) * 100));

    const missingCount = Math.max(0, expected - count24);

    const health = {
      device_id: deviceId,
      last_seen: lastSeen,
      missing_count: missingCount,
      uptime_pct: uptimePct,
      avg_battery: null,
      error_count: 0,
      notes: null,
      checked_at: new Date(),
    };

    await DeviceHealth.upsert(health);
    return health;
  }

  static async detectExposureWindows(
    deviceId,
    from,
    to,
    threshold,
    maxHours = 24
  ) {
    const windows = [];
    const start = new Date(from);
    const end = new Date(to);

    for (let t = new Date(start); t < end; t.setHours(t.getHours() + 1)) {
      const windowStart = new Date(t);
      const windowEnd = new Date(
        Math.min(
          end,
          new Date(windowStart.getTime() + maxHours * 60 * 60 * 1000)
        )
      );
      const { cumulative } = await this.computeCumulativeDose(
        deviceId,
        windowStart.toISOString(),
        windowEnd.toISOString()
      );
      if (cumulative >= threshold) {
        windows.push({
          window_start: windowStart.toISOString(),
          window_end: windowEnd.toISOString(),
          cumulative,
        });
      }
    }

    return { windows };
  }
}

module.exports = ComputeService;
