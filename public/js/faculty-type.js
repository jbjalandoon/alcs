const table = $("#facultyTypeTable").DataTable({});
const csrf = $("#csrf").val();

const tableData = (operation, data) => {
  operation([
    data.facultyType.toUpperCase(),
    data.unitsCap,
    `
      ${actionButton(data._id)}
    `,
  ]).draw();
};

let addModal = new bootstrap.Modal($("#addFacultyTypeModal"));
let editModal = new bootstrap.Modal($("#editModal"));

(async () => {
  try {
    const { data } = await axios.get("/api/faculty-types");

    data.facultyType.forEach((e) => tableData(table.row.add, e));
  } catch (error) {
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", (event) => {
  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  const facultyType = $(event.currentTarget).find("#facultyType");
  const unitsCap = $(event.currentTarget).find("#unitsCap");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      submit.html("Submitting...");
      buttons.addClass("disabled");
      removeValidationError([facultyType, unitsCap]);
      const { data, status } = await axios.post(
        "/api/faculty-types",
        {
          facultyType: facultyType.val().toUpperCase(),
          unitsCap: unitsCap.val(),
        },
        { headers: { "csrf-token": csrf } }
      );

      tableData(table.row.add, data.facultyType);
      facultyType.val("");
      unitsCap.val(0);
      addModal.hide();
      displayToast({ status, data });
    } catch (error) {
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
  const id = event.relatedTarget.getAttribute("data-bs-id");
  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  const facultyType = $(event.currentTarget).find("#facultyType");
  const unitsCap = $(event.currentTarget).find("#unitsCap");
  try {
    const { data } = await axios.get(`/api/faculty-types/${id}`);
    facultyType.val(data.facultyType.facultyType);
    unitsCap.val(data.facultyType.unitsCap);
    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        removeValidationError([facultyType, unitsCap]);
        submit.html("Submitting...");
        buttons.addClass("disabled");
        const { data, status } = await axios.put(
          `/api/faculty-types/${id}`,
          {
            facultyType: facultyType.val().toLowerCase(),
            unitsCap: unitsCap.val(),
          },
          { headers: { "csrf-token": csrf } }
        );
        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.facultyType
        );
        facultyType.val("");
        unitsCap.val(0);
        editModal.hide();
        displayToast({ status, data });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            event.currentTarget
          );
          displayToast(error.response);
        }
      } finally {
        submit.html("Submit");
        buttons.removeClass("disabled");
      }
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();
  try {
    if (isConfirmed) {
      const { data, status } = await axios.delete(`/api/faculty-types/${id}`, {
        headers: { "csrf-token": csrf },
      });

      table.row(element.closest("tr")).remove().draw();
      displayToast({ data, status });
    }
  } catch (error) {
    displayToast(error.response);
  }
};
