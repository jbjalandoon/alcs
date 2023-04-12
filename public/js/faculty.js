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
        console.log(data);
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
  facultyType.empty();
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

$(addCourseModal._element).on("show.bs.modal", async (event) => {
  const course = $(event.currentTarget).find("#course").select2({
    multiple: true,
    width: "100%",
  });
  course.empty();
  const id = $(event.relatedTarget).attr("data-bs-id");
  const submit = $(event.currentTarget).find("#addCourse");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  form.off("submit");
  try {
    const { data: courseData } = await axios.get(`/api/courses`);
    const { data: existingFacultyData } = await axios.get(`/api/faculty/${id}`);
    courseData.course.forEach((e) => {
      course
        .append(
          new Option(
            e.courseCode.toUpperCase() +
              " - " +
              e.courseDescription.toUpperCase(),
            e._id
          )
        )
        .trigger("change");
    });

    const { facultyInformation } = existingFacultyData.faculty;
    course.val(facultyInformation.courseTaken);

    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        submit.html("Submitting...");
        buttons.removeClass("disabled");
        const { data, status } = await axios.post(
          `/api/faculty/course/${id}`,
          { courses: course.val() },
          { headers: { "csrf-token": csrf } }
        );

        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.faculty
        );
        addCourseModal.hide();
        displayToast({ data, status });
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
        buttons.removeClass("disabled");
      }
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
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

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();

  try {
    if (isConfirmed) {
      const { data, status } = await axios.delete(`/api/faculty/${id}`, {
        headers: { "csrf-token": csrf },
      });
      table.row(element.closest("tr")).remove().draw();
      displayToast({ data, status });
    }
  } catch (error) {
    displayToast(error.response);
  }
};
