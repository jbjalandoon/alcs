const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const CurriculumSchema = new Schema({
  schoolYear: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Year",
  },
  semesters: [
    {
      sem: {
        type: String,
      },
      activeFaculties: [
        {
          type: mongoose.Types.ObjectId,
          ref: "Faculty",
        },
      ],
      isActive: {
        type: Boolean,
        default: true,
      },
      programs: [
        {
          program: {
            type: mongoose.Types.ObjectId,
            ref: "Program",
          },
          year: [
            {
              yearLevel: { type: mongoose.Types.ObjectId, ref: "Level" },
              courses: [{ type: mongoose.Types.ObjectId, ref: "Course", default: null }],
              sections: [
                {
                  section: { type: String, required: true },
                  schedules: [
                    {
                      course: {
                        type: mongoose.Types.ObjectId,
                        ref: "Course",
                      },
                      type: {
                        type: String,
                      },
                      hour: {
                        type: Number,
                      },
                      startTime: {
                        type: String,
                      },
                      endTime: {
                        type: String,
                      },
                      day: {
                        type: Number,
                      },
                      room: {
                        type: mongoose.Types.ObjectId,
                        ref: "Room",
                      },
                      faculty: {
                        type: mongoose.Types.ObjectId,
                        ref: "User",
                      },
                      isOverload: {
                        type: Boolean,
                        default: false,
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
