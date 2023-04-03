const mongoose = require("mongoose");
const facultyTypeSeeder = require("./faculty-type");
const userSeeder = require("./superadmin");
const levelSeeder = require("./level");
require("dotenv").config();

(async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.DB);
    const facultyType = await facultyTypeSeeder();
    const user = await userSeeder();
    const level = await levelSeeder();

    console.log(facultyType);
    console.log(user);
    console.log(level);
    mongoose.disconnect();
  } catch (error) {
    console.log(error);
  }
})();
