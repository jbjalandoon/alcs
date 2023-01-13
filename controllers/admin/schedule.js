const Curriculum = require("../../models/curriculum");
const Room = require("../../models/room");
const mongoose = require("mongoose");
const moment = require("moment");
const { query, response } = require("express");

exports.getSchedule = (req, res, next) => {
  Curriculum.find()
    .then((curriculums) => {
      res.render("admin/schedule/index", {
        title: "ALCS | Schedule",
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getSemesters = (req, res, next) => {
  Curriculum.findOne({ school_year: req.query.school_year }, "semesters.sem")
    .then((curriculum) => {
      res.json({
        semesters: curriculum.semesters,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getPrograms = (req, res, next) => {
  Curriculum.findOne(
    { semesters: { $elemMatch: { sem: req.query.semester } } },
    // 'school_year semesters.sem',
    { "semesters.programs.program.$": 1 }
  )
    .populate("semesters.programs.program")
    .then((curriculum) => {
      res.json({
        programs: curriculum.semesters[0].programs,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getLevels = (req, res, next) => {
  Curriculum.findOne(
    {
      school_year: req.query.school_year,
      semesters: {
        $elemMatch: {
          sem: req.query.semester,
        },
      },
    },
    {
      "semesters.programs.$": 1,
    }
  )
    .populate("semesters.programs.year.year_level")
    .then((curriculum) => {
      if (curriculum) {
        const programs = curriculum.semesters[0].programs.find(
          (e) => e.program == req.query.program
        );
        const years = programs.year.map((e) => {
          return { year_level: e.year_level };
        });
        return res.json({
          years: years,
        });
      }
      return res.json({
        years: null,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getSections = (req, res, next) => {
  Curriculum.findOne(
    {
      school_year: req.query.school_year,
      semesters: {
        $elemMatch: {
          sem: req.query.semester,
        },
      },
    },
    {
      "semesters.programs.$": 1,
    }
  )
    .then((curriculum) => {
      if (curriculum) {
        const programs = curriculum.semesters[0].programs.find(
          (e) => e.program == req.query.program
        );
        const years = programs.year.find(
          (e) => e.year_level == req.query.year_level
        );
        return res.json({
          sections: years.sections,
        });
      }
      return res.json({
        years: null,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getCoursesTable = (req, res, next) => {
  let dropdowns = {};
  Room.find()
    .then((room) => {
      dropdowns.room = room;
      return Curriculum.findOne(
        {
          // school_year: req.query.school_year,
          semesters: {
            $elemMatch: {
              sem: req.query.semester,
            },
          },
        },
        {
          "semesters.programs.$": 1,
        }
      )
        .populate("semesters.programs.year.sections.schedules.course")
        .populate("semesters.programs.year.sections.schedules.room");
    })
    .then((curriculum) => {
      if (curriculum) {
        const programs = curriculum.semesters[0].programs.find(
          (e) => e.program == req.query.program
        );
        const years = programs.year.find(
          (e) => e.year_level == req.query.year_level
        );
        const section = years.sections.find(
          (e) => e.section == req.query.section
        );
        const schedule = section.schedules.filter((e) => e.day == null);
        return res.render("admin/schedule/draggable-course", {
          dropdowns: dropdowns,
          schedules: schedule,
        });
      } else {
        return res.render("admin/schedule/draggable-course", {
          dropdowns: null,
          schedules: null,
        });
      }
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.setSchedule = (req, res, next) => {
  const days = ["m", "t", "w", "th", "f", "s", null];
  Curriculum.updateOne(
    {
      school_year: req.body.school_year,
    },
    {
      $set: {
        "semesters.$[sem].programs.$[program].year.$[level].sections.$[section].schedules.$[course]":
          {
            course: mongoose.Types.ObjectId(req.body.course),
            day: req.body.day == "" ? null : days[req.body.day - 1],
            start_time:
              req.body.start_time == undefined ? null : req.body.start_time,
            end_time: req.body.end_time == undefined ? null : req.body.end_time,
            room: req.body.room == "" ? null : req.body.room,
            faculty: null,
          },
      },
    },
    {
      arrayFilters: [
        { "sem.sem": req.body.semester },
        { "program.program": req.body.program },
        { "level.year_level": req.body.year_level },
        { "section.section": req.body.section },
        { "course.course": req.body.course },
      ],
    }
  )
    .then((result) => {
      res.json({ message: result });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.assignFaculty = (req, res, next) => {
  const days = ["m", "t", "w", "th", "f", "s", null];
  console.log(req.body);
  Curriculum.updateOne(
    {
      school_year: req.body.school_year,
    },
    {
      $set: {
        "semesters.$[sem].programs.$[program].year.$[level].sections.$[section].schedules.$[course].faculty":
          req.body.faculty,
      },
    },
    {
      arrayFilters: [
        { "sem.sem": req.body.semester },
        { "program.program": req.body.program },
        { "level.year_level": req.body.year_level },
        { "section.section": req.body.section },
        { "course.course": req.body.course },
      ],
    }
  )
    .then((result) => {
      console.log(result);
      res.json({ message: result });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getRoomSchedules = (req, res, next) => {
  Curriculum.aggregate([
    { $match: { school_year: mongoose.Types.ObjectId(req.query.school_year) } },
    { $project: { semester: "$semesters" } },
    { $unwind: "$semester" },
    { $match: { "semester.sem": req.query.semester } },
    { $project: { program: "$semester.programs" } },
    { $unwind: "$program" },
    { $unwind: "$program.year" },
    { $project: { year: "$program.year" } },
    { $project: { sections: "$year.sections" } },
    { $unwind: "$sections" },
    { $match: { "sections.section": { $ne: "101" } } },
    { $project: { schedule: "$sections.schedules" } },
    { $unwind: "$schedule" },
    { $match: { "schedule.room": mongoose.Types.ObjectId(req.query.room) } },
    {
      $lookup: {
        from: "courses",
        localField: "schedule.course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "rooms",
        localField: "schedule.room",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$course" },
    { $unwind: "$room" },
    {
      $project: {
        day: "$schedule.day",
        to: "$schedule.end_time",
        from: "$schedule.start_time",
        room: "$room.room_name",
        course_code: "$course.course_code",
        course_description: "$course.course_description",
        course_id: "$course._id",
      },
    },
  ])
    .then((room_schedules) => {
      console.log(room_schedules);
      const days = ["m", "t", "w", "th", "f", "s"];
      const response = room_schedules.map((e) => {
        return {
          id: e.course_id,
          title: e.course_code + " (" + e.course_description + ")",
          daysOfWeek: [(days.indexOf(e.day) + 1).toString()],
          startTime: e.from,
          endTime: e.to,
          overlap: false,
          editable: false,
          color: "#800000",
        };
      });
      res.json(response);
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getUnavailableSchedules = (req, res, next) => {
  let response = {};
  return Curriculum.aggregate([
    {
      $match: {
        school_year: mongoose.Types.ObjectId(req.query.school_year),
      },
    },
    { $project: { semester: "$semesters" } },
    { $unwind: "$semester" },
    { $match: { "semester.sem": req.query.semester } },
    { $project: { program: "$semester.programs" } },
    { $unwind: "$program" },
    {
      $match: {
        "program.program": mongoose.Types.ObjectId(req.query.program),
      },
    },
    { $unwind: "$program.year" },
    { $project: { programId: "$program.program", year: "$program.year" } },
    {
      $match: {
        "year.year_level": mongoose.Types.ObjectId(req.query.year_level),
      },
    },
    {
      $project: {
        year_level: "$year.year_level",
        program_id: "$programId",
        sections: "$year.sections",
      },
    },
    { $unwind: "$sections" },
    {
      $project: {
        year_level: "$year_level",
        program_id: "$program_id",
        section: "$sections.section",
        schedule: "$sections.schedules",
      },
    },
    { $match: { section: req.query.section } },
    { $unwind: "$schedule" },
    {
      $project: {
        section: "$section",
        day: "$schedule.day",
        to: "$schedule.end_time",
        from: "$schedule.start_time",
        room: "$schedule.room",
        faculty_id: "$schedule.faculty",
        course_id: "$schedule.course",
        year_level_id: "$year_level",
        program_id: "$program_id",
      },
    },
    { $match: { day: { $ne: null } } },
    {
      $lookup: {
        from: "courses",
        localField: "course_id",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "year_level_id",
        foreignField: "_id",
        as: "year_level",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program_id",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "faculties",
        localField: "faculty_id",
        foreignField: "_id",
        as: "faculty",
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
  ])
    .then((schedules) => {
      const days = ["m", "t", "w", "th", "f", "s"];
      const response = schedules.map((e) => {
        return {
          id: e.course[0]._id,
          course: e.course[0]._id,
          title:
            e.course[0].course_code +
            " (" +
            e.course[0].course_description +
            ")",
          daysOfWeek: [(days.indexOf(e.day) + 1).toString()],
          startTime: e.from,
          endTime: e.to,
          overlap: false,
          assignable: true,
          assigned: e.faculty.length == 0 ? false : true,
          text: `
            <div class="container text-start">
              <div class="row">
                <div class="col-3 offset-3">
                  Time: 
                </div>
                <div class="col-5">
                  ${moment(e.from, "HH:mm").format("h:mm A")} - ${moment(
            e.to,
            "HH:mm"
          ).format("h:mm A")} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Program: 
                </div>
                <div class="col-5">
                  ${e.program[0].program_code}
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Year Level: 
                </div>
                <div class="col-5">
                  ${e.year_level[0].level} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Section: 
                </div>
                <div class="col-5">
                  ${e.section} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Section: 
                </div>
                <div class="col-5">
                  ${e.room[0].room_name} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Faculty: 
                </div>
                <div class="col-5">
                  ${
                    e.faculty_id != null
                      ? e.faculty[0].first_name + " " + e.faculty[0].last_name
                      : "No Faculty Assigned"
                  } 
                </div>
              </div>
            </div>
            `,
          header:
            e.course[0].course_code + " - " + e.course[0].course_description,
        };
      });
      res.json(response);
    })

    .catch((error) => {
      throw new Error(error);
    });
};

exports.api = (req, res, next) => {
  Curriculum.aggregate([
    { $match: { school_year: mongoose.Types.ObjectId(req.query.school_year) } },
    { $project: { semester: "$semesters" } },
    { $unwind: "$semester" },
    { $match: { "semester.sem": req.query.semester } },
    { $project: { program: "$semester.programs" } },
    { $unwind: "$program" },
    {
      $match: { "program.program": mongoose.Types.ObjectId(req.query.program) },
    },
    { $unwind: "$program.year" },
    { $project: { year: "$program.year" } },
    {
      $match: {
        "year.year_level": mongoose.Types.ObjectId(req.query.year_level),
      },
    },
    { $project: { sections: "$year.sections" } },
    { $unwind: "$sections" },
    {
      $project: {
        section: "$sections.section",
        schedule: "$sections.schedules",
      },
    },
    { $match: { section: req.query.section } },
    { $unwind: "$schedule" },
    {
      $project: {
        day: "$schedule.day",
        to: "$schedule.end_time",
        from: "$schedule.start_time",
        room: "$room.room_name",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course_id",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "year_level_id",
        foreignField: "_id",
        as: "year_level",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program_id",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "faculties",
        localField: "faculty_id",
        foreignField: "_id",
        as: "faculty",
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
  ])
    .then((curriculum) => {
      res.json({ room_schedules: curriculum, section_schedules: curriculum });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getRoomSectionSchedule = (req, res, next) => {
  const days = ["m", "t", "w", "th", "f", "s"];
  const response = {};
  Curriculum.aggregate([
    { $match: { school_year: mongoose.Types.ObjectId(req.query.school_year) } },
    { $project: { semester: "$semesters" } },
    { $unwind: "$semester" },
    { $match: { "semester.sem": req.query.semester } },
    { $project: { program: "$semester.programs" } },
    { $unwind: "$program" },
    { $unwind: "$program.year" },
    { $project: { program_id: "$program.program", year: "$program.year" } },
    {
      $project: {
        program_id: "$program_id",
        year_level_id: "$year.year_level",
        sections: "$year.sections",
      },
    },
    { $unwind: "$sections" },
    { $match: { "sections.section": { $ne: req.query.section } } },
    {
      $project: {
        year_level_id: "$year_level_id",
        program_id: "$program_id",
        section: "$sections.section",
        schedule: "$sections.schedules",
      },
    },
    { $unwind: "$schedule" },
    { $match: { "schedule.room": mongoose.Types.ObjectId(req.query.room) } },
    {
      $project: {
        section: "$section",
        day: "$schedule.day",
        to: "$schedule.end_time",
        from: "$schedule.start_time",
        room: "$schedule.room",
        faculty_id: "$schedule.faculty",
        course_id: "$schedule.course",
        year_level_id: "$year_level_id",
        program_id: "$program_id",
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course_id",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $lookup: {
        from: "levels",
        localField: "year_level_id",
        foreignField: "_id",
        as: "year_level",
      },
    },
    {
      $lookup: {
        from: "programs",
        localField: "program_id",
        foreignField: "_id",
        as: "program",
      },
    },
    {
      $lookup: {
        from: "faculties",
        localField: "faculty_id",
        foreignField: "_id",
        as: "faculty",
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
  ])
    .then((room_schedules) => {
      response.room = room_schedules.map((e) => {
        return {
          id: e.course[0]._id,
          course: e.course[0]._id,
          title:
            e.course[0].course_code +
            " (" +
            e.course[0].course_description +
            ")",
          daysOfWeek: [(days.indexOf(e.day) + 1).toString()],
          startTime: e.from,
          endTime: e.to,
          overlap: false,
          assigned: e.faculty.length == 0 ? false : true,
          color: "#800000",
          editable: false,
          assignable: false,
          text: `
            <div class="container text-start">
              <div class="row">
                <div class="col-3 offset-3">
                  Time: 
                </div>
                <div class="col-5">
                  ${moment(e.from, "HH:mm").format("h:mm A")} - ${moment(
            e.to,
            "HH:mm"
          ).format("h:mm A")} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Program: 
                </div>
                <div class="col-5">
                  ${e.program[0].program_code}
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Year Level: 
                </div>
                <div class="col-5">
                  ${e.year_level[0].level} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Section: 
                </div>
                <div class="col-5">
                  ${e.section} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Section: 
                </div>
                <div class="col-5">
                  ${e.room[0].room_name} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Faculty: 
                </div>
                <div class="col-5">
                  ${
                    e.faculty_id != null
                      ? e.faculty[0].first_name + " " + e.faculty[0].last_name
                      : "No Faculty Assigned"
                  } 
                </div>
              </div>
            </div>
            `,
          header:
            e.course[0].course_code + " - " + e.course[0].course_description,
        };
      });
      return Curriculum.aggregate([
        {
          $match: {
            school_year: mongoose.Types.ObjectId(req.query.school_year),
          },
        },
        { $project: { semester: "$semesters" } },
        { $unwind: "$semester" },
        { $match: { "semester.sem": req.query.semester } },
        { $project: { program: "$semester.programs" } },
        { $unwind: "$program" },
        {
          $match: {
            "program.program": mongoose.Types.ObjectId(req.query.program),
          },
        },
        { $unwind: "$program.year" },
        { $project: { programId: "$program.program", year: "$program.year" } },
        {
          $match: {
            "year.year_level": mongoose.Types.ObjectId(req.query.year_level),
          },
        },
        {
          $project: {
            year_level: "$year.year_level",
            program_id: "$programId",
            sections: "$year.sections",
          },
        },
        { $unwind: "$sections" },
        {
          $project: {
            year_level: "$year_level",
            program_id: "$program_id",
            section: "$sections.section",
            schedule: "$sections.schedules",
          },
        },
        { $match: { section: req.query.section } },
        { $unwind: "$schedule" },
        {
          $project: {
            section: "$section",
            day: "$schedule.day",
            to: "$schedule.end_time",
            from: "$schedule.start_time",
            room: "$schedule.room",
            faculty_id: "$schedule.faculty",
            course_id: "$schedule.course",
            year_level_id: "$year_level",
            program_id: "$program_id",
          },
        },
        { $match: { day: { $ne: null } } },
        {
          $lookup: {
            from: "courses",
            localField: "course_id",
            foreignField: "_id",
            as: "course",
          },
        },
        {
          $lookup: {
            from: "levels",
            localField: "year_level_id",
            foreignField: "_id",
            as: "year_level",
          },
        },
        {
          $lookup: {
            from: "programs",
            localField: "program_id",
            foreignField: "_id",
            as: "program",
          },
        },
        {
          $lookup: {
            from: "faculties",
            localField: "faculty_id",
            foreignField: "_id",
            as: "faculty",
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
      ]);
    })
    .then((section_schedules) => {
      response.section = section_schedules.map((e) => {
        return {
          id: e.course[0]._id,
          course: e.course[0]._id,
          title:
            e.course[0].course_code +
            " (" +
            e.course[0].course_description +
            ")",
          daysOfWeek: [(days.indexOf(e.day) + 1).toString()],
          startTime: e.from,
          endTime: e.to,
          overlap: false,
          assignable: true,
          editable: true,
          text: `
            <div class="container text-start">
              <div class="row">
                <div class="col-3 offset-3">
                  Time: 
                </div>
                <div class="col-5">
                  ${moment(e.from, "HH:mm").format("h:mm A")} - ${moment(
            e.to,
            "HH:mm"
          ).format("h:mm A")} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Program: 
                </div>
                <div class="col-5">
                  ${e.program[0].program_code}
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Year Level: 
                </div>
                <div class="col-5">
                  ${e.year_level[0].level} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Section: 
                </div>
                <div class="col-5">
                  ${e.section} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Room: 
                </div>
                <div class="col-5">
                  ${e.room[0].room_name} 
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  Faculty: 
                </div>
                <div class="col-5">
                  ${
                    e.faculty_id != null
                      ? e.faculty[0].first_name + " " + e.faculty[0].last_name
                      : "No Faculty Assigned"
                  } 
                </div>
              </div>
            </div>
            `,
          header:
            e.course[0].course_code + " - " + e.course[0].course_description,
        };
      });
      res.json(response);
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getFacultySchedule = (req, res, next) => {
  Curriculum.find({}, "school_year")
    .then((school_years) => {
      res.render("admin/schedule/faculty", {
        title: "ALCS | Assign Faculty",
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};
