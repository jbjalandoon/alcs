const { default: mongoose } = require("mongoose");
const { validationResult } = require("express-validator");
const Curriculum = require("../../models/curriculum");
const Course = require("../../models/course");

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
        courses: "$semesters.programs.year.courses",
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
        localField: "courses",
        foreignField: "_id",
        as: "courses",
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

exports.addYearLevel = (req, res, next) => {
  const schedules = [];
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  Course.find({ _id: { $in: req.body.course } })
    .then((data) => {
      data.forEach((element) => {
        if (element.lecture != 0) {
          schedules.push({
            course: element._id,
            hour: element.lecture,
            type: "lecture",
            day: null,
            start_time: null,
            end_time: null,
            room: null,
            faculty: null,
          });
        }
        if (element.lab != 0) {
          schedules.push({
            course: element._id,
            hour: element.lab,
            type: "lab",
            day: null,
            start_time: null,
            end_time: null,
            room: null,
            faculty: null,
          });
        }
      });
      return Curriculum.updateOne(
        {
          "semesters.programs._id": req.params.program,
        },
        {
          $push: {
            "semesters.$[].programs.$[program].year": {
              year_level: req.body.year_level,
              courses: req.body.course,
              sections: req.body.section.map((element) => {
                return {
                  section: element,
                  schedules: schedules,
                };
              }),
            },
          },
        },
        {
          arrayFilters: [{ "program._id": req.params.program }],
        }
      );
    })
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
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

exports.getCourse = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(req.params.year),
      },
    },
    { $unwind: "$semesters" },
    { $unwind: "$semesters.programs" },
    { $unwind: "$semesters.programs.year" },
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(req.params.year),
      },
    },
    {
      $project: {
        _id: '$semesters.programs.year._id',
        course: "$semesters.programs.year.courses",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "course_info",
      },
    },
  ])
    .then((result) => {
      res.json({ ok: true, data: result[0] });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, data: error });
    });
};

exports.deleteCourse = (req, res, next) => {
  Curriculum.updateOne(
    {
      "semesters.programs.year._id": req.params.year,
    },
    {
      $pull: {
        "semesters.$[].programs.$[].year.$[year].courses": req.params.course,
        "semesters.$[].programs.$[].year.$[year].sections.$[].schedules": {
          course: req.params.course,
        },
      },
    },
    {
      arrayFilters: [{ "year._id": req.params.year }],
    }
  )
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false });
      console.log(error);
    });
};
