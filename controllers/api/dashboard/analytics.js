const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");

// exports.getActiveFaculty = (req, res, next) => {

// };

// exports.getActiveRoom = (req, res, next) => {

// };

exports.getUnloadedSchedule = async (req, res, next) => {
  try {
    const unloadedSchedule = await Curriculum.aggregate([
      {
        $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
      },
      {
        $unwind: "$semesters",
      },
      {
        $unwind: "$semesters.programs",
      },
      {
        $unwind: "$semesters.programs.year",
      },
      {
        $unwind: "$semesters.programs.year.sections",
      },
      {
        $unwind: "$semesters.programs.year.sections.schedules",
      },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
          "semesters.programs.year.sections.schedules.faculty": null,
          "semesters.programs.year.sections.schedules.day": { $ne: null },
        },
      },
    ]);
    res.status(200).json({ status: 200, data: unloadedSchedule.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: 0 });
  }
};

exports.getUnassgiendSchedule = async (req, res, next) => {
  try {
    const unassignedSchedule = await Curriculum.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      { $unwind: "$semesters.programs.year" },
      { $unwind: "$semesters.programs.year.sections" },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $project: {
          group: "$semesters.programs.year.sections._id",
          courses: "$semesters.programs.year.courses",
          schedules: "$semesters.programs.year.sections.schedules",
        },
      },
      {
        $group: {
          _id: "$group",
          courses: { $first: "$$ROOT.courses" },
          schedules: { $first: "$$ROOT.schedules" },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courses",
        },
      },
      // { $unwind: "$course" },
    ]);

    let ctr = 0;
    const currentCourseHourCount = {};

    unassignedSchedule.forEach((element) => {
      let hour;
      currentCourseHourCount[element._id] = {};
      element.courses.forEach((course) => {
        currentCourseHourCount[element._id][course._id] = {
          currentLecture: 0,
          maxLecture: course.lecture,
          currentLab: 0,
          maxLab: course.lab,
        };
      });

      element.schedules.forEach((schedule) => {
        if (schedule.type === "lecture") {
          currentCourseHourCount[element._id][schedule.course].currentLecture += schedule.hour;
          hour = Math.abs(
            currentCourseHourCount[element._id][schedule.course].currentLecture -
              currentCourseHourCount[element._id][schedule.course].maxLecture
          );
        } else {
          currentCourseHourCount[element._id][schedule.course].currentLab += schedule.hour;
          hour = Math.abs(
            currentCourseHourCount[element._id][schedule.course].currentLab -
              currentCourseHourCount[element._id][schedule.course].maxLab
          );
        }
      });
    });

    for (const key in currentCourseHourCount) {
      for (const otherKey in currentCourseHourCount[key]) {
        const lab = Math.abs(
          currentCourseHourCount[key][otherKey].currentLab - currentCourseHourCount[key][otherKey].maxLab
        );
        const lecture = Math.abs(
          currentCourseHourCount[key][otherKey].currentLecture - currentCourseHourCount[key][otherKey].maxLecture
        );
        if (lab !== 0) {
          ctr++;
        }
        if (lecture !== 0) {
          ctr++;
        }
      }
    }
    res.json({ status: 200, data: ctr });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: 0 });
  }
};
