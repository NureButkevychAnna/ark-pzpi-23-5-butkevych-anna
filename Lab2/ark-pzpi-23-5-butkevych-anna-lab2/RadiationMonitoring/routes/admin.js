const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { User, ComputedReading, DeviceHealth, AuditLog } = require("../models");
const ComputeService = require("../services/ComputeService");

const router = express.Router();

const adminOnly = async (req, res, next) => {
  if (
    !req.user ||
    (req.user.role !== "admin" && req.user.role !== "superadmin")
  ) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

/**
 * @openapi
 * /api/admin/computed:
 *   get:
 *     tags: [Devices]
 *     summary: Get computed readings (paginated)
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: metric_type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: list of computed readings
 */
router.get("/computed", authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { device_id, metric_type } = req.query;
    const where = {};
    if (device_id) where.device_id = device_id;
    if (metric_type) where.metric_type = metric_type;
    const rows = await ComputedReading.findAll({
      where,
      order: [["window_start", "DESC"]],
      limit: 100,
    });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/compute/cumulative:
 *   post:
 *     tags: [Devices]
 *     summary: Trigger cumulative dose computation for a device
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_id:
 *                 type: string
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *     responses:
 *       200:
 *         description: computation result
 */
router.post(
  "/compute/cumulative",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const { device_id, from, to } = req.body;
      const result = await ComputeService.computeCumulativeDose(
        device_id,
        from,
        to
      );
      // store
      const created = await ComputedReading.create({
        device_id,
        window_start: from,
        window_end: to,
        metric_type: "cumulative_dose",
        value: result,
      });
      // audit
      try {
        await AuditLog.create({
          actor_type: "admin",
          actor_id: req.user && req.user.id,
          action: "compute_cumulative",
          resource: "computed_readings",
          resource_id: created.id,
          details: {
            device_id,
            from,
            to,
            summary: { cumulative: result.cumulative },
          },
          ip: req.ip,
        });
      } catch (e) {
        console.error("Failed to write audit log", e);
      }
      res.json({ result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/admin/compute/ewma:
 *   post:
 *     tags: [Devices]
 *     summary: Trigger EWMA computation for a device
 */
router.post(
  "/compute/ewma",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const { device_id, from, to, alpha } = req.body;
      const result = await ComputeService.computeEWMA(
        device_id,
        from,
        to,
        alpha
      );
      const created = await ComputedReading.create({
        device_id,
        window_start: from,
        window_end: to,
        metric_type: "ewma",
        value: result,
      });
      // audit
      try {
        await AuditLog.create({
          actor_type: "admin",
          actor_id: req.user && req.user.id,
          action: "compute_ewma",
          resource: "computed_readings",
          resource_id: created.id,
          details: { device_id, from, to, alpha },
          ip: req.ip,
        });
      } catch (e) {
        console.error("Failed to write audit log", e);
      }
      res.json({ result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/admin/device/{id}/health:
 *   get:
 *     tags: [Devices]
 *     summary: Get device health
 */
router.get(
  "/device/:id/health",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const health = await DeviceHealth.findOne({ where: { device_id: id } });
      res.json({ health });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @openapi
 * /api/admin/compute/health:
 *   post:
 *     tags: [Devices]
 *     summary: Recompute and store device health
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: device health
 */
router.post(
  "/compute/health",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const { device_id } = req.body;
      const health = await ComputeService.computeDeviceHealth(device_id);
      // audit
      try {
        await AuditLog.create({
          actor_type: "admin",
          actor_id: req.user && req.user.id,
          action: "compute_device_health",
          resource: "device_health",
          resource_id: null,
          details: { device_id, health },
          ip: req.ip,
        });
      } catch (e) {
        console.error("Failed to write audit log", e);
      }
      res.json({ health });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
