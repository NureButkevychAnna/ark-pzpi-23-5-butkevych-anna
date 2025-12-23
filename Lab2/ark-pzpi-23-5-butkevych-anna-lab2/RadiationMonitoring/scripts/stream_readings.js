const { sequelize, SensorReading, Device, Alert } = require("../models");

const POLL_MS = process.env.POLL_MS ? parseInt(process.env.POLL_MS) : 2000;

let lastSeen = null; 
let lastSeenAlert = null;

async function init() {
  await sequelize.authenticate();
  console.log("Connected to DB, starting read loop...");

  const latest = await SensorReading.findOne({
    order: [["measured_at", "DESC"]],
  });
  if (latest) lastSeen = latest.measured_at;

  const latestAlert = await Alert.findOne({ order: [["created_at", "DESC"]] });
  if (latestAlert) lastSeenAlert = latestAlert.created_at;

  setInterval(poll, POLL_MS);
}

async function poll() {
  try {
    const where = lastSeen
      ? { measured_at: { [require("sequelize").Op.gt]: lastSeen } }
      : {};
    const rows = await SensorReading.findAll({
      where,
      include: [{ model: Device, as: "device", attributes: ["id", "name"] }],
      order: [["measured_at", "ASC"]],
    });

    for (const r of rows) {
      const obj = r.toJSON();
      console.log("New reading ->", JSON.stringify(obj));
      lastSeen = obj.measured_at;
    }

    const alertWhere = lastSeenAlert
      ? { created_at: { [require("sequelize").Op.gt]: lastSeenAlert } }
      : {};
    const alerts = await Alert.findAll({
      where: alertWhere,
      include: [
        { model: Device, as: "device", attributes: ["id", "name"] },
        { model: SensorReading, as: "reading" },
      ],
      order: [["created_at", "ASC"]],
    });

    for (const a of alerts) {
      const ao = a.toJSON();
      console.log("New alert ->", JSON.stringify(ao));
      lastSeenAlert = ao.created_at;
    }
  } catch (err) {
    console.error("Error polling readings:", err);
  }
}

init().catch((err) => {
  console.error("Failed to start stream:", err);
  process.exit(1);
});
