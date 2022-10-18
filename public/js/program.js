const programTable = $("#programTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
       </div>`,
  },
});
const csrf = $("#csrf").val();
const uploadModal = new bootstrap.Modal($("#uploadModal"));

const editData = (id, element) => {};

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
      return fetch("/api/programs/" + id, {
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
      programTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};

let formModal = new bootstrap.Modal($("#editModal"));
let addModal = new bootstrap.Modal($("#addModal"));
let modalElement = $(formModal._element);
let button;
let id;
let modalTitle;
let programCode;
let programName;
let editButton;

modalElement.on("show.bs.modal", (event) => {
  button = event.relatedTarget;
  id = button.getAttribute("data-bs-id");
  modalTitle = modalElement.find(".modal-title");
  programCode = modalElement.find(".modal-body #program-code");
  programName = modalElement.find(".modal-body #program-name");
  editButton = modalElement.find("#edit-button");
  programCode.removeClass("is-invalid").val('');
  programName.removeClass("is-invalid").val('');
  fetch("/api/programs/" + id, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((program) => {
      if (!program.ok) {
        Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
      }
      programCode.val(program.data.program_code);
      programName.val(program.data.program_name);
    });
});

$("#edit-button").on("click", () => {
  programCode.removeClass("is-invalid");
  programName.removeClass("is-invalid");
  fetch("/api/programs/" + id, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `program_code=${programCode.val()}&program_name=${programName.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (result.errors) {
        programCode
          .addClass(result.errors.program_code ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.program_code.msg);
        programName
          .addClass(result.errors.program_name ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.program_name.msg);
        return;
      }
      if (!result.ok) {
        return Toast.fire({
          icon: "warning",
          title: "Something Went Wrong!",
        });
      }
      formModal.hide();
      Toast.fire({
        icon: "success",
        title: "Successfuly Edited",
      });
      button.closest("tr").innerHTML = `
        <td>${programCode.val()}</td>
        <td>${programName.val()}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${id}', this)">Delete</button>
        </td>
      `;
    })
    .catch((error) => {
      Toast.fire({
        icon: "warning",
        title: "Something Went Wrong!",
      });
    });
});

$("#uploadButton").on("click", () => {
  const body = new FormData(document.getElementById("uploadForm"));
  fetch("/api/programs/upload", {
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
        programTable.row
          .add([
            element.program_code,
            element.program_description,
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

$("#add-button").on("click", () => {
  programCode = $("#addForm div #program-code");
  programName = $("#addForm div #program-name");
  programCode.removeClass("is-invalid");
  programName.removeClass("is-invalid");
  fetch("/api/programs/", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `program_code=${programCode.val()}&program_name=${programName.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        programCode
          .addClass(result.errors.program_code ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.program_code.msg);
        programName
          .addClass(result.errors.program_name ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.program_name.msg);
        return;
      }
      addModal.hide();
      programCode.removeClass("is-invalid").val("");
      programName.removeClass("is-invalid").val("");
      programTable.row
        .add([
          result.data.program_code,
          result.data.program_name,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
            `,
        ])
        .draw();
      Toast.fire({ icon: "success", title: "Sucessfuly added new record" });
    })
    .catch((error) => {
      Toast.fire({ icon: "warning", title: "Something Went Wrong!" });
    });
});

fetch("/api/programs", {
  method: "GET",
})
  .then((response) => {
    return response.json();
  })
  .then((programs) => {
    if (!programs.ok) {
      return Toast.fire({
        icon: "warning",
        title: "Something Went Wrong!",
      });
    } else {
      programs.data.forEach((element) => {
        programTable.row
          .add([
            element.program_code,
            element.program_name,
            `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
            `,
          ])
          .draw();
      });
      Toast.fire({
        icon: "success",
        title: "Data Loading is Successful",
      });
    }
  })
  .catch((error) => {
    Toast.fire({
      icon: "warning",
      title: "Something Went Wrong",
    });
  });
