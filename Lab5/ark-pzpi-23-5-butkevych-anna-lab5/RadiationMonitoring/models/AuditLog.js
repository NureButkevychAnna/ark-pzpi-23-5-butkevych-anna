const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actor_type: { type: DataTypes.STRING, allowNull: false },
    actor_id: { type: DataTypes.UUID },
    action: { type: DataTypes.STRING, allowNull: false },
    resource: { type: DataTypes.STRING },
    resource_id: { type: DataTypes.UUID },
    details: { type: DataTypes.JSONB },
    ip: { type: DataTypes.STRING },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = AuditLog;
