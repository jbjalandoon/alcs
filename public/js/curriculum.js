let schoolYear, semester;
const programs = [];
const csrf = $("#csrf").val();

const viewProgram = $("#viewProgram");
let viewSemesterValue, viewProgramValue;
const addSemester = $("#add-semester");

const yearLevel = $("#year-level");
const section = $("#section").select2({ tags: true, width: "100%" });
const course = $("#course");
const assignScheduleButton = document.querySelector("#assign-schedule");

let programYear;

const copyModal = new bootstrap.Modal($("#copyModal"));

const addNewCourseModal = new bootstrap.Modal($("#addNewCourseModal"));
const addNewSectionModal = new bootstrap.Modal($("#addNewSectionModal"));

(async () => {
  const activeSemester = await getActiveSemester();

  if (semester === null) {
    $("#copyModalButton").addClass("disabled");
    $("#addProgramModalButton").addClass("disabled");
    Toast.fire({
      icon: "warning",
      title: "There is no current active semester",
    });
  } else {
    semester = activeSemester.id;
    $("#card-title").html(`S.Y. ${activeSemester.year.toUpperCase()} (${activeSemester.sem.toUpperCase()} SEMESTER)`);
  }

  getPrograms(semester);
  addProgram(semester);
  addCourse();
  addSection();
  copyCurriculum();
  addYearLevel();
})();

