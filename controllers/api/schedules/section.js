const Schedule = require("../../../models/curriculum");
const io = require("../../../socket");
const mongoose = require("mongoose");

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
