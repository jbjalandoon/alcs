const Year = require("../../models/year");
const Curriculum = require("../../models/curriculum");
const { validationResult } = require("express-validator");

exports.get = async (req, res, next) => {
  try {
    const year = await Year.find({ deleted: false });

    if (year.length === 0)
      return res.status(404).json({ msg: "No School Year Available" });

    res.status(200).json({ year });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const year = await Year.findOne({ _id: id });

    if (!year) return res.status(404).json({ msg: "School Year not found" });

    res.status(200).json({ year: year });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const { year } = req.body;
    const schoolYear = await new Year({
      year,
    }).save();

    const existingCurriculum = await Curriculum.findOne({
      schoolYear: schoolYear._id,
    });

    if (!existingCurriculum) {
      const curriulum = await new Curriculum({
        schoolYear: schoolYear._id,
        semesters: [
          { sem: "first", isActive: false, activeFaculties: [] },
          { sem: "second", isActive: false, activeFaculties: [] },
          { sem: "summer", isActive: false, activeFaculties: [] },
        ],
      }).save();
    }

    res
      .status(201)
      .json({ msg: "School year successfully addded", year: schoolYear });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year } = req.body;
    const schoolYear = await Year.findOneAndUpdate(
      { _id: id },
      { year: year },
      { new: true }
    );

    res
      .status(200)
      .json({ msg: "School year successfully edited", year: schoolYear });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const year = await Year.findOneAndUpdate({ _id: id }, { deleted: true });

    res.status(200).json({ msg: "School year successfully deleted", year });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
