const Curriculum = require("../../models/curriculum");
const Program = require("../../models/program");
const Course = require("../../models/course");
const Year = require("../../models/year");
const Level = require("../../models/level");
const { validationResult } = require("express-validator");
const curriculum = require("../../models/curriculum");
const { find } = require("../../models/curriculum");

exports.getCurriculums = (req, res, next) => {
  const dropdown = {};
  Program.find()
    .then((programs) => {
      dropdown.programs = programs;
      return Year.find();
    })
    .then((years) => {
      dropdown.years = years;
      return Level.find();
    })
    .then((levels) => {
      dropdown.levels = levels;
      return Curriculum.find()
        .populate({
          path: "school_year",
        })
        .populate({
          path: "semesters.programs.program",
        })
        .populate({
          path: "semesters.programs.year.year_level",
        })
        .populate("semesters.programs.year.courses");
    })
    .then((curriculums) => {
      res.render("admin/curriculum", {
        title: "ALCS | Curriculum",
        curriculums: curriculums,
        dropdown: dropdown,
        year_levelParam: req.query.year_level,
        programParam: req.query.program,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

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
                        sections: sections,
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
                fetchedYear.courses = courses
                fetchedYear.sections = sections
              } else {
                fetchedPrograms.year.push({
                  year_level: year_level,
                  courses: courses,
                  sections: sections,
                });
              }
              return curriculum.save();
            } else {
              fetchSemester.programs.push({
                program: program,
                year: [
                  {
                    year_level: year_level,
                    sections: sections,
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
                      sections: sections,
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
