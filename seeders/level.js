const Level = require("../models/level");

const levelSeeder = async () => {
  try {
    const yearLevel = await Level.bulkWrite([
      {
        updateOne: {
          filter: { yearLevel: "first year", display: 1 },
          update: {
            yearLevel: "first year",
            display: 1,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { yearLevel: "second year", display: 2 },
          update: {
            yearLevel: "second year",
            display: 2,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { yearLevel: "third year", display: 3 },
          update: {
            yearLevel: "third year",
            display: 3,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { yearLevel: "fourth year", display: 4 },
          update: {
            yearLevel: "fourth year",
            display: 4,
          },
          upsert: true,
        },
      },
    ]);

    return yearLevel;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = levelSeeder;
