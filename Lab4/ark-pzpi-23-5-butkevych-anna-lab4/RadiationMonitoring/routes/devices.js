const express = require("express");
const crypto = require("crypto");
const { Device, Location, User } = require("../models");
const { authMiddleware } = require("../middleware/auth");
const { validate, deviceSchema } = require("../middleware/validation");

const router = express.Router();

/**
 * @openapi
 * /api/devices:
 *   get:
 *     tags: [Devices]
 *     summary: Get all devices for authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: List of devices
 *                 value:
 *                   devices:
 *                     - id: "uuid"
 *                       name: "Device 1"
 *                       device_token: "token"
 *                       is_active: true
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const where = {};
    if (
      !(
        req.user &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      )
    ) {
      where.owner_id = req.user.id;
    }
    const devices = await Device.findAll({
      where,
      include: [
        { model: Location, as: "location" },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({ devices });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/devices:
 *   post:
 *     tags: [Devices]
 *     summary: Create a new device
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location_id:
 *                 type: string
 *                 format: uuid
 *           examples:
 *             sample:
 *               summary: Create device payload
 *               value:
 *                 name: "Device 1"
 *                 location_id: "uuid"
 *     responses:
 *       201:
 *         description: Device created successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Created device
 *                 value:
 *                   message: Device created successfully
 *                   device:
 *                     id: "uuid"
 *                     name: "Device 1"
 *                     device_token: "token"
 */
router.post(
  "/",
  authMiddleware,
  validate(deviceSchema),
  async (req, res, next) => {
    try {
      const { name, location_id } = req.body;

      const device_token = crypto.randomBytes(32).toString("hex");

      const device = await Device.create({
        name,
        device_token,
        owner_id: req.user.id,
        location_id: location_id || null,
      });

      const createdDevice = await Device.findByPk(device.id, {
        include: [
          { model: Location, as: "location" },
          { model: User, as: "owner", attributes: ["id", "name", "email"] },
        ],
      });

      res.status(201).json({
        message: "Device created successfully",
        device: createdDevice,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Get device by ID
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
 *         description: Device details
 *       404:
 *         description: Device not found
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
      where.owner_id = req.user.id;
    }
    const device = await Device.findOne({
      where,
      include: [
        { model: Location, as: "location" },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json({ device });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/devices/{id}:
 *   put:
 *     tags: [Devices]
 *     summary: Update device
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location_id:
 *                 type: string
 *                 format: uuid
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 */
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { name, location_id, is_active } = req.body;

    const where = { id: req.params.id };
    if (
      !(
        req.user &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      )
    ) {
      where.owner_id = req.user.id;
    }
    const device = await Device.findOne({ where });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    await device.update({
      name: name || device.name,
      location_id: location_id !== undefined ? location_id : device.location_id,
      is_active: is_active !== undefined ? is_active : device.is_active,
    });

    const updatedDevice = await Device.findByPk(device.id, {
      include: [
        { model: Location, as: "location" },
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({
      message: "Device updated successfully",
      device: updatedDevice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/devices/{id}:
 *   delete:
 *     tags: [Devices]
 *     summary: Delete device
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
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    if (
      !(
        req.user &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      )
    ) {
      where.owner_id = req.user.id;
    }
    const device = await Device.findOne({ where });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    await device.destroy();

    res.json({ message: "Device deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
