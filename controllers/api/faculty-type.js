const FacultyType = require("../../models/faculty-type");

exports.get = async (req, res, next) => {
  try {
    const facultyType = await FacultyType.find({ deleted: false });

    if (facultyType.length === 0)
      return res.status(404).json({ msg: "No faculty type available" });

    res.status(200).json({ facultyType });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyType = await FacultyType.findOne({ _id: id, deleted: false });

    if (!facultyType)
      return res.status(404).json({ msg: "Faculty type not found" });

    res.status(200).json({ facultyType });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const { facultyType, unitsCap } = req.body;
    const existingFacultyType = await FacultyType.findOne({
      facultyType: req.body.facultyType,
    });
    let newFacultyType;
    if (existingFacultyType) {
      existingFacultyType = {
        unitsCap,
        deleted: false,
      };
      newFacultyType = await existingFacultyType.save();
    } else {
      newFacultyType = await new FacultyType({
        facultyType,
        unitsCap,
      }).save();
    }

    res.status(201).json({
      msg: "Successfully added faculty type",
      facultyType: newFacultyType,
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.put = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyType = await FacultyType.findOneAndUpdate(
      { _id: id },
      { ...req.body },
      { new: true }
    );

    res
      .status(200)
      .json({ msg: "Faculty type successfully edited", facultyType });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const facultyType = await FacultyType.findOneAndUpdate(
      { _id: id },
      { deleted: true }
    );

    res.status(200).json({ msg: "Faculty type successfully deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
