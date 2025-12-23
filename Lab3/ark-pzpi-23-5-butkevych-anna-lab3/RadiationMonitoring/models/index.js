const sequelize = require("../db");

const User = require("./User");
const Device = require("./Device");
const Location = require("./Location");
const SensorReading = require("./SensorReading");
const Alert = require("./Alert");
const Subscription = require("./Subscription");
const AuditLog = require("./AuditLog");
const ComputedReading = require("./ComputedReading");
const DeviceHealth = require("./DeviceHealth");

User.hasMany(Device, { foreignKey: "owner_id", as: "devices" });
User.hasMany(Subscription, { foreignKey: "user_id", as: "subscriptions" });

Device.belongsTo(User, { foreignKey: "owner_id", as: "owner" });
Device.belongsTo(Location, { foreignKey: "location_id", as: "location" });
Device.hasMany(SensorReading, { foreignKey: "device_id", as: "readings" });
Device.hasMany(Alert, { foreignKey: "device_id", as: "alerts" });
Device.hasMany(ComputedReading, { foreignKey: "device_id", as: "computed" });
Device.hasOne(DeviceHealth, { foreignKey: "device_id", as: "health" });

Location.hasMany(Device, { foreignKey: "location_id", as: "devices" });

SensorReading.belongsTo(Device, { foreignKey: "device_id", as: "device" });
SensorReading.hasMany(Alert, { foreignKey: "reading_id", as: "alerts" });

Alert.belongsTo(Device, { foreignKey: "device_id", as: "device" });
Alert.belongsTo(SensorReading, { foreignKey: "reading_id", as: "reading" });

Subscription.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
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
};
