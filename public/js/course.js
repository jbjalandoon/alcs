const table = $("#courseTable").DataTable({});
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
    data.customTitle ? data.customTitle.toUpperCase() : "N/A",
    data.courseDescription.toUpperCase(),
    data.lecture ? data.lecture : "N/A",
    data.lab ? data.lab : "N/A",
    data.units,
    data.qualification.academicQualification.length !== 0
      ? data.qualification.academicQualification
          .map((element) => {
            return ("aq-" + element).toUpperCase();
          })
          .join(", ")
      : "N/A",
    data.qualification.experience,
    degrees[data.qualification.degree - 1].toUpperCase(),
    data.qualification.licenseIndustry.length === 0
      ? "N/A"
      : data.qualification.licenseIndustry
          .map((element) => {
            return element.toUpperCase();
          })
          .join(", "),
    data.examination.toString().toUpperCase(),
    actionButton(data._id),
  ]).draw();
};

const editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
const uploadModal = new bootstrap.Modal($("#uploadModal"));

(async () => {
  try {
    const { data } = await axios.get("/api/courses");

    data.course.forEach((element) => tableData(table.row.add, element));
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", async (event) => {
  $(event.currentTarget).find("#academicQualification").off("change");
  const courseCode = $(event.currentTarget).find("#courseCode");
  const customTitle = $(event.currentTarget).find("#customTitle");
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
  const buttons = $(event.currentTarget).find("buttons");
  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  try {
    academicQualification.empty();

    const { data } = await axios.get("/api/academic-qualifications");
    data.aq.forEach((e) =>
      academicQualification.append(
        new Option(
          e.academicQualification.toUpperCase(),
          e.academicQualification.toLowerCase()
        )
      )
    );

    academicQualification.on("change", () => {
      licenseIndustry.empty().trigger("change");
      const aqVal = academicQualification.val();
      aqVal.forEach((e) => {
        const index = data.aq.findIndex((aq) => aq.academicQualification === e);
        console.log(data.aq[index]);
        data.aq[index].licenseIndustry.forEach((e) =>
          licenseIndustry.append(new Option(e.toUpperCase(), e.toLowerCase()))
        );
      });
    });

    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        removeValidationError([
          courseCode,
          customTitle,
          courseDescription,
          lecture,
          lab,
          units,
          academicQualification,
          experience,
          degree,
          licenseIndustry,
          examination,
        ]);
        submit.html("Submitting...");
        buttons.addClass("disabled");
        const { data, status } = await axios.post(
          "/api/courses",
          {
            courseCode: courseCode.val().toLowerCase(),
            customTitle: customTitle.val().toLowerCase(),
            courseDescription: courseDescription.val().toLowerCase(),
            lecture: lecture.val(),
            lab: lab.val(),
            units: units.val(),
            academicQualification: academicQualification.val(),
            experience: experience.val(),
            degree: degree.val(),
            licenseIndustry: licenseIndustry.val(),
            examination: examination.is(":checked"),
          },
          { headers: { "csrf-token": csrf } }
        );

        tableData(table.row.add, data.course);
        courseCode.val("");
        customTitle.val("");
        courseDescription.val("");
        lecture.val("");
        lab.val("");
        units.val("");
        academicQualification.empty().trigger("change");
        experience.val("0");
        degree.val("2");
        licenseIndustry.empty().trigger("change");
        examination.prop("checked", false);
        addModal.hide();
        displayToast({ status, data });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            event.currentTarget
          );
          displayToast(response.error);
        }
      } finally {
        submit.html("Submit"), buttons.removeClass("disabled");
      }
    });
  } catch (error) {
    console.log(error);
    if (error.response.status === 500) {
      displayToast(error.response);
    }
  }
});

