const Course = require("../../models/course");
const Tag = require("../../models/tag");
const { validationResult } = require("express-validator");
const readXlsxFile = require("read-excel-file/node");
const mongoose = require("mongoose");
const AcademicQualification = require("../../models/academic-qualification");
const fs = require("fs");

exports.get = (req, res, next) => {
  Course.find({ deleted: false })
    .populate("qualification.academicQualification")
    .populate("qualification.licenseIndustry")
    .then((course) => {
      res.json({ status: 200, data: course });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.getFiltered = (req, res, next) => {
  console.log(req.params.courses.split(","));
  Course.find({ _id: { $nin: req.params.courses.split(",") } })
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
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

exports.getOne = (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .populate("qualification.academicQualification")
    .populate("qualification.licenseIndustry")
    .then((course) => {
      if (!course) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: course });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.post = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 400, errors: errors.mapped() });
  }
  Course.findOne({ courseCode: req.body.courseCode })
    .then((result) => {
      if (result) {
        result.courseCode = req.body.courseCode;
        result.courseDescription = req.body.courseDescription;
        result.lecture = req.body.lecture;
        result.customTitle = req.body.customTitle;
        result.lab = req.body.lab;
        result.units = req.body.units;
        result.examination = req.body.examination;
        result.qualification = {
          academicQualification: req.body.academicQualification,
          licenseIndustry: req.body.licenseIndustry,
          degree: req.body.degree,
          experience: req.body.experience,
        };
        return result.save();
      }
      return new Course({
        courseCode: req.body.courseCode,
        courseDescription: req.body.courseDescription,
        lecture: req.body.lecture,
        customTitle: req.body.customTitle,
        lab: req.body.lab,
        units: req.body.units,
        examination: req.body.examination,
        qualification: {
          academicQualification: req.body.academicQualification,
          licenseIndustry: req.body.licenseIndustry,
          degree: req.body.degree,
          experience: req.body.experience,
        },
      }).save();
    })
    .then((result) => {
      return Course.populate(result, { path: "qualification.licenseIndustry" });
    })
    .then((result) => {
      return Course.populate(result, {
        path: "qualification.academicQualification",
      });
    })
    .then((result) => {
      res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ status: 500, data: error });
    });
};

exports.edit = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ ok: false, errors: errors.mapped() });
  }
  Course.findOneAndUpdate(
    { _id: req.params.id },
    {
      courseCode: req.body.courseCode,
      courseDescription: req.body.courseDescription,
      lecture: req.body.lecture,
      customTitle: req.body.customTitle,
      lab: req.body.lab,
      units: req.body.units,
      examination: req.body.examination,
      qualification: {
        academicQualification: req.body.academicQualification,
        licenseIndustry: req.body.licenseIndustry,
        degree: req.body.degree,
        experience: req.body.experience,
      },
    },
    { new: true }
  )
    .then((result) => {
      return Course.populate(result, {
        path: "qualification.licenseIndustry",
      });
    })
    .then((result) => {
      return Course.populate(result, {
        path: "qualification.academicQualification",
      });
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.delete = (req, res, next) => {
  Course.findOneAndUpdate({ _id: req.params.id }, { deleted: true })
    .then((result) => {
      console.log(result);
      res.json({ status: 202, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
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
