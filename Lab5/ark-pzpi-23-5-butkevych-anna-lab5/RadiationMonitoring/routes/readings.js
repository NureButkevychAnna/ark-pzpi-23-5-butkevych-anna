const express = require("express");
const { SensorReading, Device } = require("../models");
const { deviceAuthMiddleware } = require("../middleware/auth");
const { validate, readingSchema } = require("../middleware/validation");
const AlertService = require("../services/AlertService");

const router = express.Router();

/**
 * @openapi
 * /api/readings:
 *   post:
 *     tags: [Readings]
 *     summary: Submit a new sensor reading (device token required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               measured_at:
 *                 type: string
 *                 format: date-time
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Reading accepted
 */
router.post(
  "/",
  deviceAuthMiddleware,
  validate(readingSchema),
  async (req, res, next) => {
    try {
      const { measured_at, value, unit, metadata } = req.body;

      const reading = await SensorReading.create({
        device_id: req.device.id,
        measured_at,
        value,
        unit,
        metadata,
      });

      const alert = await AlertService.checkThresholds(reading);

      const response = {
        message: "Reading recorded successfully",
        reading: reading,
      };

      if (alert) {
        response.alert = {
          id: alert.id,
          level: alert.level,
          message: alert.message,
        };
      }

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/readings:
 *   get:
 *     tags: [Readings]
 *     summary: Get readings for user's devices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Filter by device ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of readings to return
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get readings since this date
 *     responses:
 *       200:
 *         description: List of readings
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Readings list
 *                 value:
 *                   readings:
 *                     - id: "uuid"
 *                       device_id: "uuid"
 *                       value: 0.8
 */
router.get(
  "/",
  require("../middleware/auth").authMiddleware,
  async (req, res, next) => {
    try {
      const { device_id, limit = 100, since } = req.query;

      const whereConditions = {};
      if (since) {
        whereConditions.measured_at = {
          [require("sequelize").Op.gte]: new Date(since),
        };
      }
      if (device_id) {
        whereConditions.device_id = device_id;
      }

      const userDevices = await Device.findAll({
        where: { owner_id: req.user.id },
        attributes: ["id"],
      });

      const deviceIds = userDevices.map((d) => d.id);

      if (device_id && !deviceIds.includes(device_id)) {
        return res.status(403).json({ error: "Access denied to this device" });
      }

      if (!device_id) {
        whereConditions.device_id = deviceIds;
      }

      const readings = await SensorReading.findAll({
        where: whereConditions,
        include: [
          {
            model: Device,
            as: "device",
            attributes: ["id", "name"],
          },
        ],
        order: [["measured_at", "DESC"]],
        limit: parseInt(limit),
      });

      res.json({ readings });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
