const table = $("#levelTable").DataTable({});
const csrf = $("#csrf").val();

const tableData = (operation, data) => {
  operation([
    data.yearLevel.toUpperCase(),
    data.display.toUpperCase(),
    actionButton(data._id),
  ]).draw();
};

const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));

(async () => {
  try {
    const { data, status } = await axios.get("/api/levels");

    data.yearLevel.forEach((e) => {
      tableData(table.row.add, e);
    });
  } catch (error) {
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", (event) => {
  const yearLevel = $(event.currentTarget).find("#yearLevel");
  const display = $(event.currentTarget).find("#display");
  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      removeValidationError([display, yearLevel]);
      buttons.addClass("disabled");
      submit.html("Submitting...");

      const { data, status } = await axios.post(
        "/api/levels",
        {
          yearLevel: display.val().toLowerCase(),
          display: display.val().toLowerCase(),
        },
        { headers: { "csrf-token": csrf } }
      );
      tableData(table.row.add, data.yearLevel);
      addModal.hide();
      yearLevel.val("");
      display.val("");
      displayToast({ data, status });
    } catch (error) {
      console.log(error);
      if (error.response.status === 400) {
        displayValidationError(error.response.data.errors, event.currentTarget);
      }
      displayToast(error.response);
    } finally {
      buttons.removeClass("disabled");
      submit.html("Submit");
    }
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

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();

  try {
    if (isConfirmed) {
      const { data, status } = await axios.delete(`/api/levels/${id}`, {
        headers: { "csrf-token": csrf },
      });
      console.log(data);
      table.row(element.closest("tr")).remove().draw();
      displayToast({ status, data });
    }
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
};
