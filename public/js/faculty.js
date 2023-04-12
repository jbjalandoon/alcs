const table = $("#facultyTable").DataTable({});

const degreeEquivalent = [
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral",
];

const tableData = (operation, data) => {
  const { firstName, lastName, middleName } = data.userInformation;
  const { facultyCode, facultyType, academicQualifications, courseTaken } =
    data.facultyInformation;
  const { email } = data;
  operation([
    facultyCode.toUpperCase(),
    `${firstName} ${middleName} ${lastName}`,
    facultyType.facultyType.toUpperCase(),
    email,
    academicQualifications.length !== 0
      ? academicQualifications
          .map((element) => {
            return `
              <div>
                <h6>${element.academicQualification.toUpperCase()}</h6>
                <ul>
                  <li>${element.experience} year/s of experience.</li>
                  <li>${degreeEquivalent[element.degree - 1]}</li>
                  ${element.licenseIndustry
                    .map((element) => {
                      return "<li>" + element.toUpperCase() + "</li>";
                    })
                    .join("")}
                </ul>
              </div>`;
          })
          .join("")
      : "N/A",
    courseTaken.length !== 0
      ? courseTaken
          .map((element) => {
            return element.courseCode.toUpperCase();
          })
          .join(", ")
      : "N/A",
    ` 
      
      <button class="btn btn-sm btn-secondary mb-1" data-bs-toggle="modal" data-bs-target="#addCourseModal" data-bs-id="${
        data._id
      }">Course Taken</button>
      <button class="btn btn-sm btn-secondary mb-1" onClick="sendPassword('${
        data._id
      }')" id="${data._id}">Send Password</button>
      ${actionButton(data._id)}
    `,
  ]).draw();
};

const csrf = $("#csrf").val();

const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));
const addCourseModal = new bootstrap.Modal($("#addCourseModal"));
const uploadModal = new bootstrap.Modal($("#uploadModal"));

