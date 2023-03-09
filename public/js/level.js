const table = $("#levelTable").DataTable({
});
const csrf = $("#csrf").val();

// let editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));

fetch("/api/levels")
  .then((response) => {
    return response.json();
  })
  .then((level) => {
    level.data.forEach((element) => {
      table.row
        .add([
          element.yearLevel.toUpperCase(),
          element.display.toUpperCase(),
          actionButton(element._id),
        ])
        .draw();
    });
  })
  .catch((error) => {
    console.log(error);
    displayToast(error);
  });

$(addModal._element).on("show.bs.modal", (event) => {
  const yearLevel = $(event.currentTarget).find("#yearLevel");
  const display = $(event.currentTarget).find("#display");
  const button = $(event.currentTarget).find("#addButton");
  button.off("click");
  removeValidationError([display, yearLevel]);
  yearLevel.val("");
  display.val("");
  button.on("click", () => {
    console.log(yearLevel.val());
    fetch("/api/levels", {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        yearLevel: yearLevel.val().toLowerCase(),
        display: display.val().toLowerCase(),
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
        console.log(result);
        table.row
          .add([
            result.data.yearLevel.toUpperCase(),
            result.data.display.toUpperCase(),
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
  const id = $(event.relatedTarget).attr("data-bs-id");
  const yearLevel = $(event.currentTarget).find("#yearLevel");
  const display = $(event.currentTarget).find("#display");
  const button = $(event.currentTarget).find("#editButton");
  button.off("click");
  fetch("/api/levels/" + id)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      yearLevel.val(result.data.yearLevel);
      display.val(result.data.display);
      removeValidationError([yearLevel, display]);
      button.on("click", () => {
        fetch("/api/levels/" + id, {
          method: "PUT",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            yearLevel: yearLevel.val().toLowerCase(),
            display: display.val().toLowerCase(),
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
                result.data.yearLevel.toUpperCase(),
                result.data.display.toUpperCase(),
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
    })
    .catch((error) => {
      console.log(error);
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
      table.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
