const Schedule = require("../../../models/curriculum");
const io = require("../../../socket");
const mongoose = require("mongoose");

exports.getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.aggregate([
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
          isOverload: "$semesters.programs.year.sections.schedules.isOverload",
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
      { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    ]);

    return res.status(200).json({ schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getUnits = async (req, res, next) => {
  try {
    const [schedules] = await Schedule.aggregate([
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
          course: "$semesters.programs.year.sections.schedules.course",
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
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { section: "$section", course: "$course._id" },
          faculty: { $first: "$faculty" },
          units: { $first: "$course.units" },
        },
      },
      {
        $group: {
          _id: "$faculty",
          units: { $sum: "$units" },
        },
      },
    ]);
    console.log(schedules);
    if (!schedules) {
      return res.json({ units: 0 });
    }
    res.json({ units: schedules.units });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getLoadableCourses = async (req, res, next) => {
  try {
    // let academicQualification = [],
    //   courseTaken;
    // Faculty.findOne({ _id: req.params.faculty })
    //   .populate("userInformation.academicQualifications.academicQualification")
    //   .populate("userInformation.academicQualifications.licenseIndustry")
    //   .populate("userInformation.courseTaken")
    // if (result.userInformation.academicQualifications) {
    //   academicQualification = result.userInformation.academicQualifications;
    // } else {
    //   academicQualification = [];
    // }
    // courseTaken = result.userInformation.courseTaken;
    const courses = await Schedule.aggregate([
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
          "semesters.programs.year.sections.schedules.faculty": null,
          "semesters.programs.year.sections.schedules.day": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$semesters.programs.year.sections.schedules.course",
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

    // let filteredResult;
    // academicQualification.forEach((element) => {
    //   filteredResult = result.filter((course) => {
    //     if (course.course.examination) {
    //       let licenseIndustryBool = false;
    //       if (course.course.qualification.licenseIndustry) {
    //         licenseIndustryBool =
    //           course.course.qualification.licenseIndustry.some((r) =>
    //             element.academicQualification.licenseIndustry.includes(r)
    //           );
    //       }
    //       if (
    //         (course.course.qualification.degree <= element.degree ||
    //           course.course.qualification.experience <= element.experience ||
    //           licenseIndustryBool) &&
    //         courseTaken
    //           .map((element) => element._id.toString())
    //           .includes(course._id.toString())
    //       ) {
    //         return true;
    //       } else {
    //         return false;
    //       }
    //     } else {
    //       let licenseIndustryBool = false;
    //       if (course.course.qualification.licenseIndustry) {
    //         licenseIndustryBool =
    //           course.course.qualification.licenseIndustry.some((r) =>
    //             element.academicQualification.licenseIndustry.includes(r)
    //           );
    //       }
    //       if (
    //         course.course.qualification.degree <= element.degree ||
    //         course.course.qualification.experience <= element.experience ||
    //         licenseIndustryBool ||
    //         courseTaken
    //           .map((e) => e._id.toString())
    //           .includes(course._id.toString())
    //       ) {
    //         return true;
    //       } else {
    //         return false;
    //       }
    //     }
    //   });
    // });
    // const filteredAcademicQualification = academicQualification.filter((element) => {
    //   return result
    //     .map((element) => {
    //       return element.course.qualification.academicQualification;
    //     })
    //     .includes(element.academicQualification._id);
    // });
    // console.log(filteredResult);
    res.json({ courses: courses.map(({ course }) => course) });
    // res.json({ ok: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getLoadableSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.aggregate([
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
          from: "users",
          localField: "faculty",
          foreignField: "_id",
          as: "faculty",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "course._id": mongoose.Types.ObjectId(req.params.course),
          day: { $ne: null },
          faculty: undefined,
        },
      },
      { $sort: { sort: 1 } },
      {
        $group: {
          _id: "$section",
          lab: { $first: "$course.lab" },
          lecture: { $first: "$course.lecture" },
          currentHour: { $sum: "$hour" },
          schedules: { $push: "$$ROOT" },
        },
      },
    ]);

    const filteredResult = schedules.filter(
      (e) => e.currentHour === e.lab + e.lecture
    );

    res.status(200).json({ schedules: filteredResult });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.loadSchedule = async (req, res, next) => {
  try {
    const load = await Schedule.updateOne(
      {
        "semesters.programs.year.sections.schedules._id": {
          $in: req.params.schedule.split(","),
        },
      },
      {
        $set: {
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty":
            req.body.faculty,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].isOverload":
            req.body.isOverload,
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
    );

    res.status(200).json({ msg: "Successfully Loaded" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.unloadSchedule = async (req, res, next) => {
  try {
    let set;
    if (req.headers.isOverload) {
      set = {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty":
          null,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].isOverload": false,
      };
    } else {
      set = {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty":
          null,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[].isOverload": false,
      };
    }

    await Schedule.updateOne(
      {
        "semesters.programs.year.sections.schedules._id": {
          $in: req.params.schedule.split(","),
        },
      },
      {
        $set: set,
      },
      {
        arrayFilters: [
          { "schedule._id": { $in: req.params.schedule.split(",") } },
        ],
      }
    );

    res.status(200).json({ msg: "Successfully unloaded the schedule" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getSchedulesByCourse = async (req, res, next) => {
  try {
    const courses = await Schedule.aggregate([
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
      { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$course", schedules: { $push: "$$ROOT" } } },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    ]);
    console.log(courses);
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
