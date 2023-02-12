const { default: mongoose } = require("mongoose");
const { validationResult } = require("express-validator");
const Curriculum = require("../../models/curriculum");
const Course = require("../../models/course");
const Faculty = require("../../models/user");
const Level = require("../../models/level");
const FacultyType = require("../../models/faculty-type");
const year = require("../../models/year");
const { response } = require("express");
const { faculty } = require("../../validations/curriculum");

exports.getSchoolYears = (req, res, next) => {
  Curriculum.aggregate([
    {
      $lookup: {
        from: "years",
        localField: "schoolYear",
        foreignField: "_id",
        as: "schoolYear",
      },
    },
    {
      $match: {
        "schoolYear.deleted": { $ne: true },
      },
    },
    {
      $project: {
        schoolYear: "$schoolYear.year",
        _id: "$schoolYear._id",
      },
    },
    { $unwind: "$schoolYear" },
    { $unwind: "$_id" },
  ])
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.getSemesters = (req, res, next) => {
  if (!req.params.schoolYear.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).json({ ok: false, msg: "Invalid Query" });
  Curriculum.aggregate([
    {
      $match: {
        schoolYear: mongoose.Types.ObjectId(req.params.schoolYear),
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
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, errors: error });
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
    {
      $lookup: {
        from: "years",
        localField: "schoolYear",
        foreignField: "_id",
        as: "schoolYear",
      },
    },
  ])
    .then((response) => {
      res.json({ status: 200, data: response });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, errors: error });
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
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, data: error });
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
          "semesters.$[semester].programs": programs,
        },
        { arrayFilters: [{ "semester._id": req.params.active }] }
      );
    })
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, errors: error });
    });
};

exports.deleteOneProgram = (req, res, next) => {
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

exports.getPrograms = (req, res, next) => {
  if (!req.params.semester.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ status: 400, msg: "Invalid Query" });
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
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, errors: error });
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
        localField: "semesters.programs.year.yearLevel",
        foreignField: "_id",
        as: "semesters.programs.year.yearLevel",
      },
    },
    { $unwind: "$semesters.programs.year.yearLevel" },
    {
      $project: {
        _id: "$semesters.programs.year._id",
        school_year: "$school_year",
        sem: "$semesters.sem",
        program: "$semesters.programs.program",
        year: "$semesters.programs.year.yearLevel",
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
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, error: error });
    });
};

exports.getProgramDetails = (req, res, next) => {};

exports.postPrograms = (req, res, next) => {
  let fetchedData, fetchedLevel;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  Level.find({ deleted: false })
    .then((result) => {
      fetchedLevel = result.map((element) => {
        return { yearLevel: element._id };
      });
      return Curriculum.updateOne(
        {
          "semesters._id": req.params.semester,
        },
        {
          $push: {
            "semesters.$[semester].programs": req.body.programs.map(
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
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.getYearLevels = (req, res, next) => {
  if (!req.params.program.match(/^[0-9a-fA-F]{24}$/))
    return res.json({ status: 400, msg: "Invalid Query" });
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
        level: "$semesters.programs.year.yearLevel",
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
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.getSections = (req, res, next) => {
  if (!req.params.year_level.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).json({ status: 400, msg: "Invalid Query" });
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
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
    });
};

exports.postSections = (req, res, next) => {
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
      filteredSection = req.body.sections.filter((element) => {
        return !result.some((section) => {
          return section.section === element;
        });
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
                  schedules: [],
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
      res.json({ status: 201, data: result, sections: filteredSection });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
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
        as: "course",
      },
    },
    { $unwind: "$course" },
  ])
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.postCourse = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  Curriculum.updateOne(
    {
      "semesters.programs.year._id": req.params.year,
    },
    {
      $push: {
        "semesters.$[].programs.$[].year.$[year].courses": req.body.courses,
      },
    },
    {
      arrayFilters: [
        {
          "year._id": req.params.year,
        },
      ],
    }
  )
    .then((result) => {
      return Course.find({ _id: { $in: req.body.courses } });
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.deleteCourse = (req, res, next) => {
  console.log(req.params);
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
      console.log(result);
      res.json({ status: 202, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
      console.log(error);
    });
};

exports.getActiveFaculty = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
    },
    { $unwind: "$semesters" },
    {
      $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
    },
    {
      $project: {
        faculty: "$semesters.activeFaculties",
      },
    },
    {
      $unwind: "$faculty",
    },
  ])
    .then((result) => {
      return Faculty.find({ _id: { $in: result.map((e) => e.faculty) } })
        .populate(
          "userInformation.academicQualifications.academicQualification"
        )
        .populate("userInformation.academicQualifications.licenseIndustry")
        .populate("userInformation.courseTaken")
        .populate("userInformation.facultyType");
    })
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.getActiveFacultyCounts = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
    },
    { $unwind: "$semesters" },
    {
      $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
    },
    {
      $project: {
        faculty: "$semesters.activeFaculties",
      },
    },
    {
      $unwind: "$faculty",
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
      $group: {
        _id: "$faculty.userInformation.facultyType",
        count: { $count: {} },
      },
    },
    {
      $lookup: {
        from: "facultytypes",
        localField: "_id",
        foreignField: "_id",
        as: "facultyType",
      },
    },
    {
      $unwind: "$facultyType",
    },
  ])
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.getActiveFacultyType = (req, res, next) => {
  FacultyType.findOne({ facultyType: req.params.type })
    .then((result) => {
      return Curriculum.aggregate([
        {
          $match: {
            "semesters._id": mongoose.Types.ObjectId(req.params.semester),
          },
        },
        {
          $unwind: "$semesters",
        },
        {
          $unwind: "$semesters.activeFaculties",
        },
        {
          $project: {
            faculty: "$semesters.activeFaculties",
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
          $unwind: "$faculty",
        },
        {
          $match: {
            "faculty.userInformation.facultyType": mongoose.Types.ObjectId(
              result._id
            ),
          },
        },
        {
          $project: {
            _id: "$faculty._id",
            facultyInformation: "$faculty.userInformation",
          },
        },
      ]);
    })
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.postActiveFaculty = (req, res, next) => {
  Curriculum.updateOne(
    { "semesters._id": req.params.semester },
    {
      $addToSet: {
        "semesters.$[semester].activeFaculties": req.body.faculty,
      },
    },
    { arrayFilters: [{ "semester._id": req.params.semester }] }
  )
    .then((result) => {
      return Faculty.find({ _id: { $in: req.body.faculty } })
        .populate(
          "userInformation.academicQualifications.academicQualification"
        )
        .populate("userInformation.academicQualifications.licenseIndustry")
        .populate("userInformation.courseTaken")
        .populate("userInformation.facultyType")
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.deleteActiveFaculty = (req, res, next) => {
  Curriculum.updateOne(
    { "semesters._id": req.params.semester },
    {
      $pull: {
        "semesters.$[semester].activeFaculties": req.params.id,
      },
      $set: {
        "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules.$[faculty].faculty":
          null,
      },
    },
    {
      arrayFilters: [
        { "semester._id": req.params.semester },
        { "faculty.faculty": req.params.id },
      ],
    }
  )
    .then((result) => {
      res.json({ status: 202, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
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
