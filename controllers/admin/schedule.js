const Curriculum = require("../../models/curriculum");
const Room = require("../../models/room");
const mongoose = require("mongoose");
const { query, response } = require("express");

exports.getSchedule = (req, res, next) => {
  Curriculum.find()
    .populate("school_year")
    .then((curriculums) => {
      res.render("admin/schedule/index", {
        title: "ALCS | Schedule",
        curriculums: curriculums,
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
  console.log(req.body);
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
  console.log(req);
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
        courseId: "$schedule.course",
      },
    },
    { $match: { day: { $ne: null } } },
    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
      },
    },
  ])
    .then((schedules) => {
      const days = ["m", "t", "w", "th", "f", "s"];
      const response = schedules.map((e) => {
        return {
          id: e.course[0]._id,
          title:
            e.course[0].course_code +
            " (" +
            e.course[0].course_description +
            ")",
          daysOfWeek: [(days.indexOf(e.day) + 1).toString()],
          startTime: e.from,
          endTime: e.to,
          overlap: false,
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
    {
      $lookup: {
        from: "rooms",
        localField: "schedule.room",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$schedule" },
    {
      $project: {
        day: "$schedule.day",
        to: "$schedule.end_time",
        from: "$schedule.start_time",
        room: "$room.room_name",
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
      response.room = room_schedules.map((e) => {
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
            courseId: "$schedule.course",
          },
        },
        { $match: { day: { $ne: null } } },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
          },
        },
      ]);
    })
    .then((section_schedules) => {
      response.section = section_schedules.map((e) => {
        return {
          id: e.course[0]._id,
          title:
            e.course[0].course_code +
            " (" +
            e.course[0].course_description +
            ")",
          daysOfWeek: [(days.indexOf(e.day) + 1).toString()],
          startTime: e.from,
          endTime: e.to,
          overlap: false,
          editable: true,
        };
      });
      res.json(response);
    })
    .catch((error) => {
      throw new Error(error);
    });
};