const getPrograms = async (semester) => {
  try {
    const request = await fetch(`/api/curriculums/programs/${semester}`);
    const response = await request.json();

    if (response.data.length === 0) {
      viewProgram.attr("disabled", true);
      return;
    }
    viewProgram.attr("disabled", false);
    response.data.forEach((element) => {
      viewProgram.append(new Option(element.program.programCode.toUpperCase(), element._id));
      programs.push(element.program.programCode.toUpperCase());
    });
    viewProgram.on("change", async () => {
      try {
        const request = await fetch(`/api/curriculums/programs/${semester}/${viewProgram.val()}`);
        const response = await request.json();
        $("#yearList").removeClass("d-none");
        $("#nav-year #v-pills-tab").empty();
        $("#nav-year #v-pills-tabContent").empty();
        response.data.forEach((element, index) => {
          const navButton = $("<button></button>");
          navButton.addClass(`nav-link ${index === 0 ? "active" : ""}`);
          navButton.attr("id", `v-pills-${element._id}-tab`);
          navButton.attr("data-bs-toggle", "pill");
          navButton.attr("data-bs-target", `#v-pills-${element._id}`);
          navButton.attr("role", "tab");
          navButton.attr("aria-controls", `v-pills-${element._id}`);
          navButton.attr("aria-select", true);
          navButton.html(`${element.year.yearLevel.toUpperCase()}`);
          $("#nav-year #v-pills-tab").append(navButton);

          const content = $("<div></div>");
          content.addClass(`tab-pane fade show ${index === 0 ? "active" : ""}`);
          content.attr("id", `v-pills-${element._id}`);
          content.attr("role", `tabpanel`);
          content.attr("aria-labelledby", `v-pills-${element._id}-tab`);
          content.attr("tabindex", 0);

          const container = $("<div></div>");
          container.addClass("container");
          const actionRow = $("<div></div>");

          const addNewSectionButton = $("<button></button>");
          addNewSectionButton.addClass("btn btn-sm btn-primary me-1 mb-3");
          addNewSectionButton.attr("data-bs-toggle", "modal");
          addNewSectionButton.attr("data-bs-target", "#addNewSectionModal");
          addNewSectionButton.attr("level", `${element._id}`);
          addNewSectionButton.html("Add Sections");

          const addNewCourseButton = $("<button></button>");
          addNewCourseButton.addClass("btn btn-sm btn-primary me-1 mb-3");
          addNewCourseButton.attr("data-bs-toggle", "modal");
          addNewCourseButton.attr("data-bs-target", "#addNewCourseModal");
          addNewCourseButton.attr("level", `${element._id}`);
          addNewCourseButton.html("Add Course");

          const removeYearLevel = $("<button></button>");
          removeYearLevel.addClass("btn btn-sm btn-danger mb-3");
          removeYearLevel.attr("id", element._id);
          removeYearLevel.on("click", deleteYearLevel);
          removeYearLevel.html("Remove Year Level");

          const sectionsList = $("<span></span>");
          sectionsList.attr("id", `section${element._id}`);

          actionRow.addClass("row");
          actionRow
            .append($("<div></div>").addClass("col-12 mb-3").html("List of Section: ").append(sectionsList))
            .append(
              $("<div></div>")
                .addClass("col-12")
                .append(
                  $("<div></div>")
                    .addClass("float-end")
                    .append(addNewSectionButton)
                    .append(addNewCourseButton)
                    .append(removeYearLevel)
                )
            );

          const tableRow = $("<div></div>");
          tableRow.addClass("row");
          const table = $("<table></table>");
          table.addClass("table");
          table.attr("id", `table${element._id}`);
          table
            .append(
              $("<thead></thead>")
                .append($("<th></th>").html("Course Code"))
                .append($("<th></th>").html("Course Description"))
                .append($("<th></th>").html("Course Lab"))
                .append($("<th></th>").html("Course Lecture"))
                .append($("<th></th>").html("Course Units"))
                .append($("<th></th>").html("Actions"))
            )
            .append($("<tbody></tbody>"));

          tableRow.append($("<div></div>").addClass("table-responsive").append(table));
          content.append(actionRow);
          content.append(tableRow);

          $("#nav-year #v-pills-tabContent").append(content);
          element.sections.section.forEach((section, index) => {
            const span = $("<span></span>");
            span.addClass("badge text-bg-primary me-1");
            span.html(`${section} | `);

            const button = $("<button></button>");
            button.addClass("btn-close text-light");
            button.attr("id", element.sections._id[index]);
            button.on("click", deleteSection);
            span.append(button);

            $(sectionsList).append(span);
          });

          if (element.course.length == 0) {
            table
              .find("tbody")
              .append(
                `<tr><td colspan="6" class="text-center empty">There are no courses in this year level</td></tr>`
              );
            return;
          }
          element.course.forEach((course) => {
            table.find("tbody").append(
              $("<tr></tr>")
                .append($("<td></td>").html(`${course.courseCode.toUpperCase()}`))
                .append($("<td></td>").html(`${course.courseDescription.toUpperCase()}`))
                .append($("<td></td>").html(`${course.lab}`))
                .append($("<td></td>").html(`${course.lecture}`))
                .append($("<td></td>").html(`${course.units}`))
                .append(
                  $("<td></td>").append(
                    $("<button></button>")
                      .addClass("btn btn-sm btn-danger text-light")
                      .attr("year", element._id)
                      .attr("course", course._id)
                      .html("Delete")
                      .on("click", deleteCourse)
                  )
                )
            );
          });
        });

        $("#year-loading").addClass("d-none");
        $("#nav-year").removeClass("d-none");

        const removeButton = $("<button></button>");
        removeButton.addClass("btn btn-sm btn-danger me-1");
        removeButton.html("Remove This Program");
        removeButton.on("click", deleteProgram);

        const addYearLevel = $("<button></button>");
        addYearLevel.addClass("btn btn-sm btn-primary me-1");
        addYearLevel.html("Add Year Level");
        addYearLevel.attr("data-bs-toggle", "modal");
        addYearLevel.attr("data-bs-target", "#addYearLevelModal");
        addYearLevel.attr("data-bs-id", viewProgram.val());

        $("#removeProgramColumn").empty();
        $("#removeProgramColumn").append(addYearLevel);
        $("#removeProgramColumn").append(removeButton);
      } catch (error) {
        console.error(error);
      }
    });
    viewProgram.trigger("change");
  } catch (error) {
    console.error(error);
  }
};

