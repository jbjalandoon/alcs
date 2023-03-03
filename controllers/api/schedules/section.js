const Schedule = require("../../../models/curriculum");
const io = require("../../../socket");
const mongoose = require("mongoose");

exports.getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.aggregate([
      {
        $match: {
          "semesters.programs.year.sections._id": mongoose.Types.ObjectId(req.params.section),
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
        $match: {
          "semesters.programs.year.sections._id": mongoose.Types.ObjectId(req.params.section),
        },
      },
      {
        $project: {
          _id: "$semesters.programs.year.sections._id",
          program: "$semesters.programs.program",
          yearLevel: "$semesters.programs.year.yearLevel",
          sectionName: "$semesters.programs.year.sections.section",
          schedules: "$semesters.programs.year.sections.schedules",
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
      { $unwind: { path: "$yearLevel", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$schedules", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: "$schedules._id",
          program: "$program",
          yearLevel: "$yearLevel",
          sectionName: "$sectionName",
          sectionId: "$_id",
          course: "$schedules.course",
          type: "$schedules.type",
          hour: "$schedules.hour",
          startTime: "$schedules.startTime",
          endTime: "$schedules.endTime",
          day: "$schedules.day",
          room: "$schedules.room",
          faculty: "$schedules.faculty",
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
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$course._id",
          program: { $first: "$program" },
          yearLevel: { $first: "$yearLevel" },
          sectionName: { $first: "$sectionName" },
          course: { $first: "$course" },
          faculty: { $first: "$faculty" },
          schedules: {
            $push: {
              _id: "$_id",
              type: "$type",
              hour: "$hour",
              startTime: "$startTime",
              endTime: "$endTime",
              day: "$day",
              room: "$room",
            },
          },
        },
      },
    ]);

    return res.json({ status: 200, data: schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};

exports.getSchedule = (req, res, next) => {
  Schedule.aggregate([
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
        "semesters.programs.year.sections.schedules._id": mongoose.Types.ObjectId(req.params.schedule),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        course: "$semesters.programs.year.sections.schedules.course",
        type: "$semesters.programs.year.sections.schedules.type",
        program: "$semesters.programs.program",
        level: "$semesters.programs.year.yearLevel",
        sectionName: "$semesters.programs.year.sections.section",
        sectionID: "$semesters.programs.year.sections._id",
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
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result[0] });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.createSchedule = async (req, res, next) => {
  try {
    const id = new mongoose.Types.ObjectId();
    const createSchedule = await Schedule.updateOne(
      {
        "semesters.programs.year.sections._id": req.params.section,
      },
      {
        $push: {
          "semesters.$[].programs.$[].year.$[].sections.$[section].schedules": {
            _id: id,
            course: req.body.course,
            type: req.body.courseType,
            hour: req.body.hour,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            day: req.body.day,
            room: req.body.room,
            faculty: null,
          },
        },
      },
      { arrayFilters: [{ "section._id": req.params.section }] }
    );

    if (createSchedule.modifiedCount === 0) return res.status(500).json({ status: 500 });

    req.body.event.extendedProps.scheduleID = id;
    io.getIO().to(req.params.section).to(req.body.room).emit("createSectionSchedule", {
      event: req.body.event,
      section: req.params.section,
      room: req.body.room,
    });
    res.json({ status: 201, id: id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500 });
  }
};

exports.editSchedule = async (req, res, next) => {
  try {
    const editSchedule = await Schedule.updateOne(
      {
        "semesters.programs.year.sections._id": req.params.section,
      },
      {
        $set: {
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].day": req.body.day,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].startTime": req.body.startTime,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].endTime": req.body.endTime,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].room": req.body.room,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].faculty": null,
        },
      },
      { arrayFilters: [{ "schedule._id": req.params.schedule }] }
    );
    if (editSchedule.modifiedCount === 0) {
      return res.status(500).json({ status: 500 });
    }
    io.getIO().to(req.params.section).to(req.body.room).emit("editSectionSchedule", {
      event: req.body.event,
      section: req.params.section,
      room: req.body.room,
    });
    res.json({ status: 201, data: editSchedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500 });
  }
};

exports.splitSchedule = async (req, res, next) => {
  try {
    let course;
    const courseToRemoeveFaculty = await Schedule.aggregate([
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
          "semesters.programs.year.sections.schedules._id": mongoose.Types.ObjectId(req.params.schedule),
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $project: {
          course: "$semesters.programs.year.sections.schedules.course",
        },
      },
    ]);

    const splitSchedule = await Schedule.updateOne(
      {
        "semesters._id": req.params.semester,
      },
      {
        $set: {
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].starTime": req.body.startTime,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].endTime": req.body.endTime,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].room": req.body.room,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].hour": req.body.hour,
          "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[course].faculty": null,
        },
      },
      {
        arrayFilters: [{ "schedule._id": req.params.schedule }, { "course.course": course }],
      }
    );
    if (splitSchedule.modifiedCount === 0) return res.status(500).json({ status: 500, data: false });
    io.getIO().to(req.body.section).to(req.body.room).emit("splitSectionSchedule", {
      event: req.body.event,
      section: req.body.section,
      room: req.body.room,
      currentHour: req.body.currentHour,
      maxHour: req.body.maxHour,
    });
    return res.status(200).json({ status: 200, data: splitSchedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: false });
  }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    const courseToRemoeveFaculty = await Schedule.aggregate([
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
          "semesters.programs.year.sections.schedules._id": mongoose.Types.ObjectId(req.params.schedule),
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $project: {
          course: "$semesters.programs.year.sections.schedules.course",
        },
      },
    ]);
    console.log(courseToRemoeveFaculty);
    const deleteSchedule = await Schedule.updateOne(
      {
        "semesters._id": req.params.semester,
      },
      {
        $pull: {
          "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules": {
            _id: req.params.schedule,
          },
        },
      },
      {
        arrayFilters: [{ "semester._id": req.params.semester }],
      }
    );

    const removeFaculty = await Schedule.updateOne(
      {
        "semesters._id": req.params.semester,
      },
      {
        $set: {
          "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules.$[course].faculty": null,
        },
      },
      {
        arrayFilters: [{ "semester._id": req.params.semester }, { "course.course": courseToRemoeveFaculty[0].course }],
      }
    );
    if (deleteSchedule.modifiedCount === 0) return res.status(500).json({ status: 500, data: [] });
    io.getIO().emit("deleteSectionSchedule", {
      id: req.params.schedule,
      hours: req.headers.hours,
      section: req.headers.section,
      course: req.headers.course,
      type: req.headers.type,
    });
    res.status(200).json({ status: 200, data: removeFaculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};
