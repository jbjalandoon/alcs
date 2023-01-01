const AcademicQualification = require("../../models/academic-qualification");
const Tag = require("../../models/tag");
const { validationResult } = require("express-validator");

exports.get = (req, res, next) => {
  AcademicQualification.find({ deleted: false })
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

exports.getOne = (req, res, next) => {
  AcademicQualification.findOne({
    deleted: false,
    _id: req.params.id,
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

exports.getMultiple = (req, res, next) => {
  // console.log(typeof req.params.academicQualification)
  console.log(req.params.academicQualification);
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

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  const tagId = [];
  let tags = req.body.licenseIndustry;
  Tag.find({ tag: { $in: req.body.licenseIndustry } })
    .then((result) => {
      result.forEach((element) => {
        tagId.push(element._id);
      });
      const newTag = tags.filter(
        (element) => !result.map((e) => e.tag).includes(element)
      );
      return Tag.insertMany(
        newTag.map((e) => {
          return { tag: e };
        })
      );
    })
    .then((result) => {
      result.forEach((element) => {
        tagId.push(element._id);
      });
      return new AcademicQualification({
        academicQualification: req.body.academicQualification,
        licenseIndustry: tagId,
      }).save();
    })
    .then((result) => {
      return AcademicQualification.populate(result, {
        path: "licenseIndustry",
      });
    })
    .then((result) => {
      return res.json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      return res.json({ status: 500, data: error });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  const tagId = [];
  let tags = req.body.licenseIndustry;
  Tag.find({ tag: { $in: req.body.licenseIndustry } })
    .then((result) => {
      result.forEach((element) => {
        tagId.push(element._id);
      });
      const newTag = tags.filter(
        (element) => !result.map((e) => e.tag).includes(element)
      );
      return Tag.insertMany(
        newTag.map((e) => {
          return { tag: e };
        })
      );
    })
    .then((result) => {
      result.forEach((element) => {
        tagId.push(element._id);
      });
      return AcademicQualification.findOneAndUpdate(
        { _id: req.params.id },
        {
          academicQualification: req.body.academicQualification,
          licenseIndustry: tagId,
        },
        { new: true }
      );
    })
    .then((result) => {
      return AcademicQualification.populate(result, {
        path: "licenseIndustry",
      });
    })
    .then((result) => {
      return res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({ status: 500, data: error });
    });
};

exports.delete = (req, res, next) => {
  AcademicQualification.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    {
      deleted: true,
    }
  )
    .then((result) => {
      console.log(result);
      return res.json({ status: 202, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};
