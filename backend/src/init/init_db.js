const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const User = require("../models/User");
const Office = require("../models/Office");
const Service = require("../models/Service");
const Counter = require("../models/Counter");
const Token = require("../models/Token");

// Data files
const officeData = require("./data/officeData");
const serviceData = require("./data/serviceData");
const createCounterData = require("./data/counterData");
const userData = require("./data/userData");


// This script DELETES users, offices, services, counters and tokens before
// inserting demo data (with well-known demo passwords). It is for local /
// throwaway databases only, so it refuses to run unless explicitly confirmed.
const guardAgainstAccidentalRun = () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set (see backend/.env.example).");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed: NODE_ENV is 'production'.");
    process.exit(1);
  }

  if (!process.argv.includes("--confirm")) {
    console.error(
      "This will ERASE all users, offices, services, counters and tokens in the\n" +
        "database from MONGO_URI and insert demo data.\n" +
        "Re-run with --confirm to proceed:  npm run seed -- --confirm"
    );
    process.exit(1);
  }
};

const initDb = async () => {
  guardAgainstAccidentalRun();

  try {
    // CONNECT DATABASE

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // CLEAR EXISTING DATA

    await Token.deleteMany({}); // tokens would otherwise point at deleted records
    await User.deleteMany({});
    await Service.deleteMany({});
    await Counter.deleteMany({});
    await Office.deleteMany({});

    console.log("Old data cleared");

    // CREATE OFFICES

    const offices = await Office.insertMany(officeData);

    const revenueOffice = offices.find(
      (office) => office.type === "REVENUE"
    );

    const developmentOffice = offices.find(
      (office) => office.type === "DEVELOPMENT"
    );

    console.log("Offices created");

    // CREATE SERVICES

    const services = await Service.insertMany(
      serviceData(
        revenueOffice._id,
        developmentOffice._id
      )
    );

    console.log(`${services.length} services created`);

    // CREATE COUNTERS

    const counters = await Counter.insertMany(
      createCounterData(
        revenueOffice._id,
        developmentOffice._id
      )
    );

    console.log(`${counters.length} counters created`);

    // CREATE USERS
    for (const data of userData) {

      let officeId = null;
      let counterId = null;

      if (data.officeType) {

        const office = offices.find(
          (office) => office.type === data.officeType
        );

        officeId = office ? office._id : null;

        if (data.counterNumber && office) {

          const counter = counters.find(
            (counter) =>
              counter.officeId.toString() === office._id.toString() &&
              counter.number === data.counterNumber
          );

          counterId = counter ? counter._id : null;
        }
      }

      const user = new User({
        name: data.name,
        email: data.email.trim().toLowerCase(),
        role: data.role,
        phone: data.phone || undefined,
        officeId,
        counterId,
      });

      await User.register(user, data.password);
    }

    console.log(`${userData.length} users created`);

    // SUCCESS

    console.log("Database initialized successfully");

  } catch (error) {

    console.error(
      "Database initialization failed:",
      error
    );

    process.exitCode = 1;

  } finally {

    await mongoose.connection.close();

    console.log("MongoDB connection closed");
  }
};


initDb();