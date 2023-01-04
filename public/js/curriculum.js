let school_year, semester;
const programs = [];

const csrf = $("#csrf").val();

const viewSemester = $("#view-semester");
const viewProgram = $("#view-program");
let viewSemesterValue, viewProgramValue;
const addProgram = $("#add-program");
const addSemester = $("#add-semester");

const yearLevel = $("#year-level");
const section = $("#section").select2({ tags: true, width: "100%" });
const course = $("#course");
const newCourse = $("#newCourseSelect");
const assignScheduleButton = document.querySelector("#assign-schedule");

let programYear;

const addModal = new bootstrap.Modal($("#addModal"));
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
    if (!result) {
    }
    if (result.data.length === 0) {
      $("#addModalButton").addClass("d-none");
      return Toast.fire({
        icon: "warning",
        title: "There is no current active semester",
      });
    }
    console.log(result.data[0].semesters);
    semester = result.data[0].semesters._id;
    document.querySelector("#card-title").innerHTML = `${
      result.data[0].school_year[0].year
    } (${result.data[0].semesters.sem.toUpperCase()} SEMESTER)`;
    $("#content-loading").remove();
    $("#content").removeClass("d-none");
    return fetch(`/api/curriculums/programs/${semester}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      return Toast.fire({ icon: "warning", title: "Something went wrong" });
    }

    result.data.forEach((element) => {
      viewProgram.append(
        new Option(element.program.programCode.toUpperCase(), element._id)
      );
      programs.push(element.program.programCode.toUpperCase());
    });
    $("#submit-button").attr("disabled", true);
    viewProgram.attr("disabled", false);
  })
  .catch((error) => {
    console.log(error);
  });

$(addModal._element).on("show.bs.modal", () => {
  fetch("/api/programs")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(programs);
      const filteredData = result.data.filter((element) => {
        return !programs.includes(element.programCode.toUpperCase());
      });
      console.log(filteredData);
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
      ok = true;
      if (!ok) {
        Toast.fire({
          icon: "warning",
          title: "Something went wrong, Try again later",
        });
        $("#add-button").attr("disabled", true);
        return;
      }
    })
    .catch((error) => {
      console.log(error);
      ok = false;
    });
});

$(addNewCourseModal._element).on("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  programYear = button.getAttribute("level");
  const existingCourse = [];
  fetch("/api/curriculums/course/" + programYear)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.course.forEach((element) => {
        existingCourse.push(element);
      });
      return fetch("/api/courses").then((response) => {
        return response.json();
      });
    })
    .then((result) => {
      const filteredData = result.data.filter((element) => {
        return !existingCourse.includes(element._id);
      });
      newCourse.empty();
      newCourse.select2({
        width: "100%",
        multiple: true,
      });
      $("#unitsCount").html("0");
      filteredData.forEach((element) => {
        newCourse.append(
          new Option(
            element.courseCode.toUpperCase() +
              " - " +
              element.courseDescription.toUpperCase(),
            element._id
          )
        );
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

$(addNewSectionModal._element).on("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  programYear = button.getAttribute("level");
  $("#newSectionSelect").val("");
  $("#newSectionSelect").select2({ tags: true, width: "100%", multiple: true });
});

$("#addSectionButton").on("click", () => {
  fetch("/api/curriculums/sections/" + programYear, {
    method: "POST",
    headers: { "csrf-token": csrf, "Content-Type": "application/json" },
    body: JSON.stringify({
      sections: $("#newSectionSelect").val(),
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        Toast.fire({ icon: "error", title: "Something Went Wrong" });
        return;
      }
      result.sections.forEach((section) => {
        $(`#section${programYear}`).append(
          `
            <span class="badge text-bg-primary">
              ${section}
              <button type="button" class="btn-close" aria-label="Close"></button>
            </span>
          `
        );
      });
      addNewSectionModal.hide();
      Toast.fire({ icon: "success", title: "Successfully Added" });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something Went Wrong" });
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
      if (!result.ok) {
        return;
      }
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

