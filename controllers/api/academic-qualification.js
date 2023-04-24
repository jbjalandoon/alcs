const AcademicQualification = require("../../models/academic-qualification");
const { validationResult } = require("express-validator");

exports.get = async (req, res, next) => {
  try {
    const aq = await AcademicQualification.find({ deleted: false });

    if (aq.length === 0)
      return res.status(404).json({ msg: "No Academic Qualification Found" });

    res.status(200).json({ aq });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aq = await AcademicQualification.findOne({
      deleted: false,
      _id: id,
    });

    if (!aq) return res.status(200).json({ aq });

    res.status(200).json({ aq });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.getMultiple = (req, res, next) => {
  AcademicQualification.find({
    deleted: false,
    _id: { $in: req.params.academicQualification.split(",") },
  })
    .populate("licenseIndustry")
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      return res.json({ ok: true, data: result });
    })
    .catch((error) => {
      return res.json({ ok: false, data: error });
    });
};

exports.post = async (req, res, next) => {
  try {
    const { academicQualification, licenseIndustry } = req.body;
    const aq = await new AcademicQualification({
      academicQualification,
      licenseIndustry,
    }).save();

    res
      .status(200)
      .json({ msg: "Academic Qualification Succcessfully Added", aq });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { academicQualification, licenseIndustry } = req.body;

    const aq = await AcademicQualification.findOneAndUpdate(
      { _id: id },
      { academicQualification, licenseIndustry },
      { new: true }
    );

    res.status(200).json({ msg: "Successfully Edited", aq });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aq = await AcademicQualification.findOneAndUpdate(
      { _id: id },
      { deleted: true }
    );

    res
      .status(200)
      .json({ msg: "Academic Qualification Successfully Deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
};
