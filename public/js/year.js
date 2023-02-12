const table = $("#yearTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>`,
  },
});
const csrf = $("#csrf").val();

const tableData = (operation, data) => {
  operation([
    data.year,
    `
      <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${data._id}">Edit</button>
      <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${data._id}', this)">Delete</button>
     `,
  ]).draw();
};

// const formModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));

fetch("/api/years", { method: "GET" })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      tableData(table.row.add, element);
    });
    displayToast(result);
  })
  .catch((error) => {
    displayToast(error);
  });

$(addModal._element).on("show.bs.modal", (event) => {
  const year = $(event.currentTarget).find("#year");
  const button = $(event.currentTarget).find("#addButton");
  year.val("");
  button.off("click");
  button.on("click", () => {
    removeValidationError([year]);
    fetch("/api/years", {
      method: "POST",
      headers: {
        "csrf-token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        year: year.val(),
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
        tableData(table.row.add, result.data);
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
      });
  });
});

$(editModal._element).on("show.bs.modal", (event) => {
  const year = $(event.currentTarget).find("#year");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const button = $(event.relatedTarget).find("#editButton");
  button.off("click");
  fetch("/api/levels/" + id)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      removeValidationError([year]);
      year.val(result.data.year.toLowerCase());
      button.on("click", () => {
        fetch("/api/years/" + id, {
          method: "PUT",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            year: year.val(),
          }),
        })
          .then((response) => {
            return response
              .json()
              .then((result) => {
                if (result.errors) {
                  displayValidationError(result.errors, result);
                  return displayToast(result);
                }
                editModal.hide();
                tableData(
                  table.row($(event.relatedTarget).closest("tr")),
                  result.data
                );
                displayToast(result);
              })
              .catch((error) => {
                console.log(error);
                displayToast(error);
              });
          })
          .catch((error) => {
            res.json({ status: 500, data: error });
          });
      });
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
      yearTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
