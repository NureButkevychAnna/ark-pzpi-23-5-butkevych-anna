const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ComputedReading = sequelize.define(
  "ComputedReading",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    device_id: { type: DataTypes.UUID },
    window_start: { type: DataTypes.DATE, allowNull: false },
    window_end: { type: DataTypes.DATE, allowNull: false },
    metric_type: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.JSONB },
  },
  {
    tableName: "computed_readings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = ComputedReading;
