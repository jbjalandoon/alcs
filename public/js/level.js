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
          yearLevel: yearLevel.val().toLowerCase(),
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

$(editModal._element).on("show.bs.modal", async (event) => {
  const id = $(event.relatedTarget).attr("data-bs-id");
  const yearLevel = $(event.currentTarget).find("#yearLevel");
  const display = $(event.currentTarget).find("#display");
  const submit = $(event.currentTarget).find("#editButton");
  const buttons = $(event.currentTarget).find("button");
  const form = $(event.currentTarget).find("form");

  try {
    const { data, status } = await axios.get(`/api/levels/${id}`);

    yearLevel.val(data.yearLevel.yearLevel);
    display.val(data.yearLevel.display);

    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        buttons.addClass("disabled");
        submit.html("Submitting...");
        removeValidationError([yearLevel, display]);

        const { status, data } = await axios.put(
          `/api/levels/${id}`,
          {
            yearLevel: yearLevel.val().toUpperCase(),
            display: display.val().toUpperCase(),
          },
          {
            headers: { "csrf-token": csrf },
          }
        );

        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.yearLevel
        );
        yearLevel.val("");
        display.val("");
        editModal.hide();
        displayToast({ status, data });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            event.currentTarget
          );
        }
        displayToast(error.response);
      } finally {
        buttons.removeClass("disabled");
        submit.html("Submit");
      }
    });
  } catch (error) {
    displayToast(error.response);
  }
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
