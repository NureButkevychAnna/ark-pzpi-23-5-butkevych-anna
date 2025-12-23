const express = require("express");
const { Subscription } = require("../models");
const { authMiddleware } = require("../middleware/auth");
const { validate, subscriptionSchema } = require("../middleware/validation");

const router = express.Router();

/**
 * @openapi
 * /api/subscriptions:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channel:
 *                 type: string
 *               criteria:
 *                 type: object
 *     responses:
 *       201:
 *         description: created
 */
router.post(
  "/",
  authMiddleware,
  validate(subscriptionSchema),
  async (req, res, next) => {
    try {
      const { channel, criteria, active = true } = req.body;

      const subscription = await Subscription.create({
        user_id: req.user.id,
        channel,
        criteria,
        active,
      });

      res.status(201).json({
        message: "Subscription created successfully",
        subscription,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/subscriptions:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscriptions for user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: list
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Subscriptions list
 *                 value:
 *                   subscriptions:
 *                     - id: "uuid"
 *                       channel: email
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.user.id },
      order: [["created_at", "DESC"]],
    });

    res.json({ subscriptions });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/subscriptions/{id}:
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Delete subscription
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
 *         description: deleted
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    await subscription.destroy();

    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/subscriptions/{id}:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: updated
 */
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { channel, criteria, active } = req.body;

    const subscription = await Subscription.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    await subscription.update({
      channel: channel || subscription.channel,
      criteria: criteria || subscription.criteria,
      active: active !== undefined ? active : subscription.active,
    });

    res.json({
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
