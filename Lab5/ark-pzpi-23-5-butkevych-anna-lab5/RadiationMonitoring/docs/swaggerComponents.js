const tags = [
  {
    name: "Auth",
    description: "Authentication endpoints (register, login, user info)",
  },
  { name: "Users", description: "User management endpoints" },
  { name: "Devices", description: "Device management endpoints" },
  { name: "Readings", description: "Sensor readings endpoints" },
  { name: "Alerts", description: "Alerts and notifications" },
  { name: "Subscriptions", description: "User subscription endpoints" },
];

const components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
    deviceToken: {
      type: "apiKey",
      in: "header",
      name: "Device-Token",
    },
  },
  schemas: {
    User: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        email: { type: "string", format: "email" },
        name: { type: "string" },
        role: { type: "string" },
      },
    },
    Device: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        device_token: { type: "string" },
        is_active: { type: "boolean" },
      },
    },
    SensorReading: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        device_id: { type: "string", format: "uuid" },
        value: { type: "number" },
        unit: { type: "string" },
        measured_at: { type: "string", format: "date-time" },
      },
    },
    Alert: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        device_id: { type: "string", format: "uuid" },
        level: { type: "string" },
        message: { type: "string" },
        acknowledged: { type: "boolean" },
      },
    },
  },
};

module.exports = { tags, components };
