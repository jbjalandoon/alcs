const Curriculum = require("../../models/curriculum");
const Faculty = require("../../models/user");
const mongoose = require("mongoose");
const io = require("../../socket");

/**
 * Returns all of the schedules without time and day
 * @URLParameters {ObjectID} semester - for selecting only the active semester
 */
exports.getAllAssignableSchedules = (req, res, next) => {
  Curriculum.aggregate([
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
  ])
    .then((result) => {
      ctr = 0;
      const currentCourseHourCount = {};
      result.forEach((element) => {
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
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

/**
 * Returns all of the schedules without faculty and filtered for the faculty
 * @URLParameters {ObjectID} semester - for selecting only the active semester
 * @URLParameters {ObjectID} faculty - for selecting only the courses that is qualified for the faculty
 */

/**
 * Returns all of the schedules with faculty
 * @URLParameters {ObjectID} semester - for selecting only the active semester
 * @URLParameters {ObjectID} faculty - for selecting only the courses that is qualified for the faculty
 */
exports.getAllLoadableSchedules = (req, res, next) => {
  return Curriculum.aggregate([
    {
      $match: { "semesters._id": mongoose.Types.ObjectId(req.params.sem) },
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
        "semesters._id": mongoose.Types.ObjectId(req.params.sem),
        "semesters.programs.year.sections.schedules.faculty": null,
        "semesters.programs.year.sections.schedules.day": { $ne: null },
      },
    },
  ])
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
      console.log(error);
    });
};

exports.getYearLevelSchedules = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(req.params.yearLevel),
      },
    },
    {
      $unwind: "$semesters",
    },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    { $unwind: "$semesters.programs.year.sections" },
    {
      $unwind: "$semesters.programs.year.sections.schedules",
    },
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(req.params.yearLevel),
      },
    },

    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        section_name: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        start_time: "$semesters.programs.year.sections.schedules.start_time",
        end_time: "$semesters.programs.year.sections.schedules.end_time",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $match: {
        day: { $ne: null },
        faculty: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },

    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$section",
        schedules: { $push: "$$ROOT" },
      },
    },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, data: error });
    });
};

exports.getFinishedRoomSchedule = (req, res, next) => {
  Curriculum.aggregate([
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
        "semesters.programs.year.sections.schedules.faculty": { $ne: null },
        "semesters.programs.year.sections.schedules.room": mongoose.Types.ObjectId(req.params.room),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        level: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "level",
        foreignField: "_id",
        as: "level",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getFacultySchedule = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
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
        "semesters.programs.year.sections.schedules.faculty": mongoose.Types.ObjectId(req.params.faculty),
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        yearLevel: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "yearLevel",
        foreignField: "_id",
        as: "level",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getFacultyScheduleUnitHour = (req, res, next) => {
  console.log(req.params);
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
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
        "semesters.programs.year.sections.schedules.faculty": mongoose.Types.ObjectId(req.params.faculty),
        // "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $group: {
        _id: "$semesters.programs.year.sections.schedules.faculty",
        hours: { $sum: "$semesters.programs.year.sections.schedules.hour" },
      },
    },
    // {
    //   $match: {
    //     "semesters.programs.year.sections.schedules.faculty":
    //       mongoose.Types.ObjectId(req.params.faculty),
    //     // "semesters._id": mongoose.Types.ObjectId(req.params.semester),
    //   },
    // },
    // },
    // {
    //   $project: {
    //     hour: "$semesters.programs.year.sections.schedules.hour",
    //     faculty: "$semesters.programs.year.sections.schedules.faculty",
    //   },
    // },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getGroupedAllFacultySchedule = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
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
        "semesters.programs.year.sections.schedules.faculty": { $ne: null },
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        yearLevel: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
        group: "$semesters.programs.year.sections.schedules.faculty",
      },
    },

    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "yearLevel",
        foreignField: "_id",
        as: "level",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$group",
        data: { $push: "$$ROOT" },
      },
    },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getGroupedCourseAllScheduleFaculty = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
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
        "semesters.programs.year.sections.schedules.faculty": { $ne: null },
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        yearLevel: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "yearLevel",
        foreignField: "_id",
        as: "level",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $group: { _id: { faculty: "$faculty", course: "$course" }, data: { $push: "$$ROOT" } } },
    { $group: { _id: "$_id.faculty", schedule: { $push: { course: "$_id.course", data: "$data" } } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "faculty",
      },
    },

    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$schedule.course", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      const returnResult = result.map((element) => {
        return {
          _id: element._id,
          schedule: element.schedule.map((element) => {
            return {
              course: element.course[0],
              data: element.data,
            };
          }),
          faculty: element.faculty,
        };
      });
      res.json({ status: 200, data: returnResult });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getGroupedCourseAllScheduleSection = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
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
        "semesters.programs.year.sections.schedules.faculty": { $ne: null },
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        yearLevel: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "yearLevel",
        foreignField: "_id",
        as: "level",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $group: { _id: { section: "$section", course: "$course" }, data: { $push: "$$ROOT" } } },
    { $group: { _id: "$_id.section", schedule: { $push: { course: "$_id.course", data: "$data" } } } },
    { $unwind: { path: "$schedule.course", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      const returnResult = result.map((element) => {
        return {
          _id: element._id,
          schedule: element.schedule.map((element) => {
            return {
              course: element.course[0],
              data: element.data,
            };
          }),
          faculty: element.faculty,
        };
      });
      res.json({ status: 200, data: returnResult });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getFacultiesSchedule = (req, res, next) => {
  if (!req.params.semester.match(/^[0-9a-fA-F]{24}$/)) return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    { $unwind: "$semesters.programs.year.sections" },
    { $unwind: "$semesters.programs.year.sections.schedules" },
    {
      $match: {
        "semesters.programs.year.sections.schedules.faculty": { $ne: null },
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        section_name: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        start_time: "$semesters.programs.year.sections.schedules.start_time",
        end_time: "$semesters.programs.year.sections.schedules.end_time",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, data: error });
    });
};

exports.getUnassignedSchedules = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    { $unwind: "$semesters.programs.year.sections" },
    { $unwind: "$semesters.programs.year.sections.schedules" },
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        "semesters.programs.year.sections.schedules.day": null,
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        section_name: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        start_time: "$semesters.programs.year.sections.schedules.start_time",
        end_time: "$semesters.programs.year.sections.schedules.end_time",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$course._id",
        schedules: { $push: "$$ROOT" },
      },
    },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res, json({ ok: false, data: error });
    });
};

exports.getUnloadedSchedules = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    { $unwind: "$semesters.programs.year.sections" },
    { $unwind: "$semesters.programs.year.sections.schedules" },
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        "semesters.programs.year.sections.schedules.day": { $ne: null },
        "semesters.programs.year.sections.schedules.faculty": null,
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        sectionName: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res, json({ ok: false, data: error });
    });
};
