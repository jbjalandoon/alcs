const Schedule = require("../../../models/curriculum");
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
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
          // "semesters.programs.year.sections.schedules.faculty": { $ne: null },
          "semesters.programs.year.sections.schedules.room": req.params.room,
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
    ]);
    res.status(200).json({ schedules });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getSchedule = async (req, res, next) => {
  try {
    const [schedules] = await Schedule.aggregate([
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
          // "semesters.programs.year.sections.schedules.room": req.params.room,
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
          "semesters.programs.year.sections.schedules.room": req.params.room,
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
          from: "levels",
          localField: "yearLevel",
          foreignField: "_id",
          as: "yearLevel",
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
      { $unwind: { path: "$yearLevel", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$room",
          schedules: { $push: "$$ROOT" },
        },
      },
    ]);
    console.log({ ...schedules });
    if (schedules) return res.status(200).json({ ...schedules });

    res.status(200).json({ schedules: [] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getActiveRoom = async (req, res, next) => {
  try {
    const rooms = await Schedule.aggregate([
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
          room: "$semesters.programs.year.sections.schedules.room",
        },
      },
      {
        $unwind: "$room",
      },
      { $group: { _id: "$room" } },
    ]);
    res.status(200).json({ rooms });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
