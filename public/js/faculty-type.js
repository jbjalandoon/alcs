const table = $("#facultyTypeTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`,
  },
});

const csrf = $("#csrf").val();
let facultyType, unitsCap, hoursCap;

let addModal = new bootstrap.Modal($("#addFacultyTypeModal"));
let editModal = new bootstrap.Modal($("#editFacultyTypeModal"));

fetch("/api/faculty-types")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      table.row
        .add([
          element.facultyType.toUpperCase(),
          element.unitsCap,
          element.hoursCap,
          `
        <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editFacultyTypeModal" data-bs-id="${element._id}">Edit</button>
        <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
        `,
        ])
        .draw();
    });
  })
  .catch((error) => {
    console.log(error);
  });

$(addModal._element).on("show.bs.modal", (event) => {
  const addButton = $(event.currentTarget).find("#addButton");
  addButton.off("click");
  facultyType = $(event.currentTarget).find("#facultyType");
  unitsCap = $(event.currentTarget).find("#unitsCap");
  hoursCap = $(event.currentTarget).find("#hoursCap");
  removeValidationError([facultyType, unitsCap, hoursCap]);
  facultyType.val("");
  unitsCap.val(0);
  hoursCap.val(0);
  addButton.on("click", () => {
    fetch("/api/faculty-types", {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        facultyType: facultyType.val().toLowerCase(),
        unitsCap: unitsCap.val(),
        hoursCap: hoursCap.val(),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        removeValidationError([facultyType, unitsCap, hoursCap]);
        if (result.errors) {
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        addModal.hide();
        table.row
          .add([
            result.data.facultyType.toUpperCase(),
            result.data.unitsCap,
            result.data.hoursCap,
            `
        <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editFacultyTypeModal" data-bs-id="${result.data._id}">Edit</button>
        <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
        `,
          ])
          .draw();
        displayToast(result);
      })
      .catch((error) => {
        // displayToast(error);
      });
  });
});

$(editModal._element).on("show.bs.modal", (event) => {
  const id = event.relatedTarget.getAttribute("data-bs-id");
  const editButton = $(event.currentTarget).find("#editButton");
  editButton.off("click");
  facultyType = $(event.currentTarget).find("#facultyType");
  unitsCap = $(event.currentTarget).find("#unitsCap");
  hoursCap = $(event.currentTarget).find("#hoursCap");
  removeValidationError([facultyType, unitsCap, hoursCap]);
  fetch("/api/faculty-types/" + id)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      facultyType.val(result.data.facultyType);
      unitsCap.val(result.data.unitsCap);
      hoursCap.val(result.data.hoursCap);
      editButton.on("click", () => {
        fetch("/api/faculty-types/" + id, {
          method: "PUT",
          headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            facultyType: facultyType.val().toLowerCase(),
            unitsCap: unitsCap.val(),
            hoursCap: hoursCap.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            console.log(result);
            removeValidationError([facultyType, unitsCap, hoursCap]);
            if (result.errors) {
              displayValidationError(result.errors, event.currentTarget);
              return displayToast(result);
            }
            table.row($(event.relatedTarget).closest("tr")).data([
              result.data.facultyType.toUpperCase(),
              result.data.unitsCap,
              result.data.hoursCap,
              `
                <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editFacultyTypeModal" data-bs-id="${result.data._id}">Edit</button>
                <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
              `,
            ]);
            editModal.hide();
            return displayToast(result);
          })
          .catch((error) => {
            console.log(error);
            displayToast(error);
          });
      });
    })
    .catch((error) => {
      displayToast(error);
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
      return fetch("/api/faculty-types/" + id, {
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
      table.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
