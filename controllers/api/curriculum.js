const { default: mongoose } = require("mongoose");
const Curriculum = require("../../models/curriculum");

exports.getSemesters = (req, res, next) => {
  if (!req.params.school_year.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    {
      $match: {
        school_year: mongoose.Types.ObjectId(req.params.school_year),
      },
    },
    { $unwind: "$semesters" },
    {
      $project: {
        _id: "$semesters._id",
        sem: "$semesters.sem",
      },
    },
  ])
    .then((response) => {
      res.json({ ok: true, data: response });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, errors: error });
    });
};

exports.getPrograms = (req, res, next) => {
  if (!req.params.semester.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
    },
    {
      $project: {
        _id: "$semesters.programs._id",
        program: "$semesters.programs.program",
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
    { $unwind: "$program" },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, errors: error });
    });
};

exports.getYearLevels = (req, res, next) => {
  if (!req.params.program.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    {
      $match: {
        "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
      },
    },
    { $unwind: "$semesters.programs.year" },
    {
      $project: {
        _id: "$semesters.programs.year._id",
        level: "$semesters.programs.year.year_level",
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
    { $unwind: "$level" },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, errors: error });
    });
};

exports.getSections = (req, res, next) => {
  if (!req.params.year_level.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(
          req.params.year_level
        ),
      },
    },
    { $unwind: "$semesters.programs.year.sections" },
    {
      $project: {
        _id: "$semesters.programs.year.sections._id",
        section: "$semesters.programs.year.sections.section",
      },
    },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, errors: error });
    });
};

exports.getSectionSchedules = (req, res, next) => {
  if (!req.params.section.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
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
    { $unwind: "$course" },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, error: error });
    });
};