(async () => {
  try {
    const { data } = await axios.get(`/api/faculty`);
    data.faculty.forEach((element) => {
      tableData(table.row.add, element);
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", async (event) => {
  let experience, degrees, licenseIndustry, academicQualification;
  const firstName = $(event.currentTarget).find("#firstName");
  const middleName = $(event.currentTarget).find("#middleName");
  const lastName = $(event.currentTarget).find("#lastName");
  const facultyCode = $(event.currentTarget).find("#facultyCode");
  const facultyType = $(event.currentTarget).find("#facultyType");
  const email = $(event.currentTarget).find("#email");
  facultyType.empty();
  const removeAcademicQualification = $(event.currentTarget).find(
    "#removeAcademicQualification"
  );
  const newAcademicQualification = $(event.currentTarget).find(
    "#newAcademicQualification"
  );

  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  const card = $(event.currentTarget).find("#qaCard");
  removeAcademicQualification.off("click");
  newAcademicQualification.off("click");
  try {
    const { data: facultyTypesData } = await axios.get(`/api/faculty-types`);
    const { data: academicQualificationData } = await axios.get(
      `/api/academic-qualifications`
    );

    facultyTypesData.facultyType.forEach((element) => {
      facultyType.append(
        new Option(element.facultyType.toUpperCase(), element._id)
      );
    });

    academicQualification = $(event.currentTarget).find(
      ".academic-qualification"
    );
    academicQualification.off("change");
    experience = $(event.currentTarget).find(".experience");
    degrees = $(event.currentTarget).find(".degree");
    licenseIndustry = $(event.currentTarget).find(".license-industry");

    removeAcademicQualification.on("click", (buttonEvent) => {
      card.children().last().remove();
      academicQualification = $(event.currentTarget).find(
        ".academic-qualification"
      );
      experience = $(event.currentTarget).find(".experience");
      degrees = $(event.currentTarget).find(".degree");
      licenseIndustry = $(event.currentTarget).find(".license-industry");
      if (academicQualification.length === 1) {
        $(buttonEvent.currentTarget).addClass("disabled");
      }
    });

    newAcademicQualification.on("click", () => {
      makeNewAcademicQualification(card, academicQualificationData.aq);
      academicQualification = $(event.currentTarget).find(
        ".academic-qualification"
      );
      experience = $(event.currentTarget).find(".experience");
      degrees = $(event.currentTarget).find(".degree");
      licenseIndustry = $(event.currentTarget).find(".license-industry");
      if (academicQualification.length !== 1) {
        removeAcademicQualification.removeClass("disabled");
      }
    });
    removeAcademicQualification.trigger("click");
    newAcademicQualification.trigger("click");
    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        alert("test");
        formEvent.preventDefault();
        submit.html("Submitting...");
        buttons.addClass("disabled");
        removeValidationError([
          firstName,
          middleName,
          lastName,
          facultyCode,
          facultyType,
          email,
        ]);

        const qualifications = [];
        academicQualification.each((index) => {
          if ($(academicQualification[index]).val() !== null) {
            const qualification = {
              academicQualification: $(academicQualification[index]).val(),
              degree: $(degrees[index]).val(),
              experience: $(experience[index]).val(),
              licenseIndustry: $(licenseIndustry[index]).val(),
            };
            qualifications.push(qualification);
          }
        });

        const { data, status } = await axios.post(
          "/api/faculty",
          {
            firstName: firstName.val().toLowerCase(),
            middleName: middleName.val().toLowerCase(),
            lastName: lastName.val().toLowerCase(),
            facultyCode: facultyCode.val().toLowerCase(),
            facultyType: facultyType.val(),
            email: email.val(),
            academicQualifications: qualifications,
          },
          { headers: { "csrf-token": csrf } }
        );

        tableData(table.row.add, data.faculty);
        firstName.val("");
        middleName.val("");
        lastName.val("");
        facultyCode.val("");
        email.val("");
        facultyType.val("");
        addModal.hide();
        displayToast({ data, status });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            event.currentTarget
          );
          displayToast(error.response);
        }
      } finally {
        submit.html("Submit");
        buttons.removeClass("disabled");
      }
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

$(editModal._element).on("show.bs.modal", async (event) => {
  let experience, degrees, licenseIndustry, academicQualification;
  const firstName = $(event.currentTarget).find("#firstName");
  const middleName = $(event.currentTarget).find("#middleName");
  const lastName = $(event.currentTarget).find("#lastName");
  const facultyCode = $(event.currentTarget).find("#facultyCode");
  const email = $(event.currentTarget).find("#email");
  const facultyType = $(event.currentTarget).find("#facultyType");
  facultyType.empty()
  const removeAcademicQualification = $(event.currentTarget).find(
    "#removeAcademicQualification"
  );
  const newAcademicQualification = $(event.currentTarget).find(
    "#newAcademicQualification"
  );
  const submit = $(event.currentTarget).find("#editButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  const card = $(event.currentTarget).find("#qaCard");
  const id = $(event.relatedTarget).attr("data-bs-id");

  removeAcademicQualification.off("click");
  newAcademicQualification.off("click");
  try {
    const { data: facultyTypeData } = await axios.get(`/api/faculty-types`);
    const { data: academicQualificationData } = await axios.get(
      `/api/academic-qualifications`
    );
    const { data: existingFaculty } = await axios.get(`/api/faculty/${id}`);
    const { faculty } = existingFaculty;
    facultyTypeData.facultyType.forEach((element) => {
      facultyType.append(
        new Option(element.facultyType.toUpperCase(), element._id)
      );
    });

    firstName.val(faculty.userInformation.firstName);
    middleName.val(faculty.userInformation.middleName);
    lastName.val(faculty.userInformation.lastName);
    facultyCode.val(faculty.facultyInformation.facultyCode);
    email.val(faculty.email);
    facultyType.val(faculty.facultyInformation.facultyType._id);

    card.empty();
    faculty.facultyInformation.academicQualifications.forEach((element) => {
      existingAcademicQualification(
        card,
        academicQualificationData.aq,
        element
      );
    });

    academicQualification = $(event.currentTarget).find(
      ".academic-qualification"
    );
    experience = $(event.currentTarget).find(".experience");
    degrees = $(event.currentTarget).find(".degree");
    licenseIndustry = $(event.currentTarget).find(".license-industry");
    if (academicQualification.length === 1) {
      $(event.currentTarget).addClass("disabled");
    }
    removeAcademicQualification.on("click", (button) => {
      card.children().last().remove();
      academicQualification = $(event.currentTarget).find(
        ".academic-qualification"
      );
      academicQualification = $(event.currentTarget).find(
        ".academic-qualification"
      );
      experience = $(event.currentTarget).find(".experience");
      degrees = $(event.currentTarget).find(".degree");
      licenseIndustry = $(event.currentTarget).find(".license-industry");
      if (academicQualification.length === 1) {
        $(button.currentTarget).addClass("disabled");
      }
    });
    newAcademicQualification.on("click", () => {
      makeNewAcademicQualification(card, academicQualificationData.aq);
      academicQualification = $(event.currentTarget).find(
        ".academic-qualification"
      );
      academicQualification = $(event.currentTarget).find(
        ".academic-qualification"
      );
      experience = $(event.currentTarget).find(".experience");
      degrees = $(event.currentTarget).find(".degree");
      licenseIndustry = $(event.currentTarget).find(".license-industry");
      if (academicQualification.length !== 1) {
        removeAcademicQualification.removeClass("disabled");
      }
    });

    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        removeValidationError([
          firstName,
          middleName,
          lastName,
          facultyCode,
          facultyType,
          email,
        ]);
        const qualifications = [];
        academicQualification.each((index) => {
          if ($(academicQualification[index]).val() !== null) {
            const qualification = {
              academicQualification: $(academicQualification[index]).val(),
              degree: $(degrees[index]).val(),
              experience: $(experience[index]).val(),
              licenseIndustry: $(licenseIndustry[index]).val(),
            };
            qualifications.push(qualification);
          }
        });
        const { data, status } = await axios.put(
          `/api/faculty/${id}`,
          {
            firstName: firstName.val().toLowerCase(),
            middleName: middleName.val().toLowerCase(),
            lastName: lastName.val().toLowerCase(),
            facultyCode: facultyCode.val().toLowerCase(),
            facultyType: facultyType.val(),
            email: email.val(),
            academicQualifications: qualifications,
          },
          { headers: { "csrf-token": csrf } }
        );
        console.log(data);
        console.log(status);
        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.faculty
        );
        editModal.hide();
        displayToast({ status, data });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            event.currentTarget
          );
        }
        displayToast(error.response);
      } finally {
        submit.html("Submit");
        buttons.not(removeAcademicQualification).removeClass("disabled");
      }
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

$(addCourseModal._element).on("show.bs.modal", (event) => {
  const course = $(event.currentTarget).find("#course").select2({
    multiple: true,
    width: "100%",
  });
  const id = $(event.relatedTarget).attr("data-bs-id");
  const button = $(event.currentTarget).find("#addCourse");
  button.off("click");
  fetch("/api/courses")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      course.empty("").trigger("change");
      console.log(result);
      result.data.forEach((element) => {
        course
          .append(
            new Option(
              element.courseCode.toUpperCase() +
                " - " +
                element.courseDescription.toUpperCase(),
              element._id
            )
          )
          .trigger("change");
      });
      return fetch("/api/faculty/" + id);
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      course
        .val(
          result.data.userInformation.courseTaken.map((element) => {
            return element._id;
          })
        )
        .trigger("change");
      button.on("click", () => {
        fetch("/api/faculty/course/" + id, {
          method: "POST",
          headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courses: course.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            addCourseModal.hide();
            dataTable(
              table.row($(event.relatedTarget).closest("tr")).data,
              result.data
            );
            return displayToast(result);
          })
          .catch((error) => {
            console.log(error);
            return displayToast(result);
          });
      });
    })
    .catch((error) => {
      console.log(error);
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
    loading();
    fetch("/api/faculty/upload", {
      method: "POST",
      headers: { "csrf-token": csrf },
      body: body,
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.errors) {
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        uploadModal.hide();
        table.rows().remove().draw();
        result.data.forEach((element) => {
          dataTable(table.row.add, element);
        });
        return displayToast(result);
      });
  });
});

const sendPassword = (id) => {
  loading();
  fetch(`/api/faculty/send-password/${id}`, {
    method: "POST",
    headers: { "csrf-token": csrf, "Content-Type": "application/json" },
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      displayToast(result);
    })
    .catch((error) => {
      console.log(error);
      displayToast(error);
    });
};

const makeNewAcademicQualification = (card, academicQualificationList) => {
  const container = $("<div></div>");

  container.addClass("academic-qualification-form");

  const aqRow = $("<div></div>");
  aqRow.addClass("row mb-2");
  aqRow.append(
    $("<div></div>")
      .addClass("col-12 mb-3")
      .append(
        $("<label></label>")
          .addClass("col-form-label")
          .html("Academic Qualification")
      )
      .append(
        $("<select></select>")
          .addClass("form-select form-select-sm academic-qualification")
          .on("change", aqChangeHandler)
      )
      .append($("<div></div>").addClass("invalid-feedback"))
  );
  aqRow.find("select").empty();
  academicQualificationList.forEach((element) => {
    aqRow
      .find("select")
      .append(
        new Option(
          element.academicQualification.toUpperCase(),
          element.academicQualification
        )
      );
  });
  const numberRow = $("<div></div>");
  numberRow.addClass("row mb-2");
  numberRow
    .append(
      $("<div></div>")
        .addClass("col-md-6")
        .append(
          $("<label></label>")
            .attr({
              for: "experience",
              class: "form-label",
            })
            .html("Years of Experience:")
        )
        .append(
          $("<input>").attr({
            type: "number",
            class: "form-control form-control-sm experience",
            value: "0",
          })
        )
        .append($("<div></div<").addClass("invalid-feedback"))
    )
    .append(
      $("<div></div>")
        .addClass("col-md-6")
        .append(
          $("<label></labe>")
            .attr({
              for: "degree",
              class: "form-label small-font-size",
            })
            .html("Degree:")
        )
        .append(
          $("<select></select>")
            .attr({
              class: "form-select form-select-sm degree",
            })
            .append($("<option value='1'>Associate's Degree</option>"))
            .append($("<option value='2'>Bachelor's Degree</option>"))
            .append($("<option value='3'>Master's Degree</option>"))
            .append($("<option value='4'>Doctoral's Degree</option>"))
        )
        .append($("<div></div>").addClass("invalid-feedback"))
    );
  const licenseIndustryRow = $("<div></div>");
  licenseIndustryRow.addClass("row mb-2");
  licenseIndustryRow.append(
    $("<div></div>")
      .addClass("col-12 mb-3")
      .append(
        $("<label></label>")
          .attr({
            for: "licenseIndustry",
            class: "form-label",
          })
          .html("Professional License and Industry Qualification:")
      )
      .append(
        $("<select></select>").attr({
          class: "form-control license-industry",
          multiple: true,
        })
      )
  );
  container.append(aqRow);
  container.append(numberRow);
  container.append(licenseIndustryRow);
  container.append($("<hr>"));
  licenseIndustryRow.find(".license-industry").select2({
    multiple: true,
    width: "100%",
  });
  function aqChangeHandler(event) {
    value = $(event.currentTarget).val();
    const { licenseIndustry: li } = academicQualificationList.find(
      (e) => e.academicQualification === value
    );
    const licenseIndustry = $(licenseIndustryRow).find("select");
    licenseIndustry.empty();
    li.forEach((e) => {
      licenseIndustry.append(new Option(e, e));
    });
  }
  aqRow.find("select").trigger("change");
  card.append(container);
};

const existingAcademicQualification = (
  card,
  academicQualificationList,
  data
) => {
  const container = $("<div></div>");
  container.addClass("academic-qualification-form");

  const aqRow = $("<div></div>");
  aqRow.addClass("row mb-2");
  aqRow.append(
    $("<div></div>")
      .addClass("col-12 mb-3")
      .append(
        $("<label></label>")
          .addClass("col-form-label")
          .html("Academic Qualification")
      )
      .append(
        $("<select></select>")
          .addClass("form-select form-select-sm academic-qualification")
          .on("change", aqChangeHandler)
      )
      .append($("<div></div>").addClass("invalid-feedback"))
  );
  aqRow.find("select").empty();
  academicQualificationList.forEach((element) => {
    aqRow
      .find("select")
      .append(
        new Option(
          element.academicQualification.toUpperCase(),
          element.academicQualification
        )
      );
  });
  aqRow.find("select").val(data.academicQualification);
  const numberRow = $("<div></div>");
  numberRow.addClass("row mb-2");
  numberRow
    .append(
      $("<div></div>")
        .addClass("col-md-6")
        .append(
          $("<label></label>")
            .attr({
              for: "experience",
              class: "form-label",
            })
            .html("Years of Experience:")
        )
        .append(
          $("<input>")
            .attr({
              type: "number",
              class: "form-control form-control-sm experience",
              value: "0",
            })
            .val(data.experience)
        )
        .append($("<div></div<").addClass("invalid-feedback"))
    )
    .append(
      $("<div></div>")
        .addClass("col-md-6")
        .append(
          $("<label></labe>")
            .attr({
              for: "degree",
              class: "form-label small-font-size",
            })
            .html("Degree:")
        )
        .append(
          $("<select></select>")
            .attr({
              class: "form-select form-select-sm degree",
            })
            .append($("<option value='1'>Associate's Degree</option>"))
            .append($("<option value='2'>Bachelor's Degree</option>"))
            .append($("<option value='3'>Master's Degree</option>"))
            .append($("<option value='4'>Doctoral's Degree</option>"))
            .val(data.degree)
        )
        .append($("<div></div>").addClass("invalid-feedback"))
    );
  const licenseIndustryRow = $("<div></div>");
  licenseIndustryRow.addClass("row mb-2");
  licenseIndustryRow.append(
    $("<div></div>")
      .addClass("col-12 mb-3")
      .append(
        $("<label></label>")
          .attr({
            for: "licenseIndustry",
            class: "form-label",
          })
          .html("Professional License and Industry Qualification:")
      )
      .append(
        $("<select></select>").attr({
          class: "form-control license-industry",
          multiple: true,
        })
      )
  );
  container.append(aqRow);
  container.append(numberRow);
  container.append(licenseIndustryRow);
  container.append($("<hr>"));
  licenseIndustryRow.find(".license-industry").select2({
    multiple: true,
    width: "100%",
  });
  function aqChangeHandler(event) {
    value = $(event.currentTarget).val();
    const { licenseIndustry: li } = academicQualificationList.find(
      (e) => e.academicQualification === value
    );
    const licenseIndustry = $(licenseIndustryRow).find("select");
    licenseIndustry.empty();
    li.forEach((e) => {
      licenseIndustry.append(new Option(e, e));
    });
    licenseIndustry.val(data.licenseIndustry);
  }
  aqRow.find("select").trigger("change");
  card.append(container);
};

// $("#addCourseButton").on("click", () => {
//   fetch("/api/faculty/course/" + facultyId, {
//     method: "POST",
//     headers: {
//       "csrf-token": csrf,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       courses: course.val(),
//     }),
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .then((result) => {
//       if (!result) {
//         return;
//       }
//       console.log(result);
//       addCourseModal.hide();
//       return Toast.fire({
//         title: "Successfully Added",
//         icon: "success",
//       });
//     })
//     .catch((error) => {
//       Toast.fire({
//         title: "Something went wrong!",
//         icon: "warning",
//       });
//       console.log(error);
//     });
// });

// addModalElement.on("show.bs.modal", () => {
//   fetch("/api/academic-qualifications")
//     .then((response) => {
//       return response.json();
//     })
//     .then((result) => {
//       if (newAcademicQualification) newAcademicQualification.off("click");
//       if (academicQualification) academicQualification.off("change");
//       firstName = $("#addForm #first-name");
//       middleName = $("#addForm #middle-name");
//       lastName = $("#addForm #last-name");
//       facultyCode = $("#addForm #faculty-code");
//       email = $("#addForm #email");
//       facultyType = $("#addForm #faculty-type");
//       schedulePreference = $("#addForm #schedule-preference").select2({
//         width: "100%",
//         multiple: true,
//       });
//       newAcademicQualification = $("#addModal #add#newAcademicQualification");

//       // academicQualification.empty().trigger("change");
//       academicQualification = $("#addForm .academic-qualification");
//       experience = $("#addForm .experience");
//       degrees = $("#addForm .degree");
//       $("#addForm .license-industry").select2({
//         multiple: true,
//         width: "100%",
//         tags: true,
//       });
//       licenseIndustry = $("#addForm .license-industry");
//       result.data.forEach((element) => {
//         $(".academic-qualification")
//           .append(
//             new Option(element.academicQualification.toUpperCase(), element._id)
//           )
//           .trigger("change");
//       });
//       newAcademicQualification.on("click", () => {
//         alert("test");
//         academicQualification.off("change");
//         const form = $("#academicQualificationForm").clone();
//         const label = $("<label></label>");
//         const select = $("<select></select>");
//         const col = $("<div></div>");
//         col.addClass("col-12");
//         select.attr({
//           multiple: true,
//         });
//         select.addClass("form-control license-industry");
//         label.addClass("form-label");
//         label.attr("for", "licenseIndustry");
//         col.append(label).append(select);
//         form.children().eq(2).empty().append(col);
//         form
//           .children()
//           .eq(2)
//           .children()
//           .eq(0)
//           .find(".license-industry")
//           .attr({
//             disabled: true,
//           })
//           .select2({
//             multiple: true,
//             tags: true,
//             width: "100%",
//           });
//         form.find("select, input").not("#academicQualification").attr({
//           disabled: true,
//         });
//         form.insertAfter($("#academicQualificationForm"));
//         academicQualification = $("#addForm .academic-qualification");
//         experience = $("#addForm .experience");
//         degrees = $("#addForm .degree");
//         licenseIndustry = $("#addForm .license-industry");

//         academicQualification.on("change", (event) => {
//           fetch("/api/academic-qualifications/" + $(event.currentTarget).val())
//             .then((response) => {
//               return response.json();
//             })
//             .then((result) => {
//               $(event.currentTarget)
//                 .closest("#academicQualificationForm")
//                 .children()
//                 .eq(2)
//                 .find(".license-industry")
//                 .empty();
//               result.data.licenseIndustry.forEach((element) => {
//                 $(event.currentTarget)
//                   .closest("#academicQualificationForm")
//                   .children()
//                   .eq(2)
//                   .find(".license-industry")
//                   .append(new Option(element.tag, element._id))
//                   .trigger("change");
//               });
//               $(event.currentTarget)
//                 .closest("#academicQualificationForm")
//                 .find("select, input")
//                 .attr({
//                   disabled: false,
//                 });
//             });
//         });
//       });
//       academicQualification.on("change", (event) => {
//         fetch("/api/academic-qualifications/" + $(event.currentTarget).val())
//           .then((response) => {
//             return response.json();
//           })
//           .then((result) => {
//             $(event.currentTarget)
//               .closest("#academicQualificationForm")
//               .children()
//               .eq(2)
//               .find(".license-industry")
//               .empty();
//             result.data.licenseIndustry.forEach((element) => {
//               $(event.currentTarget)
//                 .closest("#academicQualificationForm")
//                 .children()
//                 .eq(2)
//                 .find(".license-industry")
//                 .append(new Option(element.tag, element._id))
//                 .trigger("change");
//             });
//             $(event.currentTarget)
//               .closest("#academicQualificationForm")
//               .find("select, input")
//               .attr({
//                 disabled: false,
//               });
//           });
//       });
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// });

// $("#add-button").on("click", () => {
//   const qualifications = [];
//   academicQualification.each((index) => {
//     if ($(academicQualification[index]).val().val !== "") {
//       const qualification = {
//         academicQualification: $(academicQualification[index]).val(),
//         degree: $(degrees[index]).val(),
//         experience: $(experience[index]).val(),
//         licenseIndustry: $(licenseIndustry[index]).val(),
//       };

//       qualifications.push(qualification);
//     }
//   });

//   // firstName.removeClass("is-invalid");
//   // middleName.removeClass("is-invalid");
//   // lastName.removeClass("is-invalid");
//   // facultyCode.removeClass("is-invalid");
//   // email.removeClass("is-invalid");
//   // facultyType.removeClass("is-invalid");
//   fetch("/api/faculty", {
//     method: "POST",
//     headers: {
//       "csrf-token": csrf,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       first_name: firstName.val(),
//       middle_name: middleName.val(),
//       last_name: lastName.val(),
//       faculty_code: facultyCode.val(),
//       faculty_type: facultyType.val(),
//       email: email.val(),
//       schedulePreference: schedulePreference.val(),
//       academicQualifications: qualifications,
//     }),
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .then((result) => {
//       if (!result.ok) {
//         if (result.errors) {
//           firstName
//             .addClass(result.errors.first_name ? "is-invalid" : "")
//             .siblings("div .invalid-feedback")
//             .html(result.errors.first_name ? result.errors.first_name.msg : "");
//           middleName
//             .addClass(result.errors.middle_name ? "is-invalid" : "")
//             .siblings("div .invalid-feedback")
//             .html(
//               result.errors.middle_name ? result.errors.middle_name.msg : ""
//             );
//           lastName
//             .addClass(result.errors.last_name ? "is-invalid" : "")
//             .siblings("div .invalid-feedback")
//             .html(result.errors.last_name ? result.errors.last_name.msg : "");
//           facultyCode
//             .addClass(result.errors.faculty_code ? "is-invalid" : "")
//             .siblings("div .invalid-feedback")
//             .html(
//               result.errors.faculty_code ? result.errors.faculty_code.msg : ""
//             );
//           email
//             .addClass(result.errors.email ? "is-invalid" : "")
//             .siblings("div .invalid-feedback")
//             .html(result.errors.email ? result.errors.email.msg : "");
//           facultyType
//             .addClass(result.errors.faculty_type ? "is-invalid" : "")
//             .siblings("div .invalid-feedback")
//             .html(
//               result.errors.faculty_type ? result.errors.faculty_type.msg : ""
//             );
//         }
//         return Toast.fire({ icon: "warning", title: "Something went wrong" });
//       }
//       addModal.hide();
//       firstName.removeClass("is-invalid").val("");
//       middleName.removeClass("is-invalid").val("");
//       lastName.removeClass("is-invalid").val("");
//       facultyCode.removeClass("is-invalid").val("");
//       email.removeClass("is-invalid").val("");
//       facultyType.removeClass("is-invalid").val("");

//       facultyTable.row
//         .add([
//           element.userInformation.faculty_code.toUpperCase(),
//           element.userInformation.first_name.toUpperCase() +
//             " " +
//             element.userInformation.middle_name.toUpperCase() +
//             " " +
//             element.userInformation.last_name.toUpperCase(),
//           element.userInformation.faculty_type.toUpperCase(),
//           element.email,
//           element.userInformation.academicQualifications.length !== 0
//             ? element.userInformation.academicQualifications
//                 .map((element) => {
//                   console.log(element);
//                   return `
//               <div>
//                 <h6>${element.academicQualification.academicQualification}</h6>
//                 <ul>
//                   <li>${element.experience} year/s of experience.</li>
//                   <li>${degreeEquivalent[element.degree - 1]}</li>
//                   ${element.licenseIndustry
//                     .map((element) => {
//                       return "<li>" + element.tag.toUpperCase() + "</li>";
//                     })
//                     .join("")}
//                 </ul>
//               </div>`;
//                 })
//                 .join("")
//             : "N/A",
//           element.userInformation.courseTaken.length !== 0
//             ? element.userInformation.courseTaken
//                 .map((element) => {
//                   return element.course_code;
//                 })
//                 .join(", ")
//             : "N/A",
//           `
//             <a class="btn btn-secondary btn-sm mb-1" href="/admin/faculty/${element._id}" target="_blank">View</a>
//             <button class="btn btn-sm btn-secondary mb-1" data-bs-toggle="modal" data-bs-target="#addCourseModal" data-bs-id="${element._id}">Edit Course</button>
//             <button class="btn btn-sm btn-secondary mb-1" data-bs-toggle="modal" data-bs-target="#addAQModal" data-bs-id="${element._id}">Edit AQ</button>
//             <button class="btn text-light btn-sm btn-danger mb-1" onClick="deleteData('${element._id}', this)">Delete</button>
//           `,
//         ])
//         .draw();
//       Toast.fire({ icon: "success", title: "Successfuly added new faculty" });
//     })
//     .catch((error) => {
//       console.log(error);
//       Toast.fire({ icon: "warning", title: "Something went wrong" });
//     });
// });

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
      return fetch("/api/faculty/" + id, {
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
  }).then((result) => {
    if (result.isConfirmed) {
      table.row(element.closest("tr")).remove().draw();
      displayToast(result.value);
    }
  });
};
