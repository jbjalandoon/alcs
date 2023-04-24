const Level = require("../../models/level");
const { validationResult } = require("express-validator");

exports.get = async (req, res, next) => {
  try {
    const yearLevel = await Level.find({ deleted: false });

    if (yearLevel.length === 0)
      return res.status(400).json({ msg: "No available year level" });

    res.status(200).json({ yearLevel });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const yearLevel = await Level.findOne({ _id: id });

    if (!yearLevel)
      return res.status(404).json({ msg: "Year Level not found" });

    res.status(200).json({ yearLevel });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const { yearLevel, display } = req.body;
    const existingYearLevel = await Level.findOne({
      $or: [{ yearLevel }, { display }],
    });
    let newYearLevel;
    if (existingYearLevel) {
      existingYearLevel.deleted = false;
      existingYearLevel.yearLevel = yearLevel;
      existingYearLevel.display = display;
      newYearLevel = await existingYearLevel.save();
    } else {
      newYearLevel = await new Level({
        yearLevel,
        display,
      }).save();
    }
    res
      .status(201)
      .json({ msg: "Year level successfully added", yearLevel: newYearLevel });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { yearLevel, display } = req.body;
    const newYearLevel = await Level.findOneAndUpdate(
      { _id: id },
      { yearLevel, display },
      { new: true }
    );

    res
      .status(200)
      .json({ msg: "Year level successfully edited", yearLevel: newYearLevel });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const yearLevel = await Level.findOneAndUpdate(
      { _id: id },
      { deleted: true }
    );
    res.status(200).json({ msg: "Year level successfully deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
