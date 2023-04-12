const Faculty = require("../../models/user");
const AcademicQualification = require("../../models/academic-qualification");
const Tag = require("../../models/tag");
const { validationResult } = require("express-validator");
const readXlsxFile = require("read-excel-file/node");
const { sendMail } = require("../../helper/email");
const nodemailer = require("nodemailer");
const Crypto = require("crypto");

const bcrypt = require("bcrypt");
const FacultyType = require("../../models/faculty-type");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

exports.get = async (req, res, next) => {
  try {
    const faculty = await Faculty.find({ deleted: false, role: "user" })
      .populate("facultyInformation.courseTaken")
      .populate("facultyInformation.facultyType");

    if (faculty.length === 0)
      return res.status(404).json({ msg: "No Faculty Available" });

    res.status(200).json({ faculty });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findOne({ role: "user", _id: id })
      .populate("facultyInformation.facultyType")
      .populate("facultyInformation.courseTaken");

    if (!faculty) return res.status(404).json({ msg: "Faculty not found" });
    res.status(200).json({ faculty });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const password = Crypto.randomBytes(8).toString("base64").slice(0, 9);
    const hashedPassword = await bcrypt.hash(password, 12);

    const {
      facultyCode,
      email,
      firstName,
      middleName,
      lastName,
      facultyType,
      academicQualifications,
    } = req.body;

    const existingFaculty = await Faculty.findOne({
      "facultyInformation.facultyCode": facultyCode,
    });
    let newFaculty;
    if (existingFaculty) {
      existingFaculty = {
        ...existingFaculty,
        email,
        password: hashedPassword,
        userInformation: {
          firstName,
          middleName,
          lastName,
        },
        facultyInformation: {
          facultyCode,
          facultyType,
          academicQualifications,
        },
      };
      newFaculty = await existingFaculty.save();
    } else {
      newFaculty = await new Faculty({
        email,
        password: hashedPassword,
        userInformation: {
          firstName,
          middleName,
          lastName,
        },
        facultyInformation: {
          facultyCode,
          facultyType,
          academicQualifications,
        },
      }).save();
    }

    const sendMailData = await sendMail(
      email,
      "Schedula - Random Password",
      password
    );

    const faculty = await Faculty.findOne({ email: email })
      .populate("facultyInformation.facultyType")
      .populate("facultyInformation.courseTaken");

    res.status(201).json({ msg: "Faculty successfully added", faculty });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.put = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      facultyCode,
      firstName,
      middleName,
      lastName,
      facultyType,
      academicQualifications,
      email,
    } = req.body;
    const faculty = await Faculty.findOneAndUpdate(
      { _id: id },
      {
        email,
        facultyInformation: {
          facultyCode,
          facultyType,
          academicQualifications,
        },
        userInformation: { firstName, middleName, lastName },
      },
      { new: true }
    )
      .populate("facultyInformation.facultyType")
      .populate("facultyInformation.courseTaken");

    res.status(200).json({ msg: "Faculty successfully edited", faculty });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findOneAndUpdate(
      { _id: id },
      { deleted: true }
    );

    res.status(200).json({ msg: "Faculty successfully deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.postCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { courses } = req.body;
    const faculty = await Faculty.findOneAndUpdate(
      { _id: id },
      { "facultyInformation.courseTaken": courses },
      { new: true }
    )
      .populate("facultyInformation.courseTaken")
      .populate("facultyInformation.facultyType");

    res.status(200).json({ msg: "Course successfully added", faculty });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getFacultyType = (req, res, next) => {
  Faculty.findOne({ deleted: false, _id: req.params.id })
    .populate("userInformation.facultyType")
    .select("userInformation.facultyType")
    .then((faculty) => {
      const facultyType = faculty.userInformation.facultyType;
      res.json({
        status: 200,
        data: {
          facultyType: facultyType.facultyType,
          maxUnits: facultyType.unitsCap,
          maxHours: facultyType.hoursCap,
        },
      });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.postSpreadsheet = async (req, res, next) => {
  try {
    console.log(req.body);
    const rows = await readXlsxFile(Buffer.from(req.file.buffer));
    rows.shift();
    const facultyType = await FacultyType.find();
    const password = Crypto.randomBytes(8).toString("base64").slice(0, 9);
    const hashedPassword = await bcrypt.hash(password, 12);
    const data = rows.map((element) => {
      const type = facultyType.find((e) => e.facultyType === element[6]);
      console.log(type ? e._id : facultyType[0]._id);
      return {
        facultyCode: element[1].toLowerCase(),
        lastName: element[2] ? element[2].toLowerCase() : "",
        firstName: element[3] ? element[3].toLowerCase() : "",
        middleName: element[4] ? element[4].toLowerCase() : "",
        email: element[5].toLowerCase().replace(/\s/g, ""),
        facultyType: type ? e._id : facultyType[0]._id,
        password: hashedPassword,
      };
    });
    const bulkWrite = await Faculty.bulkWrite(
      await data.map((e) => {
        return {
          updateOne: {
            filter: { "facultyInformation.facultyCode": e.facultyCode },
            update: {
              email: e.email,
              password: e.password,
              facultyInformation: {
                facultyType: e.facultyType,
                facultyCode: e.facultyCode,
              },
              userInformation: {
                lastName: e.lastName,
                firstName: e.firstName,
                middleName: e.middleName,
              },
            },
            upsert: true,
          },
        };
      })
    );

    console.log(bulkWrite);
    res.status(200).json({ msg: "Successfully Uploaded" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.postSchedulePreference = (req, res, next) => {
  console.log(req.body);
  Faculty.findOneAndUpdate(
    { _id: req.params.id },
    {
      $push: {
        "userInformation.schedulePreference": {
          day: req.body.day,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
      },
    },
    { new: true }
  )
    .then((result) => {
      res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, data: error });
    });
};

exports.putSchedulePreference = (req, res, next) => {
  console.log(req.body);
  Faculty.updateOne(
    { _id: req.params.id },
    {
      "userInformation.schedulePreference.$[schedule].day": req.body.day,
      "userInformation.schedulePreference.$[schedule].startTime":
        req.body.startTime,
      "userInformation.schedulePreference.$[schedule].endTime":
        req.body.endTime,
    },
    { arrayFilters: [{ "schedule._id": req.params.preference }] }
  )
    .then((result) => {
      console.log(result);
      res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, data: error });
    });
};

exports.deleteSchedulePreference = (req, res, next) => {
  console.log(req.body);
  Faculty.updateOne(
    { _id: req.params.id },
    {
      $pull: {
        "userInformation.schedulePreference": { _id: req.params.preference },
      },
    }
    // { arrayFilters: [{ "schedule._id": req.params.preference }] }
  )
    .then((result) => {
      console.log(result);
      res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
    });
};

exports.sendNewPassword = async (req, res, next) => {
  try {
    const password = Crypto.randomBytes(8).toString("base64").slice(0, 9);
    const hashedPassword = await bcrypt.hash(password, 12);
    const { id } = req.params;
    console.log(req.params);
    const faculty = await Faculty.findOneAndUpdate(
      { _id: id },
      { password: hashedPassword }
    );

    const mail = await sendMail(
      faculty.email,
      "Schedula - Random Password",
      password
    );
    console.log(mail);
    res.status(200).json({ msg: "Password successfully sent." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

Array.prototype.unique = function () {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1);
    }
  }

  return a;
};