$(editModal._element).on("show.bs.modal", async (event) => {
  $(event.currentTarget).find("#academicQualification").off("change");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const courseCode = $(event.currentTarget).find("#courseCode");
  const customTitle = $(event.currentTarget).find("#customTitle");
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
  const submit = $(event.currentTarget).find("#editButton");
  const buttons = $(event.currentTarget).find("button");
  const form = $(event.currentTarget).find("form");
  try {
    const aqResponse = await axios.get("/api/academic-qualifications");
    const { aq } = aqResponse.data;
    aq.forEach((e) =>
      academicQualification.append(
        new Option(
          e.academicQualification.toUpperCase(),
          e.academicQualification
        )
      )
    );

    const { data } = await axios.get(`/api/courses/${id}`);
    const { course: existingData } = data;
    academicQualification.on("change", () => {
      licenseIndustry.empty().trigger("change");
      const aqVal = academicQualification.val();
      aqVal.forEach((e) => {
        const index = aq.findIndex((aq) => aq.academicQualification === e);
        console.log(aq[index]);
        aq[index].licenseIndustry.forEach((e) =>
          licenseIndustry.append(new Option(e.toUpperCase(), e.toLowerCase()))
        );
      });
    });
    courseCode.val(existingData.courseCode);
    courseDescription.val(existingData.courseDescription);
    lecture.val(existingData.lecture);
    lab.val(existingData.lab);
    customTitle.val(existingData.customTitle);
    units.val(existingData.units);
    academicQualification
      .val(existingData.qualification.academicQualification)
      .trigger("change");
    degree.val(existingData.qualification.degree);
    experience.val(existingData.qualification.experience);
    examination.prop("checked", existingData.examination);
    licenseIndustry.val(existingData.qualification.licenseIndustry);
    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        removeValidationError([
          courseCode,
          customTitle,
          courseDescription,
          lecture,
          lab,
          units,
          academicQualification,
          experience,
          degree,
          licenseIndustry,
          examination,
        ]);
        submit.html("Submitting...");
        buttons.addClass("disabled");

        const { data, status } = await axios.put(
          `/api/courses/${id}`,
          {
            courseCode: courseCode.val().toLowerCase(),
            customTitle: customTitle.val().toLowerCase(),
            courseDescription: courseDescription.val().toLowerCase(),
            lecture: lecture.val(),
            lab: lab.val(),
            units: units.val(),
            academicQualification: academicQualification.val(),
            experience: experience.val(),
            degree: degree.val(),
            licenseIndustry: licenseIndustry.val(),
            examination: examination.is(":checked"),
          },
          { headers: { "csrf-token": csrf } }
        );
        console.log(data.course);
        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.course
        );

        editModal.hide();
        displayToast({ data, status });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            enent.currentTarget
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
  const submit = $(event.currentTarget).find("#uploadButton");
  const buttons = $(event.currentTarget).find("button");
  const form = $(event.currentTarget).find("form");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      const file = $(event.currentTarget).find("#spreadsheet")[0].files[0];
      buttons.addClass("disabled");
      submit.html("Submit");
      const body = new FormData();
      body.append("spreadsheet", file);

      const { data, status } = await axios.post("/api/courses/upload", body, {
        headers: { "csrf-token": csrf },
      });

      const { data: courses } = await axios.get("/api/courses");

      table.clear().draw();
      courses.course.forEach((element) => tableData(table.row.add, element));

      uploadModal.hide();
      displayToast({ data, status });
    } catch (error) {
      if (error.response.status === 400) {
        displayValidationError(error.response.data.errors, event.currentTarget);
      }
      displayToast(error.response);
    } finally {
      submit.html("Uploading...");
      buttons.removeClass("disabled");
    }
  });
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();

  try {
    if (isConfirmed) {
      const { status, data } = await axios.delete(`/api/courses/${id}`, {
        headers: { "csrf-token": csrf },
      });

      table.row(element.closest("tr")).remove().draw();
      displayToast({ status, data });
    }
  } catch (error) {
    displayToast(error.response);
  }
};
