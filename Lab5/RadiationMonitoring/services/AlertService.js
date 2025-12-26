const {
  Alert,
  SensorReading,
  Device,
  Subscription,
  User,
} = require("../models");

class AlertService {
  static THRESHOLDS = {
    warning: 0.5, // 0.5 µSv/h
    danger: 2.0, // 2.0 µSv/h
    critical: 10.0, // 10.0 µSv/h
  };

  static async checkThresholds(reading) {
    const { value, unit, device_id } = reading;

    let normalizedValue = value;
    if (unit === "mSv/h") {
      normalizedValue = value * 1000; // mSv/h to µSv/h
    }

    let alertLevel = null;
    let message = "";

    if (normalizedValue >= this.THRESHOLDS.critical) {
      alertLevel = "critical";
      message = `CRITICAL: Radiation level ${normalizedValue} µSv/h detected`;
    } else if (normalizedValue >= this.THRESHOLDS.danger) {
      alertLevel = "danger";
      message = `DANGER: High radiation level ${normalizedValue} µSv/h detected`;
    } else if (normalizedValue >= this.THRESHOLDS.warning) {
      alertLevel = "warning";
      message = `WARNING: Elevated radiation level ${normalizedValue} µSv/h detected`;
    }

    if (alertLevel) {
      const alert = await Alert.create({
        device_id,
        reading_id: reading.id,
        level: alertLevel,
        message,
      });

      await this.checkSubscriptions(reading, alertLevel, normalizedValue);

      return alert;
    }

    return null;
  }

  static async checkSubscriptions(reading, alertLevel, normalizedValue) {
    try {
      const device = await Device.findByPk(reading.device_id, {
        include: ["owner"],
      });

      if (!device) return;

      const subscriptions = await Subscription.findAll({
        where: {
          user_id: device.owner_id,
          active: true,
        },
      });

      for (const subscription of subscriptions) {
        const criteria = subscription.criteria;

        if (this.matchesCriteria(criteria, alertLevel, normalizedValue)) {
          console.log(
            `Notification to be sent via ${subscription.channel} for user ${device.owner_id}`
          );

        }
      }
    } catch (error) {
      console.error("Error checking subscriptions:", error);
    }
  }

  static matchesCriteria(criteria, alertLevel, value) {
    if (!criteria) return false;

    if (criteria.levels && criteria.levels.includes(alertLevel)) {
      return true;
    }

    if (criteria.threshold && value >= criteria.threshold) {
      return true;
    }

    return false;
  }
}

module.exports = AlertService;
