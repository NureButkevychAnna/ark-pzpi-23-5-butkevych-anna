require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { tags, components } = require("./docs/swaggerComponents");
const { i18next, middleware: i18nMiddleware } = require("./i18n");

const app = express();
app.use(cors());
app.use(express.json());
app.use(i18nMiddleware.handle(i18next));

app.get("/", (req, res) => res.json({ ok: true, time: new Date() }));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Radiation Monitoring API",
      version: "1.0.0",
      description: "API for radiation monitoring system with real-time alerts",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    tags,
    components,
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/**/*.js"],
};
const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/devices", require("./routes/devices"));
app.use("/api/readings", require("./routes/readings"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/admin", require("./routes/admin"));

app.use(require("./middleware/errorHandler"));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Postgres connected");
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start", err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
