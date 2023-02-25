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

const getYears = async () => {
  try {
    const yearsRequest = await fetch("/api/years", { method: "GET" });
    const yearsResponse = await yearsRequest.json();

    yearsResponse.data.forEach((element) => {
      tableData(table.row.add, element);
    });
  } catch (error) {
    console.error(error);
  }
};

const editYears = () => {
  const editModal = new bootstrap.Modal($("#editModal"));
  $(editModal._element).on("show.bs.modal", async (event) => {
    try {
      const year = $(event.currentTarget).find("#year");
      const id = $(event.relatedTarget).attr("data-bs-id");
      const button = $(event.currentTarget).find("#editButton");
      console.log(button);
      button.removeClass("disabled");
      button.off("click");
      removeValidationError([year]);

      const yearRequest = await fetch(`/api/years/${id}`);
      const yearResponse = await yearRequest.json();

      if (!yearResponse.data) {
        button.addClass("disabled");
        return Toast.fire({ icon: "warning", title: "Something Went Wrong" });
      }
      year.val(yearResponse.data.year.toLowerCase());
      button.on("click", async () => {
        try {
          const updateYearRequest = await fetch(`/api/years/${id}`, {
            method: "PUT",
            headers: { "csrf-token": csrf, "Content-Type": "application/json" },
            body: JSON.stringify({
              year: year.val(),
            }),
          });
          const updateYearResponse = await updateYearRequest.json();
          if (updateYearResponse.errors) {
            displayValidationError(updateYearResponse.errors, updateYearResponse);
            return Toast.fire({
              icon: "warning",
              title: "Validation Error",
            });
          }
          editModal.hide();
          console.log(updateYearResponse.data);
          tableData(table.row($(event.relatedTarget).closest("tr")).data, updateYearResponse.data);
          Toast.fire({ icon: "success", title: "Successfully Edited" });
        } catch (error) {
          console.error(error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  });
};

(async () => {
  getYears();
  editYears();
})();

// const formModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));

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
      table.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
