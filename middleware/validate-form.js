const { validationResult } = require("express-validator");

const validateForm = (req, res, next) => {
  console.log(req.body);
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ msg: "Validation Error", errors: errors.mapped() });
  }
  next();
};

module.exports = validateForm;
