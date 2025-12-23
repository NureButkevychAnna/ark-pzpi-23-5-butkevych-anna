const { sequelize, User, Device } = require("../models");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

async function create() {
  await sequelize.authenticate();
  console.log("DB connected");

  const email = process.env.DEMO_USER_EMAIL || "demo@local";
  const password = process.env.DEMO_USER_PASSWORD || "password";

  let user = await User.findOne({ where: { email } });
  if (!user) {
    const hash = bcrypt.hashSync(password, 8);
    user = await User.create({
      email,
      password_hash: hash,
      name: "Demo User",
      role: "admin",
    });
    console.log("Created user", user.id, email);
  } else {
    console.log("User exists", user.id, email);
  }

  const deviceToken = process.env.DEVICE_TOKEN || `demo-device-${uuidv4()}`;
  let device = await Device.findOne({ where: { device_token: deviceToken } });
  if (!device) {
    device = await Device.create({
      name: "simulator-device-1",
      device_token: deviceToken,
      owner_id: user.id,
    });
    console.log("Created device", device.id);
  } else {
    console.log("Device exists", device.id);
  }

  console.log("DEVICE_TOKEN=" + deviceToken);
  process.exit(0);
}

create().catch((err) => {
  console.error(err);
  process.exit(1);
});
