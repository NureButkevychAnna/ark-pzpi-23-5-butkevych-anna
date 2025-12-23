const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../middleware/validation");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *           examples:
 *             sample:
 *               summary: Sample register payload
 *               value:
 *                 email: user@example.com
 *                 password: password123
 *                 name: Example User
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   message: User registered successfully
 *                   user:
 *                     id: "uuid"
 *                     email: user@example.com
 *                     name: Example User
 *                   token: "<jwt>"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           examples:
 *             sample:
 *               summary: Sample login payload
 *               value:
 *                 email: user@example.com
 *                 password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   message: Login successful
 *                   user:
 *                     id: "uuid"
 *                     email: user@example.com
 *                   token: "<jwt>"
 *       400:
 *         description: Invalid credentials
 */
router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      email,
      password_hash,
      name,
      role: role || "user",
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           examples:
 *             sample:
 *               summary: Sample login payload
 *               value:
 *                 email: user@example.com
 *                 password: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: Successful login
 *                 value:
 *                   message: Login successful
 *                   user:
 *                     id: "uuid"
 *                     email: user@example.com
 *                   token: "<jwt>"
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user (client-side token clear)
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", authMiddleware, async (req, res) => {
  res.json({ message: "Logged out" });
});

/**
 * @openapi
 * /api/auth/users/{id}:
 *   get:
 *     tags: [Auth]
 *     summary: Get user by id (protected)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: user info
 */
router.get("/users/:id", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "email", "name", "role"],
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
