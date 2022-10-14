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
                  section: { type: String, required: true },
                  schedules: [
                    {
                      course: {
                        type: mongoose.Types.ObjectId,
                        ref: "Course",
                        required: true,
                      },
                      type: {
                        type: String,
                        required: true,
                        enum: ["lab", "lecture"],
                      },
                      hour: {
                        type: Number,
                        required: true,
                      },
                      day: {
                        type: String,
                        enum: ["m", "t", "w", "th", "f", "s", null],
                        default: null,
                      },
                      start_time: {
                        type: String,
                        default: null,
                      },
                      end_time: {
                        type: String,
                        default: null,
                      },
                      room: {
                        type: mongoose.Types.ObjectId,
                        ref: "Room",
                        default: null,
                      },
                      faculty: {
                        type: mongoose.Types.ObjectId,
                        ref: "Faculty",
                        default: null,
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

CurriculumSchema.index({ course_code: "text", course_description: "text" });
module.exports = mongoose.model("Curriculum", CurriculumSchema);
