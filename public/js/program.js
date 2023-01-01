const table = $("#programTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
       </div>`,
  },
});
const csrf = $("#csrf").val();
const uploadModal = new bootstrap.Modal($("#uploadModal"));

const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));

fetch("/api/programs", {
  method: "GET",
})
  .then((response) => {
    return response.json();
  })
  .then((programs) => {
    programs.data.forEach((element) => {
      table.row
        .add([
          element.programCode.toUpperCase(),
          element.programName.toUpperCase(),
          actionButton(element._id),
        ])
        .draw();
    });
    displayToast(programs);
  })
  .catch((error) => {
    console.log(error);
    Toast.fire({
      icon: "warning",
      title: "Something Went Wrong",
    });
  });

$(addModal._element).on("show.bs.modal", (event) => {
  const programName = $(event.currentTarget).find("#programName");
  const programCode = $(event.currentTarget).find("#programCode");
  const button = $(event.currentTarget).find("#addButton");
  button.off("click");
  removeValidationError([programName, programCode]);
  programName.val("");
  programCode.val("");
  button.on("click", () => {
    fetch("/api/programs", {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        programName: programName.val().toLowerCase(),
        programCode: programCode.val().toLowerCase(),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.errors) {
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        addModal.hide();
        table.row
          .add([
            result.data.programCode.toUpperCase(),
            result.data.programName.toUpperCase(),
            actionButton(result.data._id),
          ])
          .draw();
        return displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayToast(error);
      });
  });
});

$(editModal._element).on("show.bs.modal", (event) => {
  const programCode = $(event.currentTarget).find("#programCode");
  const programName = $(event.currentTarget).find("#programName");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const button = $(event.currentTarget).find("#editButton");
  button.off("click");
  removeValidationError([programCode, programName]);
  fetch("/api/programs/" + id)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      programCode.val(result.data.programCode);
      programName.val(result.data.programName);
      button.on("click", () => {
        fetch("/api/programs/" + id, {
          method: "PUT",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            programCode: programCode.val().toLowerCase(),
            programName: programName.val().toLowerCase(),
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
            editModal.hide();
            table
              .row($(event.relatedTarget).closest("tr"))
              .data([
                result.data.programCode.toUpperCase(),
                result.data.programName.toUpperCase(),
                actionButton(result.data._id),
              ])
              .draw();
            return displayToast(result);
          })
          .catch((error) => {
            console.log(error);
            return displayToast(error);
          });
      });
    })
    .catch((error) => {
      console.log(error);
      return displayToast(error);
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
  })
    .then((result) => {
      if (result.isConfirmed) {
        table.row(element.closest("tr")).remove().draw();
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
