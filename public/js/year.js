const table = $("#yearTable").DataTable({});

const csrf = $("#csrf").val();

const tableData = (operation, data) => {
  operation([data.year, `${actionButton(data._id)}`]).draw();
};

const editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));

(async () => {
  try {
    const { data } = await axios.get("/api/years");

    data.year.forEach((e) => tableData(table.row.add, e));
  } catch (error) {
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", (event) => {
  const year = $(event.currentTarget).find("#year");
  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      submit.html("Submitting...");
      buttons.addClass("disabled");
      removeValidationError([year]);

      const { data, status } = await axios.post(
        "/api/years",
        {
          year: year.val().toLowerCase(),
        },
        { headers: { "csrf-token": csrf } }
      );

      tableData(table.row.add, data.year);
      year.val("");
      addModal.hide();
      displayToast({ data, status });
    } catch (error) {
      if (error.response.status === 400) {
        displayValidationError(error.response.data.errors, event.currentTarget);
      }
      displayToast(error.response);
    } finally {
      submit.html("Submit");
      buttons.removeClass("disabled");
    }
  });
});

$(editModal._element).on("show.bs.modal", async (event) => {
  try {
    const year = $(event.currentTarget).find("#year");
    const id = $(event.relatedTarget).attr("data-bs-id");
    const submit = $(event.currentTarget).find("#editButton");
    const buttons = $(event.currentTarget).find("button");
    const form = $(event.currentTarget).find("form");
    form.off("submit");
    try {
      const { data } = await axios.get(`/api/years/${id}`);
      submit.removeClass("disabled");
      year.val(data.year.year);
      form.on("submit", async (formEvent) => {
        formEvent.preventDefault();
        try {
          removeValidationError([year]);
          submit.html("Submitting");
          buttons.addClass("disabled");

          const { data, status } = await axios.put(
            `/api/years/${id}`,
            {
              year: year.val(),
            },
            { headers: { "csrf-token": csrf } }
          );

          tableData(
            table.row($(event.relatedTarget).closest("tr")).data,
            data.year
          );
          editModal.hide();
          displayToast({ data, status });
        } catch (error) {
          if (error.response.status === 400) {
            displayValidationError(
              error.response.data.errors,
              event.currentTarget
            );
          }
          displayToast(error.response);
        } finally {
          submit.html("Submit");
          buttons.removeClass("disabled");
        }
      });
    } catch (error) {
      submit.addClass("disabled");
      displayToast(error.response);
    }
  } catch (error) {
    console.error(error);
  }
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();

  try {
    if (isConfirmed) {
      const { data, status } = await axios.delete(`/api/years/${id}`, {
        headers: { "csrf-token": csrf },
      });
      table.row(element.closest("tr")).remove().draw();
      displayToast({ data, status });
    }
  } catch (error) {
    displayToast(error.response);
  }
};
