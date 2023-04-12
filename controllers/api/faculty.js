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
      { 'facultyInformation.courseTaken': courses },
      { new: true }
    )
      .populate("facultyInformation.courseTaken")
      .populate("facultyInformation.facultyType");

    res.status(200).json({ msg: "Course successfully added", faculty });
  } catch (error) {
    console.log(error)
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

exports.putAcademicQualification = (req, res, next) => {
  console.log(req.body.academicQualifications);
  Faculty.findOneAndUpdate(
    { _id: req.params.id },
    {
      "userInformation.academicQualifications": req.body.academicQualifications,
    }
  )
    .then((result) => {
      console.log(result);
      if (!result) {
        return res.json({ ok: false });
      }
      return res.json({ ok: false, data: result });
    })
    .catch((error) => {
      return res.json({ ok: false, data: error });
    });
};

exports.postSpreadsheet = (req, res, next) => {
  const degreeEquivalent = ["associates", "bachelors", "masters", "doctoral"];
  const randomString = Crypto.randomBytes(8).toString("base64").slice(0, 9);
  let tags = [],
    fetchedTag,
    academicQualifications = [],
    storedLicenseIndustry = [],
    newLicenseIndustry = [],
    data;
  readXlsxFile(Buffer.from(req.file.buffer))
    .then((rows) => {
      rows.shift();
      data = rows.map((element) => {
        const academicQualification = element[6]
          .toLowerCase()
          .split(",")
          .map((e) => {
            const array = e.toLowerCase().split("-");
            const degreeLicense = array[1].toLowerCase().split("/");
            const degree = degreeLicense[0].replace(/\s/g, "");
            const licenseIndustry = degreeLicense[1]
              ? degreeLicense[1].toLowerCase().split(".")
              : [];
            return {
              academicQualification: array[0].toLowerCase().replace(/\s/g, ""),
              degree:
                degreeEquivalent.indexOf(degree.toLowerCase()) < 0
                  ? 0
                  : degreeEquivalent.indexOf(degree.toLowerCase()),
              licenseIndustry: licenseIndustry,
            };
          });

        return {
          facultyCode: element[1].toLowerCase(),
          lastName: element[2] ? element[2].toLowerCase() : null,
          firstName: element[3] ? element[3].toLowerCase() : null,
          middleName: element[4] ? element[4].toLowerCase() : null,
          email: element[5].toLowerCase().replace(/\s/g, ""),
          facultyType: element[7],
          academicQualification: academicQualification,
        };
      });
      data.forEach((element) => {
        element.academicQualification.forEach((element) => {
          if (element.licenseIndustry) {
            element.licenseIndustry.forEach((element) => {
              tags.push(element);
            });
          }
        });
      });
      return Tag.bulkWrite(
        tags.map((e) => {
          return {
            updateOne: {
              filter: { tag: e },
              update: {
                tag: e,
              },
              upsert: true,
            },
          };
        })
      );
    })
    .then((result) => {
      return Tag.find({ tag: { $in: tags } });
    })
    .then((result) => {
      data = data.map((element) => {
        return {
          facultyCode: element.facultyCode,
          lastName: element.lastName,
          firstName: element.firstName,
          middleName: element.middleName,
          email: element.email,
          facultyType: element.facultyType,
          academicQualification: element.academicQualification.map(
            (element) => {
              return {
                academicQualification: element.academicQualification,
                degree: element.degree,
                licenseIndustry: element.licenseIndustry.map((element) => {
                  let id;
                  for (let i = 0; i < result.length; i++) {
                    if (result[i].tag === element) {
                      id = result[i]._id;
                      break;
                    }
                  }
                  return id;
                }),
              };
            }
          ),
        };
      });
      data.forEach((element) => {
        element.academicQualification.forEach((element) => {
          academicQualifications.push({
            academicQualification: element.academicQualification,
            licenseIndustry: element.licenseIndustry,
          });
        });
      });
      return AcademicQualification.bulkWrite(
        academicQualifications.map((e) => {
          return {
            updateOne: {
              filter: { academicQualification: e.academicQualification },
              update: {
                academicQualification: e.academicQualification,
                $addToSet: { licenseIndustry: e.licenseIndustry },
              },
              upsert: true,
            },
          };
        })
      );
    })
    .then((result) => {
      return AcademicQualification.find({
        academicQualification: {
          $in: academicQualifications.map((e) => e.academicQualification),
        },
      });
    })
    .then((result) => {
      data = data.map((element) => {
        return {
          facultyCode: element.facultyCode,
          lastName: element.lastName,
          firstName: element.firstName,
          middleName: element.middleName,
          email: element.email,
          facultyType: element.facultyType,
          academicQualification: element.academicQualification.map(
            (element) => {
              let id;
              for (let i = 0; i < result.length; i++) {
                if (
                  result[i].academicQualification ===
                  element.academicQualification
                ) {
                  id = result[i]._id;
                }
              }
              return {
                academicQualification: id,
                degree: element.degree,
                experience: 0,
                licenseIndustry: element.licenseIndustry,
              };
            }
          ),
        };
      });
      return FacultyType.find({ deleted: false });
    })
    .then((result) => {
      data = data.map((element) => {
        let facultyType;
        for (let i = 0; i < result.length; i++) {
          if (
            result[i].facultyType.toLowerCase() ===
            element.facultyType.toLowerCase()
          ) {
            facultyType = result[i]._id;
            break;
          }
        }
        return {
          facultyCode: element.facultyCode.toLowerCase(),
          lastName: element.lastName.toLowerCase(),
          firstName: element.firstName.toLowerCase(),
          middleName: element.middleName,
          email: element.email.toLowerCase(),
          facultyType: facultyType,
          academicQualification: element.academicQualification,
        };
      });
      return bcrypt.hash(randomString, 12);
    })
    .then((password) => {
      return Faculty.bulkWrite(
        data.map((e) => {
          return {
            updateOne: {
              filter: { "userInformation.facultyCode": e.facultyCode },
              update: {
                email: e.email,
                password: password,
                userInformation: {
                  facultyCode: e.facultyCode,
                  lastName: e.lastName,
                  firstName: e.firstName,
                  middleName: e.middleName,
                  facultyType: e.facultyType,
                  academicQualifications: e.academicQualification,
                },
              },
              upsert: true,
            },
          };
        })
      );
    })
    .then((result) => {
      const emailDetails = {
        from: "sticaschedula@gmail.com",
        to: data.map((e) => e.email),
        subject: "No Reply - Password Generated",
        text: randomString,
      };
      return mailTransporter.sendMail(emailDetails);
    })
    .then((result) => {
      console.log(result);
      return Faculty.find({ deleted: false, role: "user" })
        .populate(
          "userInformation.academicQualifications.academicQualification"
        )
        .populate("userInformation.academicQualifications.licenseIndustry")
        .populate("userInformation.courseTaken")
        .populate("userInformation.facultyType");
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
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

exports.sendNewPassword = (req, res, next) => {
  let randomString = Crypto.randomBytes(8).toString("base64").slice(0, 9);
  bcrypt
    .hash(randomString, 12)
    .then((password) => {
      return Faculty.findOneAndUpdate(
        { _id: req.params.id },
        { password: password }
      );
    })
    .then((result) => {
      const emailDetails = {
        from: "sticaschedula@gmail.com",
        to: result.email,
        subject: "No Reply - Password Generated",
        text: randomString,
      };
      return mailTransporter.sendMail(emailDetails);
    })
    .then((result) => {
      console.log(result);
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
    });
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
