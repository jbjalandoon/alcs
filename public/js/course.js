const table = $("#courseTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
         </div>`,
  },
});
const csrf = $("#csrf").val();

const degrees = [
  "Associate Degree",
  "Bachelors Degree",
  "Masters Degree",
  "Doctoral",
];

const tableData = (operation, data) => {
  operation([
    data.courseCode.toUpperCase(),
    data.courseDescription.toUpperCase(),
    data.lecture ? data.lecture : "N/A",
    data.lab ? data.lab : "N/A",
    data.units,
    data.qualification.academicQualification.length !== 0
      ? data.qualification.academicQualification
          .map((element) => {
            return ("aq-" + element.academicQualification).toUpperCase();
          })
          .join(", ")
      : "N/A",
    data.qualification.experience,
    degrees[data.qualification.degree - 1].toUpperCase(),
    data.qualification.licenseIndustry.length === 0
      ? "N/A"
      : data.qualification.licenseIndustry
          .map((element) => {
            return element.tag.toUpperCase();
          })
          .join(", "),
    actionButton(data._id),
  ]).draw();
};

fetch("/api/courses", { method: "GET" })
  .then((response) => {
    return response.json();
  })
  .then((course) => {
    course.data.forEach((element) => {
      tableData(table.row.add, element);
    });
  })
  .catch((error) => {
    console.log(error);
  });

let editModal = new bootstrap.Modal($("#editModal"));
let addModal = new bootstrap.Modal($("#addModal"));
let uploadModal = new bootstrap.Modal($("#uploadModal"));

$(addModal._element).on("show.bs.modal", (event) => {
  $(event.currentTarget).find("#academicQualification").off("change");
  const courseCode = $(event.currentTarget).find("#courseCode");
  const courseDescription = $(event.currentTarget).find("#courseDescription");
  const lecture = $(event.currentTarget).find("#lecture");
  const lab = $(event.currentTarget).find("#lab");
  const units = $(event.currentTarget).find("#units");
  const academicQualification = $(event.currentTarget)
    .find("#academicQualification")
    .select2({
      multiple: true,
      width: "100%",
    });
  const experience = $(event.currentTarget).find("#experience");
  const degree = $(event.currentTarget).find("#degree");
  const licenseIndustry = $(event.currentTarget)
    .find("#licenseIndustry")
    .select2({
      multiple: true,
      width: "100%",
    });
  const examination = $(event.currentTarget).find("#examination");
  const button = $(event.currentTarget).find("#addButton");
  button.off("click");
  courseCode.val("");
  courseDescription.val("");
  lecture.val("");
  lab.val("");
  units.val("");
  academicQualification.empty();
  experience.val("");
  degree.val("");
  licenseIndustry.empty();
  examination.prop("checked", false);
  fetch("/api/academic-qualifications")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      // academicQualification.off("change");
      result.data.forEach((e) => {
        academicQualification
          .append(new Option(e.academicQualification.toUpperCase(), e._id))
          .trigger("change");
      });
      academicQualification.on("change", () => {
        fetch(
          "/api/academic-qualifications/multiple/" + academicQualification.val()
        )
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            licenseIndustry.empty();
            if (result.data.length !== 0) {
              result.data.forEach((el) => {
                el.licenseIndustry.map((e) => {
                  return licenseIndustry.append(
                    new Option(
                      el.academicQualification.toUpperCase() +
                        "-" +
                        e.tag.toUpperCase(),
                      e._id
                    )
                  );
                });
              });
            }
          });
      });
      button.on("click", () => {
        fetch("/api/courses", {
          method: "POST",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseCode: courseCode.val().toLowerCase(),
            courseDescription: courseDescription.val().toLowerCase(),
            units: units.val(),
            lab: lab.val(),
            lecture: lecture.val(),
            academicQualification: academicQualification.val(),
            experience: experience.val(),
            degree: degree.val(),
            examination: examination.is(":checked"),
            licenseIndustry: licenseIndustry.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            console.log(result);
            if (result.errors) {
              displayValidationError(result.errors, event.currentTarget);
              return displayToast(result);
            }
            addModal.hide();
            tableData(table.row.add, result.data);
            return displayToast(result);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

$(editModal._element).on("show.bs.modal", (event) => {
  $(event.currentTarget).find("#academicQualification").off("change");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const courseCode = $(event.currentTarget).find("#courseCode");
  const courseDescription = $(event.currentTarget).find("#courseDescription");
  const lecture = $(event.currentTarget).find("#lecture");
  const lab = $(event.currentTarget).find("#lab");
  const units = $(event.currentTarget).find("#units");
  const academicQualification = $(event.currentTarget)
    .find("#academicQualification")
    .select2({
      multiple: true,
      width: "100%",
    });
  academicQualification.empty();
  const experience = $(event.currentTarget).find("#experience");
  const degree = $(event.currentTarget).find("#degree");
  const licenseIndustry = $(event.currentTarget)
    .find("#licenseIndustry")
    .select2({
      multiple: true,
      width: "100%",
    });
  licenseIndustry.empty();
  const examination = $(event.currentTarget).find("#examination");
  const button = $(event.currentTarget).find("#editButton");
  button.off("click");
  fetch("/api/academic-qualifications")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.forEach((e) => {
        academicQualification.append(
          new Option(e.academicQualification.toUpperCase(), e._id)
        );
      });
      return fetch("/api/courses/" + id);
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      let licenseIndustryValue = result.data.qualification.licenseIndustry.map(
        (e) => e._id
      );
      academicQualification.on("change", () => {
        fetch(
          "/api/academic-qualifications/multiple/" + academicQualification.val()
        )
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            licenseIndustry.empty();
            result.data.forEach((el) => {
              el.licenseIndustry.forEach((e) => {
                console.log(e._id);
                licenseIndustry.append(new Option(e.tag.toUpperCase(), e._id));
              });
            });
            licenseIndustry.val(licenseIndustryValue).trigger("change");
          });
      });
      console.log(result.data.courseCode);
      courseCode.val(result.data.courseCode);
      courseDescription.val(result.data.courseDescription);
      lecture.val(result.data.lecture);
      lab.val(result.data.lab);
      units.val(result.data.units);
      academicQualification
        .val(result.data.qualification.academicQualification.map((e) => e._id))
        .trigger("change");
      degree.val(result.data.qualification.degree);
      experience.val(result.data.qualification.experience);
      examination.prop("checked", result.data.examination);
      button.on("click", () => {
        fetch("/api/courses/" + id, {
          method: "PUT",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            courseCode: courseCode.val().toLowerCase(),
            courseDescription: courseDescription.val().toLowerCase(),
            units: units.val(),
            lab: lab.val(),
            lecture: lecture.val(),
            academicQualification: academicQualification.val(),
            experience: experience.val(),
            degree: degree.val(),
            examination: examination.is(":checked"),
            licenseIndustry: licenseIndustry.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            console.log(result);
            if (result.errors) {
              displayValidationError(result.errors, event.currentTarget);
              return displayToast(result);
            }
            editModal.hide();
            tableData(
              table.row($(event.relatedTarget).closest("tr")).data,
              result.data
            );
            return displayToast(result);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    });
});

$(uploadModal._element).on("show.bs.modal", (event) => {
  const button = $(event.currentTarget).find("#uploadButton");
  const body = new FormData();
  button.off("click");
  button.on("click", () => {
    body.append(
      "spreadsheet",
      $(event.currentTarget).find("#spreadsheet")[0].files[0]
    );
    fetch("/api/courses/upload", {
      method: "POST",
      headers: { "csrf-token": csrf },
      body: body,
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.errors) {
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        uploadModal.hide();
        result.data.forEach((element) => {
          tableData(table.row.add, element);
        });
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayToast(error);
      });
  });
});

const deleteData = (id, element) => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    preConfirm: () => {
      return fetch("/api/courses/" + id, {
        method: "DELETE",
        headers: {
          "csrf-token": csrf,
        },
      })
        .then((response) => {
          return response.json();
        })
        .catch((error) => {
          console.log(error);
        });
    },
  })
    .then((result) => {
      if (result.isConfirmed) {
        table.row(element.closest("tr")).remove().draw();
        return displayToast(result.value);
      }
    })
    .catch((error) => {
      console.log(error);
      displayToast(error);
    });
};
