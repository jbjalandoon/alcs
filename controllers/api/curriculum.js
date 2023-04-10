const { default: mongoose } = require("mongoose");
const Curriculum = require("../../models/curriculum");

exports.getSectionSchedules = (req, res, next) => {
  if (!req.params.section.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    {
      $match: {
        "semesters.programs.year.sections._id": mongoose.Types.ObjectId(
          req.params.section
        ),
      },
    },
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    { $unwind: "$semesters.programs.year.sections" },
    {
      $match: {
        "semesters.programs.year.sections._id": mongoose.Types.ObjectId(
          req.params.section
        ),
      },
    },
    { $unwind: "$semesters.programs.year.sections.schedules" },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
        section_name: "$semesters.programs.year.sections.section",
        program: "$semesters.programs.program",
        level: "$semesters.programs.year.year_level",
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
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
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
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, error: error });
    });
};

exports.getActiveRoom = (req, res, next) => {
  Curriculum.aggregate([
    { $match: { "semesters._id": mongoose.Types.ObjectId(req.params.sem) } },
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
    { $match: { "semesters._id": mongoose.Types.ObjectId(req.params.sem) } },

    {
      $project: {
        room: "$semesters.programs.year.sections.schedules.room",
      },
    },
    {
      $unwind: "$room",
    },
    { $group: { _id: "$room" } },
    {
      $lookup: {
        from: "rooms",
        localField: "_id",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $unwind: "$room",
    },
    { $sort: { "room.laboratory": 1 } },
  ])
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};
