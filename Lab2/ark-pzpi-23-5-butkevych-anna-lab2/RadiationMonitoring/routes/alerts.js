const express = require("express");
const { Alert, Device, SensorReading } = require("../models");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Get alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: acknowledged
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: list of alerts
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Alerts list
 *                 value:
 *                   alerts:
 *                     - id: "uuid"
 *                       level: "warning"
 *                       message: "High reading"
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { level, acknowledged, limit = 50 } = req.query;

    const whereConditions = {};
    if (
      !(
        req.user &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      )
    ) {
      const userDevices = await Device.findAll({
        where: { owner_id: req.user.id },
        attributes: ["id"],
      });
      const deviceIds = userDevices.map((d) => d.id);
      whereConditions.device_id = deviceIds;
    }

    if (level) {
      whereConditions.level = level;
    }

    if (acknowledged !== undefined) {
      whereConditions.acknowledged = acknowledged === "true";
    }

    const alerts = await Alert.findAll({
      where: whereConditions,
      include: [
        {
          model: Device,
          as: "device",
          attributes: ["id", "name"],
        },
        {
          model: SensorReading,
          as: "reading",
          attributes: ["id", "value", "unit", "measured_at"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
    });

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/alerts/{id}:
 *   get:
 *     tags: [Alerts]
 *     summary: Get alert by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: alert
 *       404:
 *         description: not found
 */
router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (
      !(
        req.user &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      )
    ) {
      const userDevices = await Device.findAll({
        where: { owner_id: req.user.id },
        attributes: ["id"],
      });
      const deviceIds = userDevices.map((d) => d.id);
      where.device_id = deviceIds;
    }

    const alert = await Alert.findOne({
      where,
      include: [
        {
          model: Device,
          as: "device",
          attributes: ["id", "name"],
        },
        {
          model: SensorReading,
          as: "reading",
          attributes: ["id", "value", "unit", "measured_at"],
        },
      ],
    });

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/alerts/{id}/ack:
 *   post:
 *     tags: [Alerts]
 *     summary: Acknowledge alert
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: acknowledged
 *       404:
 *         description: Alert not found
 */
router.post("/:id/ack", authMiddleware, async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (
      !(
        req.user &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      )
    ) {
      const userDevices = await Device.findAll({
        where: { owner_id: req.user.id },
        attributes: ["id"],
      });
      const deviceIds = userDevices.map((d) => d.id);
      where.device_id = deviceIds;
    }

    const alert = await Alert.findOne({ where });

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    await alert.update({
      acknowledged: true,
      acknowledged_at: new Date(),
    });

    const updatedAlert = await Alert.findOne({
      where: { id: alert.id },
      include: [
        {
          model: Device,
          as: "device",
          attributes: ["id", "name"],
        },
        {
          model: SensorReading,
          as: "reading",
          attributes: ["id", "value", "unit", "measured_at"],
        },
      ],
    });

    res.json({
      message: "Alert acknowledged successfully",
      alert: updatedAlert,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
