const levelTable = $("#levelTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`,
  },
});
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

// let editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));
const modalElement = $(editModal._element);
let year_level;
let id;
let button;
fetch("/api/levels")
  .then((response) => {
    return response.json();
  })
  .then((level) => {
    console.log(level);
    if (!level.ok) {
      Toast.fire({ icon: "warning", title: "Something went Wrong!" });
      return;
    }
    level.data.forEach((element) => {
      levelTable.row
        .add([
          element.level,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
          `,
        ])
        .draw();
    });
    Toast.fire({ icon: "success", title: "Data successfuly loaded" });
  })
  .catch((error) => {
    console.log(error);
    Toast.fire({ icon: "warning", title: "Something Went Wrong!" });
  });

modalElement.on("show.bs.modal", (event) => {
  button = event.relatedTarget;
  id = button.getAttribute("data-bs-id");
  yearLevel = modalElement.find(".modal-body #year-level");
  editButton = modalElement.find("#edit-button");
  yearLevel.removeClass("is-invalid").val("");
  fetch("/api/levels/" + id, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((level) => {
      if (!level.ok) {
        Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
      }
      yearLevel.val(level.data.level);
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
    });
});

$("#edit-button").on("click", () => {
  yearLevel.removeClass("is-invalid");
  fetch("/api/levels/" + id, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `year_level=${yearLevel.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        yearLevel
          .addClass(result.errors.year_level ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.year_level.msg);
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      editModal.hide();
      Toast.fire({
        icon: "success",
        title: "Successfuly Edited",
      });
      button.closest("tr").innerHTML = `
        <td>${yearLevel.val()}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${id}', this)">Delete</button>
        </td>
      `;
    });
});

$("#add-button").on("click", () => {
  year_level = $("#addForm div #year_level");
  fetch("/api/levels", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `year_level=${year_level.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        year_level
          .addClass("is-invalid")
          .siblings("div .invalid-feedback")
          .html(result.errors.year_level.msg);
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      year_level.removeClass("is-invalid").val("");
      addModal.hide();
      levelTable.row
        .add([
          result.data.level,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
          `,
        ])
        .draw();
      Toast.fire({ icon: "success", title: "Successfully added" });
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
      return fetch("/api/levels/" + id, {
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
      levelTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
