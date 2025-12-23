const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Alert = sequelize.define(
  "Alert",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    device_id: { type: DataTypes.UUID, allowNull: false },
    reading_id: { type: DataTypes.UUID, allowNull: true },
    level: { type: DataTypes.STRING, allowNull: false }, // warning, danger, critical
    message: { type: DataTypes.TEXT, allowNull: false },
    acknowledged: { type: DataTypes.BOOLEAN, defaultValue: false },
    acknowledged_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "alerts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Alert;
