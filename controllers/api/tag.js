const Tag = require("../../models/tag");

exports.get = (req, res, next) => {
  Tag.find()
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, data: error });
    });
};
