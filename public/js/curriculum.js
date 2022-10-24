const school_year = $("#school-year");

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
const addYearModal = new bootstrap.Modal($("#addYeaModal"));
const addNewCourseModal = new bootstrap.Modal($("#addNewCourseModal"));
const addNewSectionModal = new bootstrap.Modal($("#addNewSectionModal"));

fetch("/admin/curriculum/semester/" + school_year.val(), { method: "GET" })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      Toast.fire({ icon: "warning", title: "Something went wrong" });
      return;
    }
    if (result.data != null) {
      if (result.data.length != 3) {
        $("#addModalButton").removeClass("d-none");
      }
      $("#content-loading").remove();
      $("#content").removeClass("d-none");
      return result.data.forEach((element) => {
        viewSemester.append(
          new Option((element.sem + " Semester").toUpperCase(), element._id)
        );
      });
    }
    $("#addModalButton").removeClass("d-none");
    $("#content-loading").html("Please add new semester and program");
  })
  .catch((error) => {
    Toast.fire({ icon: "warning", title: "Something went wrong" });
    console.log(error);
  });

fetch("/api/levels")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      return;
    }
    result.data.forEach((element) => {
      yearLevel.append(new Option(element.level, element._id));
    });
  })
  .catch((error) => {
    console.log(error);
  });

fetch("/api/course")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      return;
    }
    result.data.forEach((element) => {
      course.append(new Option(element.course_description, element._id));
    });
    course
      .select2({
        multiple: true,
        width: "100%",
      })
      .val(null)
      .trigger("change");
  })
  .catch((error) => {
    console.log(error);
  });

$(addModal._element).on("show.bs.modal", () => {
  let ok;
  addProgram.empty();
  addSemester
    .empty()
    .append('<option value="" disabled selected>--Select Semester--</option>');
  $("#add-button").attr("disabled", false);
  fetch("/admin/curriculum/semester/" + school_year.val(), { method: "GET" })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        ok = false;
        return;
      }
      let semester = ["first", "second", "summer"];
      const filteredSemester = [];
      if (result.data == null) {
        semester.forEach((element) => {
          addSemester.append(
            $("<option>", {
              class: "text-uppercase",
              value: element,
              text: element + " Semester",
            })
          );
        });
        ok = true;
        return;
      }
      result.data.forEach((element) => {
        const index = semester.indexOf(element.sem);
        if (index > -1) {
          semester.splice(index, 1);
        }
      });
      semester.forEach((element) => {
        addSemester.append(
          new Option((element + " semester").toUpperCase(), element)
        );
      });

      ok = true;
    })
    .catch((error) => {
      ok = false;
      console.log(error);
    });

  fetch("/api/programs", { method: "GET" })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        ok = false;
        return;
      }
      result.data.forEach((element) => {
        addProgram.append(new Option(element.program_name, element._id));
        addProgram.select2({
          multitple: true,
          width: "100%",
        });
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
      if (!result.ok) {
        return;
      }
      result.data.course.forEach((element) => {
        existingCourse.push(element);
      });
      return fetch("/api/course").then((response) => {
        return response.json();
      });
    })
    .then((result) => {
      if (!result.ok) {
        return;
      }
      const filteredData = result.data.filter((element) => {
        return !existingCourse.includes(element._id);
      });
      newCourse.empty();
      newCourse.select2({
        width: "100%",
        multiple: true,
      });
      filteredData.forEach((element) => {
        newCourse.append(
          new Option(element.course_description.toUpperCase(), element._id)
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
      result.courses.forEach((element) => {
        $(`#${programYear}`).children("tbody").append(`
          <tr>
            <td>${element.course_code}</td>
            <td>${element.course_description}</td>
            <td>${element.lab}</td>
            <td>${element.lecture}</td>
            <td>${element.units}</td>
            <td>  
             <button class="btn btn-sm btn-danger" onClick="deleteData('${element._id}', '${programYear}' , this)">Delete</button>
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

$("#submit-button").on("click", () => {
  viewSemesterValue = viewSemester.val();
  viewProgramValue = viewProgram.val();
  assignScheduleButton.setAttribute(
    "href",
    `/admin/schedules/${viewSemesterValue}`
  );

  fetch(
    `/api/curriculums/program/${viewProgramValue}`
  )
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
          }" aria-selected="true">${element.year.level}</button>`
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
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addNewSectionModal" level="${
                  element._id
                }">
                  Add Section
                </button>
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addNewCourseModal" level="${
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
            `<tr><td colspan="6" class="text-center">There are no courses in this year level</td></tr>`
          );
          return;
        }
        element.course.forEach((course) => {
          $(`#${element._id} tbody`).append(`<tr><td>${course.course_code}</td>
          <td>${course.course_description}</td>
          <td>${course.lab}</td>
          <td>${course.lecture}</td>
          <td>${course.units}</td>
          <td>  
            <button class="btn btn-sm btn-danger" onClick="deleteData('${course._id}', '${element._id}' , this)">Delete</button>
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

$("#add-button").on("click", () => {
  addProgram.removeClass("is-invalid");
  addSemester.removeClass("is-invalid");
  console.log(addProgram.val());
  fetch("/api/curriculums/programs/" + school_year.val(), {
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
      if (!result.ok) {
        addProgram
          .addClass(result.errors.program ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.program ? result.errors.program.msg : "");
        addSemester
          .addClass(result.errors.semester ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.semester ? result.errors.semester.msg : "");
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      addModal.hide();
      addProgram.removeClass("is-invalid").val("");
      addSemester.removeClass("is-invalid").val("");
      viewSemester
        .empty()
        .append(
          '<option value="" disabled selected>--Select Semester--</option>'
        );
      $("#content-loading").remove();
      $("#content").removeClass("d-none");
      result.data.semesters.forEach((element) => {
        viewSemester.append(new Option(element.sem + " Semester", element.sem));
      });
      if (result.data.semesters.length == 3) {
        $("#addModalButton").addClass("d-none");
      }
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

viewSemester.on("change", () => {
  viewProgram
    .attr("disabled", true)
    .empty()
    .append('<option value="" disabled selected>--Select Semester--</option>');
  fetch(`/api/curriculums/programs/${viewSemester.val()}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return Toast.fire({ icon: "warning", title: "Something went wrong" });
      }

      result.data.forEach((element) => {
        viewProgram.append(
          new Option(element.program.program_code, element._id)
        );
      });
      $("#submit-button").attr("disabled", true);
      viewProgram.attr("disabled", false);
    })
    .catch((error) => {
      console.log(error);
      return Toast.fire({ icon: "warning", title: "Something went wrong" });
    });
});

viewProgram.on("change", () => {
  if (viewProgram.val() != "") {
    $("#submit-button").removeAttr("disabled");
  }
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
