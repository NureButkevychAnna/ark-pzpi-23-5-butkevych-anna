const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SensorReading = sequelize.define(
  "SensorReading",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    device_id: { type: DataTypes.UUID, allowNull: false },
    measured_at: { type: DataTypes.DATE, allowNull: false },
    value: { type: DataTypes.FLOAT, allowNull: false },
    unit: { type: DataTypes.STRING, allowNull: false },
    metadata: { type: DataTypes.JSONB },
  },
  {
    tableName: "sensor_readings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = SensorReading;
