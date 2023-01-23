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

const addProgramModal = new bootstrap.Modal($("#addProgramModal"));
const copyModal = new bootstrap.Modal($("#copyModal"));

let copyYear, copySem;

// const addYearModal = new bootstrap.Modal($("#addYeaModal"));
const addNewCourseModal = new bootstrap.Modal($("#addNewCourseModal"));
const addNewSectionModal = new bootstrap.Modal($("#addNewSectionModal"));

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (result.data.length === 0) {
      $("#addModalButton").addClass("d-none");
      return Toast.fire({
        icon: "warning",
        title: "There is no current active semester",
      });
    }
    semester = result.data[0].semesters._id;
    document.querySelector("#card-title").innerHTML = `S.Y. ${
      result.data[0].schoolYear[0].year
    } (${result.data[0].semesters.sem.toUpperCase()} SEMESTER)`;
    $("#content-loading").remove();
    $("#content").removeClass("d-none");
    return fetch(`/api/curriculums/programs/${semester}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (result.data.length !== 0) {
      viewProgram.attr("disabled", false);
    }
    result.data.forEach((element) => {
      viewProgram.append(
        new Option(element.program.programCode.toUpperCase(), element._id)
      );
      viewProgram.removeAttr("disabled");
      programs.push(element.program.programCode.toUpperCase());
    });
    viewProgram.on("change", () => {
      fetch(`/api/curriculums/program/${viewProgram.val()}`)
        .then((response) => {
          return response.json();
        })
        .then((result) => {
          $("#yearList").removeClass("d-none");
          $("#nav-year #v-pills-tab").empty();
          $("#nav-year #v-pills-tabContent").empty();
          result.data.forEach((element, index) => {
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
            content.addClass(
              `tab-pane fade show ${index === 0 ? "active" : ""}`
            );
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
            addNewCourseButton.addClass("btn btn-sm btn-primary mb-3");
            addNewCourseButton.attr("data-bs-toggle", "modal");
            addNewCourseButton.attr("data-bs-target", "#addNewCourseModal");
            addNewCourseButton.attr("level", `${element._id}`);
            addNewCourseButton.html("Add Course");

            const sectionsList = $("<span></span>");
            sectionsList.attr("id", `section${element._id}`);

            actionRow.addClass("row");
            actionRow
              .append(
                $("<div></div>")
                  .addClass("col-8")
                  .html("List of Section: ")
                  .append(sectionsList)
              )
              .append(
                $("<div></div>")
                  .addClass("col-4")
                  .append(
                    $("<div></div>")
                      .addClass("float-end")
                      .append(addNewSectionButton)
                      .append(addNewCourseButton)
                  )
              );

            const tableRow = $("<div></div>");
            tableRow.addClass("row");
            const table = $("<table></table>");
            table.addClass("table");
            table.attr("id", element._id);
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

            tableRow.append($("<div></div>").addClass("col-12").append(table));
            content.append(actionRow);
            content.append(tableRow);

            $("#nav-year #v-pills-tabContent").append(content);

            element.sections.section.forEach((section) => {
              // <button type="button" class="btn-close" aria-label="Close"></button>
              const sectionListItem = $("<span></span>");
              sectionListItem.addClass("badge text-bg-primary");
              sectionListItem.html(`${section}`);
              sectionsList.append(sectionListItem);
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
              console.log(element._id);
              table.find("tbody").append(
                $("<tr></tr>")
                  .append(
                    $("<td></td>").html(`${course.courseCode.toUpperCase()}`)
                  )
                  .append(
                    $("<td></td>").html(
                      `${course.courseDescription.toUpperCase()}`
                    )
                  )
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
        })
        .catch((error) => {
          console.log(error);
          return Toast.fire({ icon: "warning", title: "Something went wrong" });
        });
    });
  })
  .catch((error) => {
    console.log(error);
  });

$(addProgramModal._element).on("show.bs.modal", (event) => {
  fetch("/api/programs")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const addProgram = $(event.currentTarget)
        .find("#programs")
        .select2({ multiple: true, width: "100%" });
      const button = $(event.currentTarget).find("#addProgramsButton");
      removeValidationError([addProgram]);
      button.off("click");
      const filteredData = result.data.filter((element) => {
        return !programs.includes(element.programCode.toUpperCase());
      });
      addProgram.val("");
      addProgram.empty();
      filteredData.forEach((element) => {
        addProgram.append(
          new Option(element.programName.toUpperCase(), element._id)
        );
      });
      addProgram.select2({
        multitple: true,
        width: "100%",
      });
      button.on("click", () => {
        fetch("/api/curriculums/programs/" + semester, {
          method: "POST",
          headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            programs: addProgram.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            if (result.errors) {
              displayValidationError(result.errors, event.currentTarget);
              return Promise.reject();
            }
            addProgramModal.hide();
            return fetch(`/api/curriculums/programs/${semester}`);
          })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            viewProgram.find("option").not(":first").remove();
            result.data.forEach((element) => {
              viewProgram.append(
                new Option(
                  element.program.programCode.toUpperCase(),
                  element._id
                )
              );
              viewProgram.attr("disabled", false);
              programs.push(element.program.programCode.toUpperCase());
            });
            return displayToast(result);
          })
          .catch((error) => {
            console.log(error);
            displayToast(error);
          });
      });
    })
    .catch((error) => {
      console.log(error);
      displayToast(error);
    });
});

$(addNewCourseModal._element).on("show.bs.modal", (event) => {
  const courses = $("#courses").select2({
    width: "100%",
    multiple: true,
  });
  courses.empty();
  const button = $(event.currentTarget).find("#addCourseButton");
  button.off("click");
  const year = $(event.relatedTarget).attr("level");
  fetch("/api/curriculums/course/" + year)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (result.data.length === 0) {
        return fetch("/api/courses").then((response) => {
          return response.json();
        });
      }
      const param = result.data.map((e) => e.course._id);
      return fetch("/api/courses/filtered/" + param).then((response) => {
        return response.json();
      });
    })
    .then((result) => {
      result.data.forEach((element) => {
        courses.append(
          new Option(
            element.courseCode.toUpperCase() +
              " - " +
              element.courseDescription.toUpperCase(),
            element._id
          )
        );
      });
      button.on("click", () => {
        fetch("/api/curriculums/course/" + year, {
          method: "POST",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            courses: courses.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            if (result.errors) {
              displayValidationError(result.errors, event.currentTarget);
              return displayToast(result);
            }
            const table = $(`#${year}`);
            addNewCourseModal.hide();
            if (table.children("tbody").find(".empty").length !== 0) {
              table.children("tbody").find(".empty").remove();
            }

            result.data.forEach((element) => {
              const tr = $("<tr></tr>");
              tr.append($("<td></td>").html(element.courseCode.toUpperCase()))
                .append(
                  $("<td></td>").html(element.courseDescription.toUpperCase())
                )
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
            displayToast(result);
          })
          .catch((error) => {});
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

$(addNewSectionModal._element).on("show.bs.modal", (event) => {
  const sections = $(event.currentTarget)
    .find("#sections")
    .select2({ tags: true, width: "100%", multiple: true });
  sections.val("").trigger("change");
  const year = $(event.relatedTarget).attr("level");
  const button = $(event.currentTarget).find("#addSectionButton");
  button.off("click");
  removeValidationError([sections]);
  button.on("click", () => {
    fetch("/api/curriculums/sections/" + year, {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: sections.val(),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.errors) {
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        addNewSectionModal.hide();
        result.sections.forEach((section) => {
          $(`#section${year}`).append(
            `
              <span class="badge text-bg-primary">
                ${section}
                <button type="button" class="btn-close" aria-label="Close"></button>
              </span>
            `
          );
        });
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayToast(result);
      });
  });
});

$("#addCourseButton").on("click", (event) => {
  fetch("/api/curriculums/course/" + programYear, {
    method: "POST",
    headers: { "csrf-token": csrf, "Content-Type": "application/json" },
    body: JSON.stringify({
      course: newCourse.val(),
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if ($(`#${programYear}`).children("tbody").find(".empty").length !== 0) {
        $(`#${programYear}`).children("tbody").find(".empty").remove();
      }
      result.courses.forEach((element) => {
        $(`#${programYear}`).children("tbody").append(`
          <tr>
            <td>${element.courseCode.toUpperCase()}</td>
            <td>${element.courseDescription.toUpperCase()}</td>
            <td>${element.lab}</td>
            <td>${element.lecture}</td>
            <td>${element.units}</td>
            <td>  
             <button class="btn btn-sm btn-danger" onClick="deleteData('${
               element._id
             }', '${programYear}' , this)">Delete</button>
            </td>
          </tr>`);
      });
      addNewCourseModal.hide();
      Toast.fire({ icon: "success", title: "Successfully Added" });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something Went Wrong" });
    });
});

// newCourse.on("change", () => {
//   let unitCount;
//   fetch("/api/courses/units?programs=" + newCourse.val())
//     .then((response) => {
//       return response.json();
//     })
//     .then((result) => {
//       unitCount = result.data
//         .map((e) => e.units)
//         .reduce((prev, next) => prev + next);
//       $("#unitsCount").html(unitCount);
//       console.log(result);
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// });

$("#removeProgram").on("click", () => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    preConfirm: () => {
      return fetch("/api/curriculums/program/" + viewProgram.val(), {
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
      viewProgram.find(":selected").remove();
      viewProgram.val("");
      $("#nav-year").addClass("d-none");
      $("#yearList").addClass("d-none");
      $("#year-loading").addClass("d-none");

      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
});

const deleteCourse = (event) => {
  const year = $(event.currentTarget).attr("year");
  const course = $(event.currentTarget).attr("course");
  Swal.fire({
    title: "Are you sure?",
    text: "Existing schedules will be deleted, You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    preConfirm: () => {
      return fetch(`/api/curriculums/course/${year}/${course}`, {
        method: "DELETE",
        headers: {
          "csrf-token": csrf,
          "Content-Type": "application/json",
        },
      }).then((response) => {
        return response.json();
      });
    },
  })
    .then((result) => {
      if (result.isConfirmed) {
        $(event.currentTarget).closest("tr").remove();
        Toast.fire({
          icon: "success",
          title: "Successfully Deleted",
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

$(copyModal._element).on("show.bs.modal", (event) => {
  if (copyYear) copyYear.off("change");
  if (copySem) copySem.off("change");
  copyYear = $("#year");
  copySem = $("#semester");

  fetch("/api/curriculums/school-year")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      copyYear.empty();
      copySem.empty();
      copySem.attr("disabled", true);
      copyYear.append(
        "<option disabled selected>--Select School Year</option>"
      );

      result.data.forEach((element) => {
        copyYear.append(new Option(element.school_year, element._id));
      });
      copyYear.on("change", () => {
        fetch("/api/curriculums/semesters/" + copyYear.val())
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            $("#copySubmit").addClass("disabled");
            copySem.find("option").not(":first").remove();
            copySem.append(
              "<option disabled selected>--Select School Sem</option>"
            );
            result.data.forEach((element) => {
              copySem.append(
                new Option(element.sem.toUpperCase(), element._id)
              );
            });
            copySem.removeAttr("disabled");
            copySem.on("change", () => {
              $("#copySubmit").removeClass("disabled");
            });
          });
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

$("#copySubmit").on("click", () => {
  if (semester === copySem.val()) {
    return Toast.fire({
      icon: "warning",
      title: "Active Semester and Selected Semester is same",
    });
  }
  console.log("/api/curriculums/copy/" + semester + "/" + copySem.val());
  fetch("/api/curriculums/copy/" + semester + "/" + copySem.val(), {
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
