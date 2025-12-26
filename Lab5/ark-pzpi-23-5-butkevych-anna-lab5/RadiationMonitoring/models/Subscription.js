const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Subscription = sequelize.define(
  "Subscription",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    channel: { type: DataTypes.STRING, allowNull: false },
    criteria: { type: DataTypes.JSONB },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "subscriptions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Subscription;
