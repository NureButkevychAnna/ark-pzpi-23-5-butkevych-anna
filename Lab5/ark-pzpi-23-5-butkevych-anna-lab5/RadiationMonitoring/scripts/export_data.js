#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {
  sequelize,
  User,
  Device,
  Location,
  SensorReading,
  Alert,
  Subscription,
  AuditLog,
  ComputedReading,
  DeviceHealth,
} = require("../models");

function argValue(name, def) {
  const idx = process.argv.findIndex(
    (a) => a === name || a.startsWith(name + "=")
  );
  if (idx === -1) return def;
  const arg = process.argv[idx];
  if (arg.includes("=")) return arg.split("=")[1];
  return process.argv[idx + 1] || def;
}

async function main() {
  const outDir = argValue(
    "--out",
    path.join(
      "dumps",
      new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    )
  );
  fs.mkdirSync(outDir, { recursive: true });

  await sequelize.authenticate();

  async function dump(model, file) {
    const rows = await model.findAll();
    const data = rows.map((r) =>
      typeof r.toJSON === "function" ? r.toJSON() : r
    );
    const fpath = path.join(outDir, file);
    fs.writeFileSync(fpath, JSON.stringify(data, null, 2));
    console.log(`Exported ${data.length} -> ${fpath}`);
  }

  await dump(User, "users.json");
  await dump(Location, "locations.json");
  await dump(Device, "devices.json");
  await dump(SensorReading, "sensor_readings.json");
  await dump(Alert, "alerts.json");
  await dump(Subscription, "subscriptions.json");
  await dump(ComputedReading, "computed_readings.json");
  await dump(DeviceHealth, "device_health.json");
  await dump(AuditLog, "audit_logs.json");

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