const addProgram = (semester) => {
  const addProgramModal = new bootstrap.Modal($("#addProgramModal"));
  $(addProgramModal._element).on("show.bs.modal", async (event) => {
    try {
      const programsRequest = await fetch(`/api/programs`);
      const programsResponse = await programsRequest.json();
      const addProgram = $(event.currentTarget).find("#programs").select2({ multiple: true, width: "100%" });
      const button = $(event.currentTarget).find("#addProgramsButton");
      removeValidationError([addProgram]);
      button.off("click");
      const filteredData = programsResponse.data.filter((element) => {
        return !programs.includes(element.programCode.toUpperCase());
      });
      addProgram.val("");
      addProgram.empty();
      filteredData.forEach((element) => {
        addProgram.append(new Option(element.programName.toUpperCase(), element._id));
      });
      button.on("click", async () => {
        try {
          const postProgramRequest = await fetch(`/api/curriculums/programs/${semester}`, {
            method: "POST",
            headers: {
              "csrf-token": csrf,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              programs: addProgram.val(),
            }),
          });
          const postProgramResponse = await postProgramRequest.json();

          if (postProgramResponse.errors) {
            return displayValidationError(postProgramResponse.errors, event.currentTarget);
          }

          const programsRequest = await fetch(`/api/curriculums/programs/${semester}`);
          const programsResponse = await programsRequest.json();
          viewProgram.empty();
          programsResponse.data.forEach((element) => {
            viewProgram.append(new Option(element.program.programCode.toUpperCase(), element._id));
          });
          viewProgram.trigger("change");
          addProgramModal.hide();
          return displayToast(postProgramResponse);
        } catch (error) {
          console.error(error);
          displayToast(error);
        }
      });
    } catch (error) {}
  });
};

const deleteProgram = async (event) => {
  try {
    const alert = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      preConfirm: () => {
        return fetch("/api/curriculums/programs/" + semester + "/" + viewProgram.val(), {
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
    });

    if (!alert.isConfirmed) {
      return;
    }

    const deleteProgramRequest = await fetch(`/api/curriculums/programs/${semester}/${viewProgram.val()}`, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    });

    const deleteProgramResponse = await deleteProgramRequest.json();
    if (deleteProgramResponse.error) {
      Toast.fire({
        icon: "Warning",
        title: "Something Went Wrong",
      });
      return;
    }

    programs.splice(
      programs.findIndex((element) => element === viewProgram.find(":selected").text()),
      1
    );
    viewProgram.find(":selected").remove();
    viewProgram.trigger("change");
    Toast.fire({
      icon: "success",
      title: "Successfully Deleted",
    });
  } catch (error) {
    console.error(error);
  }
};

