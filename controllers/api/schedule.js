const Curriculum = require("../../models/curriculum");
const mongoose = require("mongoose");

exports.getOneSchedule = (req, res, next) => {
  Curriculum.aggregate([
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
        "semesters.programs.year.sections.schedules._id":
          mongoose.Types.ObjectId(req.params.schedule),
      },
    },
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
        from: "faculties",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result[0] });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getRoomSchedule = (req, res, next) => {
  Curriculum.aggregate([
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
        "semesters.programs.year.sections.schedules.room":
          mongoose.Types.ObjectId(req.params.room),
      },
    },
    {
      $project: {
        _id: "$semesters.programs.year.sections.schedules._id",
        section: "$semesters.programs.year.sections._id",
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
        from: "faculties",
        localField: "faculty",
        foreignField: "_id",
        as: "faculty",
      },
    },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
  ])
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .then((error) => {
      console.log(error);
    });
};

exports.setSchedule = (req, res, next) => {
  const days = ["m", "t", "w", "th", "f", "s", null];
  Curriculum.updateOne(
    {
      "semesters.programs.year.sections.schedules._id": req.params.schedule,
    },
    {
      $set: {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].day":
          days[req.body.day - 1],
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].start_time":
          req.body.start_time,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].end_time":
          req.body.end_time,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].room":
          req.body.room,
      },
    },
    { arrayFilters: [{ "schedule._id": req.params.schedule }] }
  )
    .then((result) => {
      if (!result.modifiedCount) {
        return res.json({ ok: false });
      }
      res.json({ ok: true });
    })
    .catch((error) => {
      res.json({ false: true });
    });
};

exports.deleteSchedule = (req, res, next) => {
  Curriculum.updateOne(
    {
      "semesters.programs.year.sections.schedules._id": req.params.schedule,
    },
    {
      $set: {
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].day":
          null,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].start_time":
          null,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].end_time":
          null,
        "semesters.$[].programs.$[].year.$[].sections.$[].schedules.$[schedule].room":
          null,
      },
    },
    { arrayFilters: [{ "schedule._id": req.params.schedule }] }
  )
    .then((result) => {
      if (!result.modifiedCount) {
        return res.json({ ok: false });
      }
      res.json({ ok: true });
    })
    .catch((error) => {
      res.json({ false: true });
    });
};
