const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Device = sequelize.define(
  "Device",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    device_token: { type: DataTypes.STRING, unique: true, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    owner_id: { type: DataTypes.UUID, allowNull: false },
    location_id: { type: DataTypes.UUID, allowNull: true },
  },
  {
    tableName: "devices",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Device;
