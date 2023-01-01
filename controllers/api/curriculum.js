const { default: mongoose } = require("mongoose");
const { validationResult } = require("express-validator");
const Curriculum = require("../../models/curriculum");
const Course = require("../../models/course");
const Level = require("../../models/level");
const year = require("../../models/year");

exports.getSchoolYears = (req, res, next) => {
  Curriculum.find({}, "_id school_year")
    .populate("school_year")
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false });
    });
};

exports.putActiveSemester = (req, res, next) => {
  Curriculum.updateMany(
    {},
    {
      "semesters.$[].isActive": false,
    }
  )
    .then((result) => {
      return Curriculum.updateOne(
        {
          "semesters._id": req.params.semester,
        },
        {
          "semesters.$[semester].isActive": true,
        },
        { arrayFilters: [{ "semester._id": req.params.semester }] }
      );
    })
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, data: error });
    });
};

exports.copySemester = (req, res, next) => {
  console.log("test", req.params);
  Curriculum.aggregate([
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.sem),
      },
    },
    { $unwind: "$semesters" },
    {
      $match: {
        "semesters._id": mongoose.Types.ObjectId(req.params.sem),
      },
    },
    // {
    //   $project: {
    //     _id: "$semesters._id",
    //     school_year: "$school_year",
    //     sem: "$semesters.sem",
    //   },
    // },
    {
      $lookup: {
        from: "years",
        localField: "school_year",
        foreignField: "_id",
        as: "school_year",
      },
    },
  ])
    .then((result) => {
      const programs = [];
      result[0].semesters.programs.forEach((element) => {
        programs.push({
          program: element.program,
          year: element.year.map((element) => {
            return {
              year_level: element.year_level,
              courses: element.courses,
            };
          }),
        });
      });
      return Curriculum.updateOne(
        {
          "semesters._id": mongoose.Types.ObjectId(req.params.active),
        },
        {
          'semesters.$[semester].programs': programs
        },
        { arrayFilters: [{ "semester._id": req.params.active }] }
      );
    }).then(result => {
      console.log(result)
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, errors: error });
    });
};

exports.deleteOneProgram = (req, res, next) => {
  console.log("hello");
  Curriculum.updateOne(
    {
      "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
    },
    {
      $pull: {
        "semesters.$[].programs": { _id: req.params.program },
      },
    },
    { arrayFilters: [{ "program._id": req.params.program }] }
  )
    .then((result) => {
      console.log(result);
      if (!result) {
        return res.json({ ok: false });
      }
      return res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

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

exports.getActiveSemester = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters.isActive": true,
      },
    },
    { $unwind: "$semesters" },
    {
      $match: {
        "semesters.isActive": true,
      },
    },
    // {
    //   $project: {
    //     _id: "$semesters._id",
    //     school_year: "$school_year",
    //     sem: "$semesters.sem",
    //   },
    // },
    {
      $lookup: {
        from: "years",
        localField: "school_year",
        foreignField: "_id",
        as: "school_year",
      },
    },
  ])
    .then((response) => {
      console.log(response);
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

exports.getOneProgram = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: {
        "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
      },
    },
    { $unwind: "$semesters" },
    {
      $unwind: "$semesters.programs",
    },
    {
      $match: {
        "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
      },
    },
    { $unwind: "$semesters.programs.year" },
    {
      $lookup: {
        from: "programs",
        localField: "semesters.programs.program",
        foreignField: "_id",
        as: "semesters.programs.program",
      },
    },
    { $unwind: "$semesters.programs.program" },
    {
      $lookup: {
        from: "levels",
        localField: "semesters.programs.year.year_level",
        foreignField: "_id",
        as: "semesters.programs.year.year_level",
      },
    },
    { $unwind: "$semesters.programs.year.year_level" },
    {
      $project: {
        _id: "$semesters.programs.year._id",
        school_year: "$school_year",
        sem: "$semesters.sem",
        program: "$semesters.programs.program",
        year: "$semesters.programs.year.year_level",
        courses: "$semesters.programs.year.courses",
        sections: {
          _id: "$semesters.programs.year.sections._id",
          section: "$semesters.programs.year.sections.section",
        },
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "courses",
        foreignField: "_id",
        as: "course",
      },
    },
  ])
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, error: error });
    });
};

exports.getProgramDetails = (req, res, next) => {};

exports.postPrograms = (req, res, next) => {
  let fetchedData, fetchedLevel;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  Level.find({ deleted_at: null })
    .then((result) => {
      fetchedLevel = result.map((element) => {
        return { year_level: element._id };
      });
      console.log(fetchedLevel);
      return Curriculum.updateOne(
        {
          "semesters._id": req.params.semester,
        },
        {
          $push: {
            "semesters.$[semester].programs": req.body.program.map(
              (element) => {
                return {
                  program: element,
                  year: fetchedLevel,
                };
              }
            ),
          },
        },
        { arrayFilters: [{ "semester._id": req.params.semester }] }
      );
    })
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
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
    {
      $match: {
        "semesters.programs.year._id": mongoose.Types.ObjectId(
          req.params.year_level
        ),
      },
    },
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

exports.postSections = (req, res, next) => {
  const schedules = [];
  let filteredSection;
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
      $unwind: {
        path: "$semesters.programs.year.sections",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections._id",
        section: "$semesters.programs.year.sections.section",
        courses: "$semesters.programs.year.courses",
      },
    },
  ])
    .then((result) => {
      console.log(result);
      filteredSection = req.body.sections.filter((element) => {
        return !result.some((section) => {
          return section.section === element;
        });
      });
      return Course.find({ _id: { $in: result[0].courses } });
    })
    .then((result) => {
      result.forEach((element) => {
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
          "semesters.programs.year._id": req.params.year,
        },
        {
          $push: {
            "semesters.$[].programs.$[].year.$[year].sections":
              filteredSection.map((element) => {
                return {
                  section: element,
                  schedules: schedules,
                };
              }),
          },
        },
        {
          arrayFilters: [{ "year._id": req.params.year }],
        }
      );
    })
    .then((result) => {
      console.log(result);
      res.json({ ok: true, data: result, sections: filteredSection });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false, data: error });
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
  ])
    .then((result) => {
      console.log(result);
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
        _id: "$semesters.programs.year._id",
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

exports.postCourse = (req, res, next) => {
  let fetchedCourses;
  const schedules = [];
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  Course.find({ _id: { $in: req.body.course } })
    .then((result) => {
      fetchedCourses = result;
      result.forEach((element) => {
        if (element.lecture != 0) {
          schedules.push({
            course: element._id,
            hour: element.lecture,
            type: "lecture",
          });
        }
        if (element.lab != 0) {
          schedules.push({
            course: element._id,
            hour: element.lab,
            type: "lab",
          });
        }
      });
      return Curriculum.updateOne(
        {
          "semesters.programs.year._id": req.params.year,
        },
        {
          $push: {
            "semesters.$[].programs.$[].year.$[year].courses": req.body.course,
            "semesters.$[].programs.$[].year.$[year].sections.$[].schedules":
              schedules,
          },
        },
        {
          arrayFilters: [
            {
              "year._id": req.params.year,
            },
          ],
        }
      );
    })
    .then((result) => {
      res.json({ ok: true, data: result, courses: fetchedCourses });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });

  return;
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
