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

function readJson(dir, file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

async function truncateAll(transaction) {
  // Truncate in dependency order to avoid FK issues (CASCADE as safety)
  const tables = [
    "audit_logs",
    "device_health",
    "computed_readings",
    "alerts",
    "sensor_readings",
    "subscriptions",
    "devices",
    "locations",
    "users",
  ];
  for (const t of tables) {
    await sequelize.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`, {
      transaction,
    });
  }
}

async function bulk(model, data, transaction) {
  if (!data || !data.length) return;
  await model.bulkCreate(data, { validate: false, transaction });
  console.log(`Imported ${data.length} into ${model.getTableName()}`);
}

async function main() {
  const dir = argValue("--in", path.join("dumps"));
  if (!fs.existsSync(dir)) {
    throw new Error(`Input directory not found: ${dir}`);
  }

  await sequelize.authenticate();

  const t = await sequelize.transaction();
  try {
    const mode = argValue("--mode", "replace"); // replace | append
    if (mode === "replace") {
      await truncateAll(t);
    }

    // Insert respecting FKs
    const users = readJson(dir, "users.json");
    const locations = readJson(dir, "locations.json");
    const devices = readJson(dir, "devices.json");
    const sensor_readings = readJson(dir, "sensor_readings.json");
    const alerts = readJson(dir, "alerts.json");
    const subscriptions = readJson(dir, "subscriptions.json");
    const computed_readings = readJson(dir, "computed_readings.json");
    const device_health = readJson(dir, "device_health.json");
    const audit_logs = readJson(dir, "audit_logs.json");

    await bulk(User, users, t);
    await bulk(Location, locations, t);
    await bulk(Device, devices, t);
    await bulk(SensorReading, sensor_readings, t);
    await bulk(Alert, alerts, t);
    await bulk(Subscription, subscriptions, t);
    await bulk(ComputedReading, computed_readings, t);
    await bulk(DeviceHealth, device_health, t);
    await bulk(AuditLog, audit_logs, t);

    await t.commit();
    console.log("Import completed.");
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("Import failed:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
