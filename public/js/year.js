const yearTable = $("#yearTable").DataTable({
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

// const formModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));
let modalElement = $(editModal._element);
let year;
let id;

fetch("/api/years", { method: "GET" })
  .then((response) => {
    return response.json();
  })
  .then((years) => {
    if (!years.ok) {
      return;
    }
    years.data.forEach((element) => {
      yearTable.row
        .add([
          element.year,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <a class="btn btn-sm btn-secondary" href="/admin/curriculums/${element._id}">View</a>
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

$("#add-button").on("click", () => {
  year = $("#addForm #year");
  year.removeClass("is-invalid");
  fetch("/api/years", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `year=${year.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        year
          .addClass(result.errors.year ? "is-invalid" : "")
          .siblings(".invalid-feedback")
          .html(result.errors.year.msg);
        return Toast.fire({ icon: "warning", title: "Something went wrong" });
      }
      addModal.hide();
      year.removeClass("is-invalid").val("");
      yearTable.row
        .add([
          result.data.year,
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
            <a class="btn btn-sm btn-secondary" href="/admin/curriculums/${result.data._id}">View</a>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
          `,
        ])
        .draw();
      Toast.fire({ icon: "success", title: "Successfuly added school year" });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "warning", title: "Something went wrong" });
    });
});

modalElement.on("show.bs.modal", (event) => {
  button = event.relatedTarget;
  id = button.getAttribute("data-bs-id");
  year = modalElement.find(".modal-body #year");
  year.removeClass("is-invalid").val("");
  fetch("/api/years/" + id, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((program) => {
      if (!program.ok) {
        Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
      }
      year.val(program.data.year);
    });
});

$("#edit-button").on("click", () => {
  fetch("/api/years/" + id, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `year=${year.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        year
          .addClass(result.errors.year ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.year.msg);
        Toast.fire({
          icon: "warning",
          title: "Something went wrong",
        });
        return;
      }
      editModal.hide();
      Toast.fire({
        icon: "success",
        title: "Successfuly Edited",
      });
      button.closest("tr").innerHTML = `
        <td>${year.val()}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
          <a class="btn btn-sm btn-secondary" href="/admin/curriculums/${id}">View</a>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${id}', this)">Delete</button>
        </td>
      `;
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
      return fetch("/api/years/" + id, {
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
      yearTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
