const jwt = require("jsonwebtoken");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({
          error: req.t
            ? req.t("errors.no_token")
            : "Access denied. No token provided.",
        });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({
        error: req.t ? req.t("errors.invalid_token") : "Invalid token.",
      });
  }
};

const deviceAuthMiddleware = async (req, res, next) => {
  try {
    const deviceToken = req.header("Device-Token");

    if (!deviceToken) {
      return res
        .status(401)
        .json({
          error: req.t
            ? req.t("errors.device_token_required")
            : "Device token required.",
        });
    }

    const { Device } = require("../models");
    const device = await Device.findOne({
      where: { device_token: deviceToken, is_active: true },
      include: ["owner"],
    });

    if (!device) {
      return res
        .status(401)
        .json({
          error: req.t
            ? req.t("errors.invalid_device_token")
            : "Invalid device token.",
        });
    }

    req.device = device;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid device token." });
  }
};

module.exports = { authMiddleware, deviceAuthMiddleware };
