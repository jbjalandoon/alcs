const FacultyType = require("../models/faculty-type");

const facultyTypeSeeder = async () => {
  try {
    const facultyTypes = await FacultyType.bulkWrite([
      {
        updateOne: {
          filter: { facultyType: "regular full-time" },
          update: {
            facultyType: "regular full-time",
            unitsCap: 24,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { facultyType: "part-time full-load" },
          update: {
            facultyType: "part-time full-load",
            unitsCap: 24,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { facultyType: "part-time" },
          update: {
            facultyType: "part-time",
            unitsCap: 15,
          },
          upsert: true,
        },
      },
    ]);

    return facultyTypes;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = facultyTypeSeeder;
