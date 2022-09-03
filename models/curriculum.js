const { default: mongoose } = require("mongoose");
const monmgoose = require("mongoose");

const Schema = mongoose.Schema;

const CurriculumSchema = new Schema({
  school_year: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Year",
  },
  semesters: [
    {
      sem: {
        type: String,
      },
      programs: [
        {
          program: {
            type: mongoose.Types.ObjectId,
            ref: "Program",
          },
          year: [
            {
              year_level: { type: mongoose.Types.ObjectId, ref: "Level" },
              courses: [{ type: mongoose.Types.ObjectId, ref: "Course" }],
              sections: [
                {
                  type: String,
                  schedules: [
                    {
                      course: { type: mongoose.Types.ObjectId, ref: "Course" },
                      day: {
                        type: String,
                        enum: ["m", "t", "w", "th", "f", "s"],
                      },
                      start_time: {
                        type: Date,
                      },
                      end_time: {
                        type: Date,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Curriculum", CurriculumSchema);