newCourse.on("change", () => {
  let unitCount;
  fetch("/api/courses/units?programs=" + newCourse.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      unitCount = result.data
        .map((e) => e.units)
        .reduce((prev, next) => prev + next);
      $("#unitsCount").html(unitCount);
      console.log(result);
    })
    .catch((error) => {
      console.log(error);
    });
});

$("#add-button").on("click", () => {
  addProgram.removeClass("is-invalid");
  addSemester.removeClass("is-invalid");
  console.log(addProgram.val());
  fetch("/api/curriculums/programs/" + semester, {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      semester: addSemester.val(),
      program: addProgram.val(),
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      addModal.hide();
      addProgram.removeClass("is-invalid").val("");
      addSemester.removeClass("is-invalid").val("");
      return fetch(`/api/curriculums/programs/${semester}`);
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      viewProgram.find("option").not(":first").remove();
      result.data.forEach((element) => {
        viewProgram.append(
          new Option(element.program.programCode.toUpperCase(), element._id)
        );
        programs.push(element.program.programCode.toUpperCase());
      });
      return Toast.fire({ icon: "success", title: "Successfull Added" });
    })
    .catch((error) => {
      console.log(error);
      return Toast.fire({ icon: "warning", title: "Something went wrong" });
    });
});

$("#add-year-button").on("click", () => {
  console.log(viewProgram.val());
  fetch("/api/curriculums/year/" + viewProgram.val(), {
    method: "POST",
    headers: { "csrf-token": csrf, "Content-Type": "application/json" },
    body: JSON.stringify({
      semester: viewSemesterValue,
      program: viewProgramValue,
      year_level: yearLevel.val(),
      section: section.val(),
      course: course.val(),
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        if (result.errors) {
          yearLevel
            .addClass(result.errors.year_level ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(result.errors.year_level ? result.errors.year_level.msg : "");
          section
            .addClass(result.errors.section ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(result.errors.section ? result.errors.section.msg : "");
          course
            .addClass(result.errors.course ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(result.errors.course ? result.errors.course.msg : "");
        }
        return Toast.fire({ icon: "warning", title: "Something went wrong" });
      }
      return fetch("/api/curriculums/year-levels/" + viewProgram.val())
        .then((response) => {
          return response.json();
        })
        .then((program) => {
          console.log(program);
          $("#nav-year #v-pills-tab").empty();
          $("#nav-year #v-pills-tabContent").empty();
          program.data.forEach((element, index) => {
            $("#nav-year #v-pills-tab").append(
              `<button class="nav-link ${
                index == 0 ? "active" : ""
              }" id="v-pills-${
                element.level.level
              }-tab" data-bs-toggle="pill" data-bs-target="#v-pills-${
                element.level.level
              }" type="button" role="tab" aria-controls="v-pills-${
                element.level.level
              }" aria-selected="true">${element.level.level}</button>`
            );
            $("#nav-year #v-pills-tabContent").append(
              `<div class="tab-pane fade show ${
                index == 0 ? "active" : ""
              }" id="v-pills-${
                element.level.level
              }" role="tabpanel" aria-labelledby="v-pills-${
                element.level.level
              }-tab" tabindex="0">
                <table class="table" id='${element._id}'>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Description</th>
                      <th>Course Lab</th>
                      <th>Course Lecture</th>
                      <th>Course Units</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                  </tbody>
              </table>
            </div>`
            );

            element.courses.forEach((course) => {
              $(`#${element._id} tbody`).append("<tr>").append(`
                <td>${course.course_code}</td>
                <td>${course.course_description}</td>
                <td>${course.lab}</td>
                <td>${course.lecture}</td>
                <td>${course.units}</td>
                <td>  
                  <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
                </td>
              `);
            });
          });
          yearLevel.removeClass("is-invalid").val("");
          section.removeClass("is-invalid").val("");
          course.removeClass("is-invalid").val("");
          addYearModal.hide();
          return Toast.fire({
            icon: "success",
            title: "Successfully Added Year Level",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      return Toast.fire({ icon: "warning", title: "Something went wrong" });
    });
});

viewProgram.on("change", () => {
  viewSemesterValue = viewSemester.val();
  viewProgramValue = viewProgram.val();
  $("#faculty-load").attr(
    "href",
    `/admin/schedules/faculty/${viewSemesterValue}`
  );
  fetch(`/api/curriculums/program/${viewProgramValue}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        return Toast.fire({ icon: "warning", title: "Something went wrong" });
      }
      $("#yearList").removeClass("d-none");
      if (result.data == 0) {
        $("#year-loading").removeClass("d-none");
        $("#nav-year").addClass("d-none");
        return $("#year-loading").html(
          "There is no year level, Please add a year level"
        );
      }
      $("#nav-year #v-pills-tab").empty();
      $("#nav-year #v-pills-tabContent").empty();
      result.data.forEach((element, index) => {
        $("#nav-year #v-pills-tab").append(
          `<button class="nav-link ${index == 0 ? "active" : ""}" id="v-pills-${
            element._id
          }-tab" data-bs-toggle="pill" data-bs-target="#v-pills-${
            element._id
          }" type="button" role="tab" aria-controls="v-pills-${
            element._id
          }" aria-selected="true">${element.year.yearLevel.toUpperCase()}</button>`
        );
        $("#nav-year #v-pills-tabContent").append(
          `<div class="tab-pane fade show ${
            index == 0 ? "active" : ""
          }" id="v-pills-${
            element._id
          }" role="tabpanel" aria-labelledby="v-pills-${
            element._id
          }-tab" tabindex="0">
          <div class="row">
            <div class="col-8">
              List of Section: <span id="section${element._id}"></span>
            </div>
            <div class=" col-4">
              <div class="float-end">
                <button type="button" class="btn btn-primary mb-3 " data-bs-toggle="modal" data-bs-target="#addNewSectionModal" level="${
                  element._id
                }">
                  Add Section
                </button>
                <button type="button" class="btn btn-primary mb-3 " data-bs-toggle="modal" data-bs-target="#addNewCourseModal" level="${
                  element._id
                }">
                  Add New Course
                </button>
              </div>
            </div>
          </div>
            <table class="table" id='${element._id}'>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Description</th>
                  <th>Course Lab</th>
                  <th>Course Lecture</th>
                  <th>Course Units</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
          </table>
        </div>`
        );

        element.sections.section.forEach((section) => {
          $(`#section${element._id}`).append(
            `
              <span class="badge text-bg-primary">
                ${section}
                <button type="button" class="btn-close" aria-label="Close"></button>
              </span>
            `
          );
        });

        if (element.course.length == 0) {
          $(`#${element._id} tbody`).append(
            `<tr><td colspan="6" class="text-center empty">There are no courses in this year level</td></tr>`
          );
          return;
        }
        element.course.forEach((course) => {
          $(`#${element._id} tbody`)
            .append(`<tr><td>${course.courseCode.toUpperCase()}</td>
          <td>${course.courseDescription.toUpperCase()}</td>
          <td>${course.lab}</td>
          <td>${course.lecture}</td>
          <td>${course.units}</td>
          <td>  
            <button class="btn btn-sm btn-danger" onClick="deleteData('${
              course._id
            }', '${element._id}' , this)">Delete</button>
          </td></tr>`);
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

const deleteData = (course, year, element) => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
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
      })
        .then((response) => {
          return response.json();
        })
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  }).then((result) => {
    if (result.isConfirmed) {
      console.log(result);
      if (!result.value) {
        return Toast.fire({
          icon: "warning",
          title: "Something Went Wrong!",
        });
      }
      element.closest("tr").remove();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
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
        copyYear.append(
          new Option(element.school_year.year, element.school_year._id)
        );
      });
      copyYear.on("change", () => {
        fetch("/api/curriculums/semesters/" + copyYear.val())
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            $("#copySubmit").addClass("disabled");
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
      return Toast.fire({
        icon: "success",
        title: "successfully copied",
      });
    })
    .catch((error) => {
      console.log(error);
    });
});
