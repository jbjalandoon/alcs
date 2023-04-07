const Course = require("../../models/course");
const Tag = require("../../models/tag");
const { validationResult } = require("express-validator");
const readXlsxFile = require("read-excel-file/node");
const mongoose = require("mongoose");
const AcademicQualification = require("../../models/academic-qualification");
const fs = require("fs");

exports.get = async (req, res, next) => {
  try {
    const course = await Course.find({ deleted: false }).populate(
      "qualification.academicQualification"
    );

    if (course.length === 0) {
      return res.status(404).json({ msg: "No course available" });
    }

    res.status(200).json({ course });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findOne({ _id: id }).populate(
      "qualification.academicQualification"
    );

    if (!course) return res.status(404).json({ msg: "Course not found" });

    res.status(200), json({ course });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.post = async (req, res, next) => {
  try {
    const {
      courseCode,
      courseDescription,
      customTitle,
      lecture,
      lab,
      units,
      examination,
      academicQualification,
      licenseIndustry,
      degree,
      experience,
    } = req.body;

    const qualification = {
      academicQualification,
      licenseIndustry,
      degree,
      experience,
    };

    const existingCourse = await Course.findOne({ courseCode });
    let newCourse;
    if (existingCourse) {
      existingCourse = {
        ...existingCourse,
        courseCode,
        courseDescription,
        customTitle,
        lecture,
        lab,
        units,
        examination,
        qualification,
      };
      newCourse = await existingCourse.save();
    } else {
      newCourse = await new Course({
        courseCode,
        courseDescription,
        customTitle,
        lecture,
        lab,
        units,
        examination,
        qualification,
      }).save();
    }

    res.status(201).json({
      msg: "Course successfully added",
      course: await newCourse.populate("qualification.academicQualification"),
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      courseCode,
      courseDescription,
      customTitle,
      lecture,
      lab,
      units,
      examination,
      academicQualification,
      licenseIndustry,
      degree,
      experience,
    } = req.body;

    const qualification = {
      academicQualification,
      licenseIndustry,
      degree,
      experience,
    };
    const course = await findOneAndUpdate(
      { _id: id },
      {
        courseCode,
        courseDescription,
        customTitle,
        lecture,
        lab,
        units,
        examination,
        qualification,
      }
    ).populate("qualification.academicQualification");

    res.status(200).json({ msg: "Course succesfully edited", course });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = id;
    const course = await Course.findOneAndUpdate(
      { _id: id },
      { deleted: true }
    );

    res.status(200).json({ msg: "Course successfully deleted" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getFiltered = (req, res, next) => {
  console.log(req.params.courses.split(","));
  Course.find({ _id: { $nin: req.params.courses.split(",") } })
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res
        .status(500)
        .json({ msg: "Something went wrong" })
        .json({ status: 500, data: error });
    });
};

exports.getUnits = (req, res, next) => {
  Course.find({
    _id: {
      $in: req.query.programs.split(",").map((e) => mongoose.Types.ObjectId(e)),
    },
  })
    .then((result) => {
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      res.json({ ok: false, data: error });
    });
};

exports.postSpreadsheet = (req, res, next) => {
  let tags,
    fetchedTag = [];
  let academicQualificationUnique = [];
  let storedLicenseIndustry = [];
  let newLicenseIndustry = [];
  let data;
  readXlsxFile(Buffer.from(req.file.buffer))
    .then((rows) => {
      rows.shift();
      data = rows.map((element) => {
        let licenseIndustry = [];
        const academicQualification = element[3]
          .replace(/\s/g, "")
          .toLowerCase()
          .split(",");

        academicQualificationUnique = academicQualificationUnique
          .concat(academicQualification)
          .unique();

        academicQualification.forEach((e) => {
          const array = e.replace(/\s/g, "").toLowerCase().split("-");
          array.shift();
          if (array[0]) {
            licenseIndustry = licenseIndustry
              .concat(array[0].split("."))
              .unique();
          } else {
            licenseIndustry = [];
          }
        });

        return {
          courseCode: element[0].toLowerCase(),
          customTitle: element[1] ? element[1].toLowerCase() : null,
          courseDescription: element[2].toLowerCase(),
          academicQualification: academicQualification.map(
            (e) => e.split("-")[0]
          ),
          licenseIndustry: licenseIndustry,
          units: element[4],
          lecture: element[5],
          lab: element[6],
          experience: element[7],
          degree: element[8],
        };
      });
      academicQualificationUnique = academicQualificationUnique
        .map((e) => {
          const split = e.toLowerCase().split("-");
          if (split[1]) {
            storedLicenseIndustry.push({
              academicQualification: split[0],
              licenseIndustry: split[1].split("."),
            });
          }
          return split[0];
        })
        .unique();
      academicQualificationUnique = academicQualificationUnique.map(
        (e, index) => {
          const licenseIndustry = [];
          storedLicenseIndustry.forEach((element) => {
            if (element.academicQualification === e) {
              licenseIndustry.push(...element.licenseIndustry);
            }
            newLicenseIndustry.push(...element.licenseIndustry);
          });
          return {
            academicQualification: e,
            licenseIndustry: licenseIndustry.unique(),
          };
        }
      );
      tags = newLicenseIndustry.unique();
      return Tag.find({ tag: { $in: tags } });
    })
    .then((result) => {
      const tagId = [];
      fetchedTag.push(...result);
      result.forEach((element) => {
        tagId.push(element._id);
      });
      const newTag = tags.filter(
        (element) =>
          !result
            .map((e) => {
              return e.tag;
            })
            .includes(element)
      );
      return Tag.insertMany(
        newTag.map((e) => {
          return { tag: e };
        })
      );
    })
    .then((result) => {
      fetchedTag.push(...result);
      academicQualificationUnique = academicQualificationUnique.map((aq) => {
        return {
          academicQualification: aq.academicQualification,
          licenseIndustry: aq.licenseIndustry.map((e) => {
            let id;
            fetchedTag.forEach((tags) => {
              if (tags.tag === e) {
                id = tags._id;
              }
            });
            return id;
          }),
        };
      });
      return AcademicQualification.bulkWrite(
        academicQualificationUnique.map((e) => {
          console.log(e);
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
      console.log(result);
      return Tag.find();
    })
    .then((result) => {
      tags = result;
      return AcademicQualification.find();
    })
    .then((result) => {
      // console.log(data);
      data = data.map((e) => {
        return {
          courseCode: e.courseCode,
          courseDescription: e.courseDescription,
          customTitle: e.customTitle,
          qualification: {
            academicQualification: e.academicQualification.map((e) => {
              let id;
              for (let i = 0; i < result.length; i++) {
                if (result[i].academicQualification === e) {
                  id = result[i]._id;
                  break;
                }
              }
              return id;
            }),
            licenseIndustry: e.licenseIndustry.map((e) => {
              let id;
              for (let i = 0; i < tags.length; i++) {
                if (tags[i].tag === e) {
                  id = tags[i]._id;
                  break;
                }
              }
              return id;
            }),
            experience: e.experience,
            degree: e.degree,
          },
          units: e.units,
          lab: e.lab,
          lecture: e.lecture,
        };
      });
      return Course.bulkWrite(
        data.map((e) => {
          return {
            updateOne: {
              filter: { courseCode: e.courseCode },
              update: e,
              upsert: true,
            },
          };
        })
      );
    })
    .then((result) => {
      return Course.find({ deleted: false })
        .populate("qualification.academicQualification")
        .populate("qualification.licenseIndustry");
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
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
