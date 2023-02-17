const Curriculum = require("../../models/curriculum");
const Faculty = require("../../models/user");
const mongoose = require("mongoose");

exports.getSchedule = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: { "semesters._id": mongoose.Types.ObjectId(req.query.sem) },
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
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        program: "$semesters.programs.program",
        section: "$semesters.programs.year.sections._id",
        sectionName: "$semesters.programs.year.sections.section",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        level: "$semesters.programs.year.yearLevel",
        hour: "$semesters.programs.year.sections.schedules.hour",
        day: "$semesters.programs.year.sections.schedules.day",
        startTime: "$semesters.programs.year.sections.schedules.startTime",
        endTime: "$semesters.programs.year.sections.schedules.endTime",
        room: "$semesters.programs.year.sections.schedules.room",
        faculty: "$semesters.programs.year.sections.schedules.faculty",
        sort: "$semesters.programs.year.sections.schedules.type",
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
        from: "levels",
        localField: "level",
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
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        "course._id": mongoose.Types.ObjectId(req.query.course),
        day: { $ne: null },
        faculty: undefined,
      },
    },
    { $sort: { sort: 1 } },
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
      res.json({ ok: false });
    });
};

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
            currentCourseHourCount[element._id][
              schedule.course
            ].currentLecture += schedule.hour;
            hour = Math.abs(
              currentCourseHourCount[element._id][schedule.course]
                .currentLecture -
                currentCourseHourCount[element._id][schedule.course].maxLecture
            );
          } else {
            currentCourseHourCount[element._id][schedule.course].currentLab +=
              schedule.hour;
            hour = Math.abs(
              currentCourseHourCount[element._id][schedule.course].currentLab -
                currentCourseHourCount[element._id][schedule.course].maxLab
            );
          }
        });
      });
      for (const key in currentCourseHourCount) {
        for (const otherKey in currentCourseHourCount[key]) {
          console.log(`${otherKey}: ${currentCourseHourCount[key][otherKey]}`);
          const lab = Math.abs(
            currentCourseHourCount[key][otherKey].currentLab -
              currentCourseHourCount[key][otherKey].maxLab
          );
          const lecture = Math.abs(
            currentCourseHourCount[key][otherKey].currentLecture -
              currentCourseHourCount[key][otherKey].maxLecture
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
exports.getFacultyLoadableSchedules = (req, res, next) => {
  let academicQualification = [],
    courseTaken;
  Faculty.findOne({ _id: req.params.faculty })
    .populate("userInformation.academicQualifications.academicQualification")
    .populate("userInformation.academicQualifications.licenseIndustry")
    .populate("userInformation.courseTaken")
    .then((result) => {
      if (result.userInformation.academicQualifications) {
        academicQualification = result.userInformation.academicQualifications;
      } else {
        academicQualification = [];
      }
      courseTaken = result.userInformation.courseTaken;
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
        {
          $group: {
            _id: "$semesters.programs.year.sections.schedules.course",
            count: { $count: {} },
          },
        },

        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        // {
        //   $match: {
        //     "course.qualification.academicQualification": {
        //       $in: academicQualification.map((element) => {
        //         return element.academicQualification._id;
        //       }),
        //     },
        //   },
        // },
      ]);
    })
    .then((result) => {
      let filteredResult;
      academicQualification.forEach((element) => {
        filteredResult = result.filter((course) => {
          if (course.course.examination) {
            if (
              (course.course.qualification.degree <= element.degree ||
                course.course.qualification.experience <= element.experience ||
                course.course.qualification.licenseIndustry.some((r) => {
                  element.academicQualification.licenseIndustry.includes(r);
                })) &&
              courseTaken
                .map((element) => element._id.toString())
                .includes(course._id.toString())
            ) {
              return true;
            } else {
              return false;
            }
          } else {
            if (
              course.course.qualification.degree <= element.degree ||
              course.course.qualification.experience <= element.experience ||
              course.course.qualification.licenseIndustry.some((r) =>
                element.academicQualification.licenseIndustry.includes(r)
              ) ||
              courseTaken
                .map((e) => e._id.toString())
                .includes(course._id.toString())
            ) {
              return true;
            } else {
              return false;
            }
          }
        });
      });
      const filteredAcademicQualification = academicQualification.filter(
        (element) => {
          return result
            .map((element) => {
              return element.course.qualification.academicQualification;
            })
            .includes(element.academicQualification._id);
        }
      );
      res.json({ ok: true, data: filteredResult });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

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
  console.log(req.params.yearLevel);
  Curriculum.aggregate([
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(
          req.params.yearLevel
        ),
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
        "semesters.programs.year._id": mongoose.Types.ObjectId(
          req.params.yearLevel
        ),
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

exports.getOneSchedule = (req, res, next) => {
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
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        "semesters.programs.year.sections.schedules._id":
          mongoose.Types.ObjectId(req.params.schedule),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        program: "$semesters.programs.program",
        level: "$semesters.programs.year.year_level",
        sectionName: "$semesters.programs.year.sections.section",
        sectionID: "$semesters.programs.year.sections._id",
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
        from: "faculties",
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
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result[0] });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getRoomSchedule = (req, res, next) => {
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
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        // "semesters.programs.year.sections.schedules.faculty": { $ne: null },
        "semesters.programs.year.sections.schedules.room":
          mongoose.Types.ObjectId(req.params.room),
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
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.getRoomsSchedule = (req, res, next) => {
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
        group: "$semesters.programs.year.sections.schedules.room",
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
        from: "users",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$room",
        schedules: { $push: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "_id",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      console.log(result);
    })
    .then((error) => {
      console.log(error);
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
        "semesters.programs.year.sections.schedules.room":
          mongoose.Types.ObjectId(req.params.room),
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
        "semesters.programs.year.sections.schedules.faculty":
          mongoose.Types.ObjectId(req.params.faculty),
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
        "semesters.programs.year.sections.schedules.faculty":
          mongoose.Types.ObjectId(req.params.faculty),
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

exports.getSectionSchedule = (req, res, next) => {
  console.log(req.params);
  Curriculum.aggregate([
    {
      $match: {
        "semesters.programs.year.sections._id": mongoose.Types.ObjectId(
          req.params.section
        ),
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
      $match: {
        "semesters.programs.year.sections._id": mongoose.Types.ObjectId(
          req.params.section
        ),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections._id",
        program: "$semesters.programs.program",
        yearLevel: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        schedules: "$semesters.programs.year.sections.schedules",
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
        from: "levels",
        localField: "yearLevel",
        foreignField: "_id",
        as: "yearLevel",
      },
    },
    { $unwind: { path: "$yearLevel", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$schedules", preserveNullAndEmptyArrays: false } },
    {
      $project: {
        _id: "$schedules._id",
        program: "$program",
        yearLevel: "$yearLevel",
        sectionName: "$sectionName",
        sectionId: "$_id",
        course: "$schedules.course",
        type: "$schedules.type",
        hour: "$schedules.hour",
        startTime: "$schedules.startTime",
        endTime: "$schedules.endTime",
        day: "$schedules.day",
        room: "$schedules.room",
        faculty: "$schedules.faculty",
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
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$course._id",
        program: { $first: "$program" },
        yearLevel: { $first: "$yearLevel" },
        sectionName: { $first: "$sectionName" },
        course: { $first: "$course" },
        faculty: { $first: "$faculty" },
        schedules: {
          $push: {
            _id: "$_id",
            type: "$type",
            hour: "$hour",
            startTime: "$startTime",
            endTime: "$endTime",
            day: "$day",
            room: "$room",
          },
        },
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

exports.getGroupedSectionSchedule = (req, res, next) => {
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
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
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
        group: "$semesters.programs.year.sections._id",
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
      console.log(result);
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getGroupedFacultySchedule = (req, res, next) => {
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

exports.getGroupedRoomSchedule = (req, res, next) => {
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
        group: "$semesters.programs.year.sections.schedules.room",
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

exports.getGroupedScheduleFaculty = (req, res, next) => {
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
        "semesters.programs.year.sections.schedules.faculty":
          mongoose.Types.ObjectId(req.params.faculty),
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
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$course", data: { $push: "$$ROOT" } } },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      console.log(result[0].data);
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.getFacultiesSchedule = (req, res, next) => {
  if (!req.params.semester.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
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

exports.assignSchedule = (req, res, next) => {
  const id = new mongoose.Types.ObjectId();
  Curriculum.updateOne(
    {
      "semesters.programs.year.sections._id": req.params.section,
    },
    {
      $push: {
        "semesters.$[].programs.$[].year.$[].sections.$[section].schedules": {
          _id: id,
          course: req.body.course,
          type: req.body.courseType,
          hour: req.body.hour,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
          day: req.body.day,
          room: req.body.room,
          faculty: null,
        },
      },
    },
    { arrayFilters: [{ "section._id": req.params.section }], upsert: true }
  )
    .then((result) => {
      if (!result.modifiedCount) {
        return res.json({ status: 500 });
      }
      res.json({ status: 201, id: id });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500 });
    });
};

exports.reAssignSchedule = (req, res, next) => {
  console.log(req.params);
  Curriculum.updateOne(
    {
      "semesters.programs.year.sections._id": req.params.section,
    },
    {
      $set: {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].startTime":
          req.body.startTime,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].endTime":
          req.body.endTime,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].room":
          req.body.room,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty":
          null,
      },
    },
    { arrayFilters: [{ "schedule._id": req.params.schedule }] }
  )
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.loadSchedule = (req, res, next) => {
  Curriculum.updateOne(
    {
      "semesters.programs.year.sections.schedules._id": {
        $in: req.params.schedule.split(","),
      },
    },
    {
      $set: {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty":
          req.body.faculty,
      },
    },
    {
      arrayFilters: [
        {
          "schedule._id": {
            $in: req.params.schedule.split(","),
          },
        },
      ],
    }
  )
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.adjustSchedule = (req, res, next) => {
  let course;
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
        "semesters.programs.year.sections.schedules._id":
          mongoose.Types.ObjectId(req.params.schedule),
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        course: "$semesters.programs.year.sections.schedules.course",
      },
    },
  ])
    .then((result) => {
      course = result[0].course;
      return Curriculum.updateOne(
        {
          "semesters._id": req.params.semester,
        },
        {
          $set: {
            "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].starTime":
              req.body.startTime,
            "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].endTime":
              req.body.endTime,
            "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].room":
              req.body.room,
            "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].hour":
              req.body.hour,
            "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[course].faculty":
              null,
          },
        },
        {
          arrayFilters: [
            { "schedule._id": req.params.schedule },
            { "course.course": course },
          ],
        }
      );
    })
    .then((result) => {
      res.status(202).json({ status: 202, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
    });
};

exports.unassignSchedule = (req, res, next) => {
  Curriculum.updateOne(
    {
      "semesters.programs.year.sections.schedules._id": {
        $in: req.params.schedule.split(","),
      },
    },
    {
      $set: {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty":
          null,
      },
    },
    {
      arrayFilters: [
        { "schedule._id": { $in: req.params.schedule.split(",") } },
      ],
    }
  )
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, data: error });
    });
};

exports.deleteSchedule = (req, res, next) => {
  let course;
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
        "semesters.programs.year.sections.schedules._id":
          mongoose.Types.ObjectId(req.params.schedule),
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        course: "$semesters.programs.year.sections.schedules.course",
      },
    },
  ])
    .then((result) => {
      course = result[0].course;
      console.log("hello");
      return Curriculum.updateOne(
        {
          "semesters._id": req.params.semester,
        },
        {
          $pull: {
            "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules":
              {
                _id: req.params.schedule,
              },
          },
        },
        {
          arrayFilters: [
            { "schedule._id": req.params.schedule },
            { "semester._id": req.params.semester },
            { "course.course": course },
          ],
        }
      );
    })
    .then((result) => {
      console.log("test");
      return Curriculum.updateOne(
        {
          "semesters._id": req.params.semester,
        },
        {
          $set: {
            "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules.$[course].faculty":
              null,
          },
        },
        {
          arrayFilters: [
            { "schedule._id": req.params.schedule },
            { "semester._id": req.params.semester },
            { "course.course": course },
          ],
        }
      );
    })
    .then((result) => {
      console.log(result);
      if (!result.modifiedCount) {
        return res.json({ status: 500 });
      }
      res.json({ status: 202 });
    })
    .catch((error) => {
      res.json({ status: 500 });
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
