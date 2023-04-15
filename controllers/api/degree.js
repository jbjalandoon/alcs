const Degree = require("../../models/degree");
const Tag = require("../../models/tag");

exports.get = (req, res, next) => {
  Degree.find()
    .populate("tags")
    .then((result) => {
      // if (!result) {
      //   return res.json({ ok: false, data: result });
      // }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, data: error });
    });
};

exports.getOne = (req, res, next) => {};

exports.post = (req, res, next) => {
  const tagId = [];
  let tags = req.body.tags;
  Tag.find({ tag: { $in: req.body.tags } })
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
      return Degree.insertMany({
        degree: req.body.degree,
        abbreviation: req.body.abbreviation,
        tags: tagId,
      });
    })
    .then((result) => {
      if (!result) {
        return res.json({ ok: false, data: result });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, data: error });
    });

};

exports.edit = (req, res, next) => {};

exports.delete = (req, res, next) => {};
