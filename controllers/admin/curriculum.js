const Curriculum = require("../../models/curriculum");
const Program = require("../../models/program");
const Course = require("../../models/course");
const Year = require("../../models/year");
const Level = require("../../models/level");
const { validationResult } = require("express-validator");
const curriculum = require("../../models/curriculum");
const { mongoose } = require("mongoose");

exports.getCurriculum = (req, res, next) => {
  res.render("admin/curriculum/index", {
    title: "ALCS | Curriculum",
  });
};

exports.getCurriculumFaculty = (ree,res,next) => {
  res.render('admin/curriculum/faculty', {
    title: 'Active Curriculum Faculty'
  })
}

exports.addCurriculum = (req, res, next) => {
  const dropdown = {};
  if (req.method === "GET") {
    Program.find()
      .then((programs) => {
        dropdown.programs = programs;
        return Year.find();
      })
      .then((years) => {
        dropdown.years = years;
        return Course.find();
      })
      .then((courses) => {
        dropdown.courses = courses;
        return Level.find();
      })
      .then((levels) => {
        dropdown.levels = levels;
        return res.render("admin/curriculum/form", {
          title: "ALCS | Adding Currriculum",
          edit: false,
          errors: [],
          curriculum: [],
          dropdown: dropdown,
        });
      });
  } else {
    const school_year = req.body.school_year;
    const semester = req.body.semester;
    const program = req.body.program;
    const year_level = req.body.year_level;
    const sections = req.body.sections.split(",");
    const courses = req.body.courses;
    let fetchCurriculum = {};
    Curriculum.findOne({
      school_year: school_year,
    })
      .then((curriculum) => {
        if (!curriculum) {
          return new Curriculum({
            school_year: school_year,
            semesters: [
              {
                sem: semester,
                programs: [
                  {
                    program: program,
                    year: [
                      {
                        year_level: year_level,
                        sections: sections.map((e) => {
                          return {
                            section: e,
                            schedules: courses.map((e) => {
                              return {
                                course: e,
                                day: null,
                                start_time: null,
                                end_time: null,
                              };
                            }),
                          };
                        }),
                        courses: courses,
                      },
                    ],
                  },
                ],
              },
            ],
          }).save();
        } else {
          const fetchSemester = curriculum.semesters.find(
            (e) => e.sem === semester
          );
          if (fetchSemester) {
            const fetchedPrograms = fetchSemester.programs.find(
              (e) => e.program.toString() === program.toString()
            );
            if (fetchedPrograms) {
              const fetchedYear = fetchedPrograms.year.find(
                (e) => e.year_level.toString() === year_level.toString()
              );
              if (fetchedYear) {
                fetchedYear.courses = courses;
                fetchedYear.sections = sections;
              } else {
                fetchedPrograms.year.push({
                  year_level: year_level,
                  courses: courses,
                  sections: sections.map((e) => {
                    return {
                      section: e,
                      schedules: courses.map((e) => {
                        return {
                          course: e,
                          day: null,
                          start_time: null,
                          end_time: null,
                        };
                      }),
                    };
                  }),
                });
              }
              return curriculum.save();
            } else {
              fetchSemester.programs.push({
                program: program,
                year: [
                  {
                    year_level: year_level,
                    sections: sections.map((e) => {
                      return {
                        section: e,
                        schedules: courses.map((e) => {
                          return {
                            course: e,
                            day: null,
                            start_time: null,
                            end_time: null,
                          };
                        }),
                      };
                    }),
                    courses: courses,
                  },
                ],
              });
              return curriculum.save();
            }
          } else {
            curriculum.semesters.push({
              sem: semester,
              programs: [
                {
                  program: program,
                  year: [
                    {
                      year_level: year_level,
                      sections: sections.map((e) => {
                        return {
                          section: e,
                          schedules: courses.map((e) => {
                            return {
                              course: e,
                              day: null,
                              start_time: null,
                              end_time: null,
                            };
                          }),
                        };
                      }),
                      courses: courses,
                    },
                  ],
                },
              ],
            });
            return curriculum.save();
          }
        }
      })
      .then((result) => {
        console.log(result);
        res.redirect("/admin/curriculums");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.getSectionsAndCourses = (req, res, next) => {
  const school_year = req.query.school_year;
  const semester = req.query.semester;
  const program = req.query.program;
  const year_level = req.query.year_level;
  Curriculum.findOne({ school_year: school_year })
    .populate({ path: "semesters.programs.program" })
    .populate({ path: "semesters.programs.year.year_level" })
    .populate("semesters.programs.year.courses")
    .then((curriculum) => {
      let sections;
      let courses;
      if (curriculum) {
        curriculum.semesters = curriculum.semesters.find(
          (e) => e.sem.toString() === semester.toString()
        );
        if (curriculum.semesters) {
          curriculum.semesters[0].programs =
            curriculum.semesters[0].programs.find(
              (e) => e.program._id.toString() === program.toString()
            );
          if (curriculum.semesters[0].programs) {
            curriculum.semesters[0].programs[0].year =
              curriculum.semesters[0].programs[0].year.find(
                (e) => e.year_level.id.toString() === year_level.toString()
              );
            if (curriculum.semesters[0].programs[0].year) {
              sections = curriculum.semesters[0].programs[0].year[0].sections;
              courses = curriculum.semesters[0].programs[0].year[0].courses.map(
                (element) => {
                  return element._id;
                }
              );
            } else {
              sections = undefined;
              courses = undefined;
            }
          } else {
            sections = undefined;
            courses = undefined;
          }
        } else {
          sections = undefined;
          courses = undefined;
        }
      } else {
        sections = undefined;
        courses = undefined;
      }
      return res.json({ sections: sections, courses: courses });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.editCurriculum = (req, res, next) => {};

exports.deleteCurriculum = (req, res, next) => {};

exports.getProgram = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: { school_year: mongoose.Types.ObjectId(req.params.school_year) },
    },
    { $unwind: "$semesters" },
    {
      $match: { "semesters.sem": req.query.semester },
    },
    {
      $unwind: "$semesters.programs",
    },
    {
      $project: {
        _id: "$semesters.programs._id",
        school_year: "$school_year",
        sem: "$semesters.sem",
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
  ])
    .then((result) => {
      if (result.length == 0) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, error: error });
    });
};

exports.getOneProgram = (req, res, next) => {
  Curriculum.aggregate([
    {
      $match: { school_year: mongoose.Types.ObjectId(req.params.school_year) },
    },
    { $unwind: "$semesters" },
    {
      $match: { "semesters.sem": req.query.semester },
    },
    {
      $unwind: "$semesters.programs",
    },

    {
      $match: {
        "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
      },
    },
    { $unwind: "$semesters.programs.year" },
    //  {
    //       $project: {
    //         _id: "$semesters.programs._id",
    //         school_year: "$school_year",
    //         sem: "$semesters.sem",
    //         program: "$semesters.programs.program",
    //         year: "$semesters.programs.year",
    //       },
    //     },
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

exports.postProgram = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  Curriculum.findOne({
    school_year: req.params.school_year,
  })
    .then((data) => {
      if (!data) {
        return new Curriculum({
          school_year: req.params.school_year,
          semesters: [
            {
              sem: req.body.semester,
              programs: req.body.program.map((element) => {
                return {
                  program: element,
                  level: null,
                };
              }),
            },
          ],
        }).save();
      }
      if (!data.semesters.find((element) => element.sem == req.body.semester)) {
        data.semesters.push({
          sem: req.body.semester,
          programs: req.body.program.map((element) => {
            return {
              program: element,
              level: null,
            };
          }),
        });
        return data.save();
      }
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

exports.getSemester = (req, res, next) => {
  Curriculum.findOne({
    school_year: mongoose.Types.ObjectId(req.params.school_year),
  })
    .select("semesters.sem semesters._id -_id")
    .then((data) => {
      if (!data) {
        return res.json({ ok: true, data: null });
      }
      res.json({ ok: true, data: data.semesters });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.postYearLevel = (req, res, next) => {
  const schedules = [];
  console.log(req.body);
  console.log(req.params);
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
          school_year: req.params.school_year,
        },
        {
          $push: {
            "semesters.$[sem].programs.$[programId].year": {
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
          arrayFilters: [
            { "sem.sem": req.body.semester },
            { "programId._id": req.body.program },
          ],
        }
      );
    })
    .then((result) => {
      if (!result.modifiedCount) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });

  //   .then((result) => {})
  //   .catch((error) => {});
};
