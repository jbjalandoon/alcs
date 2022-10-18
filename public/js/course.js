const courseTable = $("#courseTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
         </div>`,
  },
});
const csrf = $("#csrf").val();

let editModal = new bootstrap.Modal($("#editModal"));
let addModal = new bootstrap.Modal($("#addModal"));
let uploadModal = new bootstrap.Modal($("#uploadModal"));
let modalElement = $(editModal._element);

let button, id, courseCode, courseDescription, units, lab, lecture;

fetch("/api/course", { method: "GET" })
  .then((response) => {
    return response.json();
  })
  .then((course) => {
    if (!course.ok) {
      Toast.fire({ icon: "warning", title: "Something went wrong!" });
      return;
    }
    course.data.forEach((element) => {
      courseTable.row
        .add([
          element.course_code,
          element.course_description,
          element.lecture ? element.lecture : "N/A",
          element.lab ? element.lab : "N/A",
          element.units,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
          `,
        ])
        .draw();
    });
    Toast.fire({ icon: "success", title: "Data loading is success" });
  });

$("#add-button").on("click", () => {
  courseCode = $("#addForm #course-code");
  courseDescription = $("#addForm #course-description");
  units = $("#addForm #units");
  lab = $("#addForm #lab");
  lecture = $("#addForm #lecture");
  courseCode.removeClass("is-invalid");
  courseDescription.removeClass("is-invalid");
  units.removeClass("is-invalid");
  lab.removeClass("is-invalid");
  lecture.removeClass("is-invalid");
  fetch("/api/course", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `course_code=${courseCode.val()}&course_description=${courseDescription.val()}&units=${units.val()}&lab=${lab.val()}&lecture=${lecture.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        courseCode
          .addClass(result.errors.course_code ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.course_code.msg);
        courseDescription
          .addClass(result.errors.course_description ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.course_description.msg);
        units
          .addClass(result.errors.units ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.units.msg);
        lab
          .addClass(result.errors.lab ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.lab.msg);
        lecture
          .addClass(result.errors.lecture ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.lecture.msg);
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      addModal.hide();
      courseCode.removeClass("is-invalid").val("");
      courseDescription.removeClass("is-invalid").val("");
      units.removeClass("is-invalid").val("");
      lab.removeClass("is-invalid").val("");
      lecture.removeClass("is-invalid").val("");
      courseTable.row
        .add([
          result.data.course_code,
          result.data.course_description,
          result.data.lecture ? result.data.lecture : "N/A",
          result.data.lab ? result.data.lab : "N/A",
          result.data.units,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
          `,
        ])
        .draw();
      Toast.fire({ icon: "success", title: "sucessfully added" });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "warning", title: "Something went wrong" });
    });
});

modalElement.on("show.bs.modal", (event) => {
  button = event.relatedTarget;
  id = button.getAttribute("data-bs-id");
  courseCode = modalElement.find(".modal-body #course-code");
  courseDescription = modalElement.find(".modal-body  #course-description");
  units = modalElement.find(".modal-body #units");
  lab = modalElement.find(".modal-body #lab");
  lecture = modalElement.find(".modal-body #lecture");

  courseCode.removeClass("is-invalid").val("");
  courseDescription.removeClass("is-invalid").val("");
  units.removeClass("is-invalid").val("");
  lab.removeClass("is-invalid").val("");
  lecture.removeClass("is-invalid").val("");

  fetch("/api/course/" + id, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((program) => {
      if (!program.ok) {
        Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
      }
      courseCode.val(program.data.course_code);
      courseDescription.val(program.data.course_description);
      units.val(program.data.units);
      lab.val(program.data.lab);
      lecture.val(program.data.lecture);
    });
});

$("#uploadButton").on("click", () => {
  const body = new FormData(document.getElementById("uploadForm"));
  console.log(body.get("spreadsheet"));
  fetch("/api/course/upload", {
    method: "POST",
    headers: { "csrf-token": csrf },
    body: body,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        return;
      }
      $("#uploadForm").val("");
      uploadModal.hide();
      result.addedData.forEach((element) => {
        courseTable.row
          .add([
            element.course_code,
            element.course_description,
            element.lecture ? element.lecture : "N/A",
            element.lab ? element.lab : "N/A",
            element.units,
            `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
          `,
          ])
          .draw();
      });
      Toast.fire({ icon: "success", title: "Successfully Added" });
    })
    .catch((error) => {
      Toast.fire({ icon: "error", title: "Something went wrong" });
      console.log(error);
    });
});

$("#edit-button").on("click", () => {
  courseCode.removeClass("is-invalid");
  courseDescription.removeClass("is-invalid");
  units.removeClass("is-invalid");
  lab.removeClass("is-invalid");
  lecture.removeClass("is-invalid");

  fetch("/api/course/" + id, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `course_code=${courseCode.val()}&course_description=${courseDescription.val()}&units=${units.val()}&lab=${lab.val()}&lecture=${lecture.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        courseCode
          .addClass(result.errors.course_code ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.course_code ? result.errors.course_code.msg : "");
        courseDescription
          .addClass(result.errors.course_description ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(
            result.errors.course_description
              ? result.errors.course_description.msg
              : ""
          );
        units
          .addClass(result.errors.units ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.units ? result.errors.units.msg : "");
        lab
          .addClass(result.errors.lab ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.lab ? result.errors.lab.msg : "");
        lecture
          .addClass(result.errors.lecture ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.lecture ? result.errors.lecture.msg : "");
        Toast.fire({ icon: "warning", title: "Something went Wrong" });
        return;
      }
      editModal.hide();
      Toast.fire({
        icon: "success",
        title: "Successfuly Edited",
      });
      button.closest("tr").innerHTML = `
        <td>${courseCode.val()}</td>
        <td>${courseDescription.val()}</td>
        <td>${lecture.val()}</td>
        <td>${lab.val()}</td>
        <td>${units.val()}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${id}', this)">Delete</button>
        </td>
      `;
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "warning", title: "Something went wrong" });
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
      return fetch("/api/course/" + id, {
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
      if (!result.value.ok) {
        return Toast.fire({
          icon: "warning",
          title: "Something Went Wrong!",
        });
      }
      courseTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
