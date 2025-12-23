const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const DeviceHealth = sequelize.define(
  "DeviceHealth",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    device_id: { type: DataTypes.UUID, allowNull: false },
    last_seen: { type: DataTypes.DATE },
    missing_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    uptime_pct: { type: DataTypes.DECIMAL },
    avg_battery: { type: DataTypes.DECIMAL },
    error_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    notes: { type: DataTypes.JSONB },
    checked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "device_health",
    timestamps: false,
  }
);

module.exports = DeviceHealth;
