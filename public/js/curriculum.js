const school_year = $("#school-year");

const csrf = $("#csrf").val();
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const viewSemester = $("#view-semester");
const viewProgram = $("#view-program");
let viewSemesterValue, viewProgramValue;
const addProgram = $("#add-program");
const addSemester = $("#add-semester");

const yearLevel = $("#year-level");
const section = $("#section").select2({ tags: true, width: "100%" });
const course = $("#course");

const addModal = new bootstrap.Modal($("#addModal"));
const addYearModal = new bootstrap.Modal($("#addYeaModal"));

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
        $("#addModalButton").addClass("d-none");
      }
      $("#content-loading").remove();
      $("#content").removeClass("d-none");
      return result.data.forEach((element) => {
        viewSemester.append(new Option(element.sem + " Semester", element.sem));
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
        addSemester.append(new Option(element + " semester", element));
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

$("#submit-button").on("click", () => {
  viewSemesterValue = viewSemester.val();
  viewProgramValue = viewProgram.val();
  fetch(
    `/admin/curriculum/programs/${school_year.val()}/${viewProgramValue}?${new URLSearchParams(
      { semester: viewSemester.val() }
    )}`
  )
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return Toast.fire({ icon: "warning", title: "Something went wrong" });
      }
      $("#yearList").removeClass("d-none");
      if (result.data == 0) {
        return $("#year-loading").html(
          "There is no year level, Please add a year level"
        );
      }
      result.data.forEach((element, index) => {
        $("#nav-year #v-pills-tab").append(
          `<button class="nav-link ${index == 0 ? 'active':''}" id="v-pills-${element.year.level}-tab" data-bs-toggle="pill" data-bs-target="#v-pills-${element.year.level}" type="button" role="tab" aria-controls="v-pills-${element.year.level}" aria-selected="true">${element.year.level}</button>`
        );
        $("#nav-year #v-pills-tabContent").append(
          `<div class="tab-pane fade show ${index == 0 ? 'active':''}" id="v-pills-${element.year.level}" role="tabpanel" aria-labelledby="v-pills-${element.year.level}-tab" tabindex="0">
            <table class="table" id='${element._id}'>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Description</th>
                  <th>Course Lab</th>
                  <th>Course Lecture</th>
                  <th>Course Units</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
          </table>
        </div>`
        );

        element.course.forEach((course) => {
          $(`#${element._id} tbody`).append('<tr>').append(`
            <td>${course.course_code}</td>
            <td>${course.course_description}</td>
            <td>${course.lab}</td>
            <td>${course.lecture}</td>
            <td>${course.units}</td>
          `)
        });
      });

      $("#year-loading").remove();
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
  fetch("/admin/curriculum/programs/" + school_year.val(), {
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
  fetch("/admin/curriculum/year/" + school_year.val(), {
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
      yearLevel.removeClass("is-invalid").val("");
      section.removeClass("is-invalid").val("");
      course.removeClass("is-invalid").val("");
      addYearModal.hide();
      return Toast.fire({
        icon: "success",
        title: "Successfully Added Year Level",
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
  fetch(
    `/admin/curriculum/programs/${school_year.val()}?${new URLSearchParams({
      semester: viewSemester.val(),
    })}`
  )
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        return Toast.fire({ icon: "warning", title: "Something went wrong" });
      }

      result.data.forEach((element) => {
        viewProgram.append(
          new Option(element.program[0].program_code, element._id)
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