const addCourse = () => {
  $(addNewCourseModal._element).on("show.bs.modal", async (event) => {
    try {
      const courses = $("#courses").select2({
        width: "100%",
        multiple: true,
      });
      courses.empty();
      const button = $(event.currentTarget).find("#addCourseButton");
      button.off("click");
      const year = $(event.relatedTarget).attr("level");

      const currentCourseRequest = await fetch(`/api/curriculums/course/${year}`);
      const currentCourseResponse = await currentCourseRequest.json();

      const coursesRequest = await fetch(`/api/courses`);
      const coursesResponse = await coursesRequest.json();

      if (coursesResponse.data.length === 0) {
        Toast.fire({
          icon: "Warning",
          title: "No Courses Found",
        });
        button.addClass("disabled");
        return;
      }
      currentCourseResponse.data.forEach((currentCourse) => {
        coursesResponse.data.splice(
          coursesResponse.data.findIndex((element) => element.courseCode === currentCourse.course.courseCode),
          1
        );
      });

      coursesResponse.data.forEach((element) => {
        courses.append(
          new Option(element.courseCode.toUpperCase() + " - " + element.courseDescription.toUpperCase(), element._id)
        );
      });
      button.on("click", async () => {
        try {
          const addCourseRequest = await fetch("/api/curriculums/course/" + year, {
            method: "POST",
            headers: { "csrf-token": csrf, "Content-Type": "application/json" },
            body: JSON.stringify({
              courses: courses.val(),
            }),
          });

          const addCourseResponse = await addCourseRequest.json();
          if (addCourseResponse.errors) {
            displayValidationError(result.errors, event.currentTarget);
            return displayToast(result);
          }
          const table = $(`#table${year}`);
          addNewCourseModal.hide();
          if (table.children("tbody").find(".empty").length !== 0) {
            table.children("tbody").find(".empty").remove();
          }
          addCourseResponse.data.forEach((element) => {
            const tr = $("<tr></tr>");
            tr.append($("<td></td>").html(element.courseCode.toUpperCase()))
              .append($("<td></td>").html(element.courseDescription.toUpperCase()))
              .append($("<td></td>").html(element.lab))
              .append($("<td></td>").html(element.lecture))
              .append($("<td></td>").html(element.units))
              .append(
                $("<td></td>").append(
                  $("<button></button>")
                    .addClass("btn btn-sm btn-danger text-light")
                    .attr("year", year)
                    .attr("course", element._id)
                    .html("Delete")
                    .on("click", deleteCourse)
                )
              );
            table.children("tbody").append(tr);
          });
          displayToast(addCourseResponse);
        } catch (error) {
          console.error(error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  });
};

const addSection = () => {
  $(addNewSectionModal._element).on("show.bs.modal", (event) => {
    const sections = $(event.currentTarget).find("#sections").select2({ tags: true, width: "100%", multiple: true });
    sections.val("").trigger("change");
    const year = $(event.relatedTarget).attr("level");
    const button = $(event.currentTarget).find("#addSectionButton");
    button.off("click");
    removeValidationError([sections]);
    button.on("click", async () => {
      try {
        const sectionRequest = await fetch(`/api/curriculums/sections/${year}`, {
          method: "POST",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            sections: sections.val(),
          }),
        });
        const sectionResponse = await sectionRequest.json();

        if (sectionResponse.errors) {
          displayValidationError(sectionResponse.errors, event.currentTarget);
          return displayToast(sectionResponse);
        }

        viewProgram.trigger("change");

        addNewSectionModal.hide();
        displayToast(sectionResponse);
      } catch (error) {
        console.error(error);
      }
    });
  });
};

const deleteSection = async (event) => {
  const section = $(event.currentTarget).attr("id");
  try {
    const alert = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!!!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!alert.isConfirmed) {
      return;
    }

    const deleteSectionRequest = await fetch(`/api/curriculums/sections/${section}`, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    });

    const deleteSectionResponse = await deleteSectionRequest.json();
    if (deleteSectionResponse.error) {
      Toast.fire({
        icon: "Warning",
        title: "Something Went Wrong",
      });
      return;
    }

    $(event.currentTarget).parent().remove();
    Toast.fire({
      icon: "success",
      title: "Successfully Deleted",
    });
  } catch (error) {
    console.error(error);
  }
};

const deleteCourse = async (event) => {
  try {
    const year = $(event.currentTarget).attr("year");
    const course = $(event.currentTarget).attr("course");
    const alert = await Swal.fire({
      title: "Are you sure?",
      text: "Existing schedules will be deleted, You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (alert.isConfirmed) {
      await fetch(`/api/curriculums/course/${year}/${course}`, {
        method: "DELETE",
        headers: {
          "csrf-token": csrf,
          "Content-Type": "application/json",
        },
      });
      $(event.currentTarget).closest("tr").remove();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const copyCurriculum = () => {
  $(copyModal._element).on("show.bs.modal", async (event) => {
    try {
      let copyYear, copySem;

      if (copyYear) copyYear.off("change");
      if (copySem) copySem.off("change");
      copyYear = $("#year");
      copySem = $("#semester");
      copyYear.empty();
      copySem.empty();
      copySem.attr("disabled", true);

      const schoolYearRequest = await fetch(`/api/curriculums/school-year`);
      const schoolYearResponse = await schoolYearRequest.json();
      if (schoolYearResponse.data.length === 0) {
        Toast.fire({
          icon: "warning",
          title: "No School Year Found",
        });
        return;
      }
      schoolYearResponse.data.forEach((element) => {
        copyYear.append(new Option(element.schoolYear, element._id));
      });

      copyYear.on("change", async () => {
        try {
          const semesterRequest = await fetch(`/api/curriculums/semesters/${copyYear.val()}`);
          const semesterResponse = await semesterRequest.json();

          if (semesterResponse.data.length === 0) {
            $("#copySubmit").addClass("disabled");
            Toast.fire({
              icon: "warning",
              title: "No Semester Found",
            });
            return;
          }
          copySem.empty();
          semesterResponse.data.forEach((element) => {
            copySem.append(new Option(element.sem.toUpperCase(), element._id));
          });
          copySem.removeAttr("disabled");
          copySem.on("change", () => {
            $("#copySubmit").removeClass("disabled");
          });
          copySem.trigger("change");
        } catch (error) {
          console.error(error);
        }
      });
      copyYear.trigger("change");
    } catch (error) {
      console.error(error);
    }
  });
};

const addYearLevel = () => {
  const addYearLevelModal = new bootstrap.Modal($("#addYearLevelModal"));
  $(addYearLevelModal._element).on("show.bs.modal", async (event) => {
    try {
      const yearLevel = $(event.currentTarget).find("#yearLevel");
      yearLevel.empty();
      const id = $(event.relatedTarget).attr("data-bs-id");
      const button = $(event.currentTarget).find("#addYearLevelButton");
      const yearLevelRequest = await fetch(`/api/levels`);
      const yearLevelResponse = await yearLevelRequest.json();
      const toRemove = [];
      button.removeClass("disabled");
      yearLevel.attr("disabled", false);
      button.off("click");
      $("#v-pills-tab")
        .children()
        .each((index, element) => {
          toRemove.push($(element).html());
        });

      const filteredYearLevel = yearLevelResponse.data.filter((el) => !toRemove.includes(el.yearLevel.toUpperCase()));

      if (filteredYearLevel.length === 0) {
        button.addClass("disabled");
        return yearLevel.attr("disabled", true);
      }

      filteredYearLevel.forEach((element, index) => {
        yearLevel.append(new Option(element.yearLevel.toUpperCase(), element._id));
      });

      button.on("click", async () => {
        const addYearLevelRequest = await fetch(`/api/curriculums/levels/${viewProgram.val()}`, {
          method: "POST",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            yearLevel: yearLevel.val(),
          }),
        });
        const addYearLevelResponse = await addYearLevelRequest.json();

        if (addYearLevelResponse.data.modifiedCount === 0) {
          return Toast.fire({ icon: "warning", title: "Something Went Wrong" });
        }
        addYearLevelModal.hide();
        viewProgram.trigger("change");
        return Toast.fire({
          icon: "success",
          title: "Successfully Added",
        });
      });
    } catch (error) {
      console.error(error);
    }
  });
};

const deleteYearLevel = async (event) => {
  const year = $(event.currentTarget).attr("id");
  const alert = await Swal.fire({
    title: "Are you sure?",
    text: "Existing schedules will be deleted, You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  });

  if (alert.isConfirmed) {
    await fetch(`/api/curriculums/levels/${viewProgram.val()}/${year}`, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
        "Content-Type": "application/json",
      },
    });
    Toast.fire({
      icon: "success",
      title: "Successfully Deleted",
    });
    viewProgram.trigger("change");
  }
};

$("#copySubmit").on("click", () => {
  if (semester === copySem.val()) {
    return Toast.fire({
      icon: "warning",
      title: "Active Semester and Selected Semester is same",
    });
  }
  fetch("/api/curriculums/semesters/copy/" + semester + "/" + copySem.val(), {
    method: "POST",
    headers: { "csrf-token": csrf, "Content-Type": "application/json" },
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result) {
        return;
      }
      copyModal.hide();
      window.location.reload();
      return Toast.fire({
        icon: "success",
        title: "successfully copied",
      });
    })
    .catch((error) => {
      console.log(error);
    });
});
