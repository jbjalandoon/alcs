const table = $("#programTable").DataTable({});
const csrf = $("#csrf").val();
const uploadModal = new bootstrap.Modal($("#uploadModal"));

const tableData = (operation, data) => {
  operation([
    data.programName.toUpperCase(),
    data.programCode.toUpperCase(),
    actionButton(data._id),
  ]).draw();
};

const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));

(async () => {
  try {
    const { data, status } = await axios.get("/api/programs");
    data.programs.forEach((element) => {
      tableData(table.row.add, element);
    });
  } catch (error) {
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", (event) => {
  const programName = $(event.currentTarget).find("#programName");
  const programCode = $(event.currentTarget).find("#programCode");
  const submit = $(event.currentTarget).find("#addButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      removeValidationError([programName, programCode]);
      submit.html("Submitting...");
      buttons.addClass("disabled");

      const { data, status } = await axios.post(
        "/api/programs",
        {
          programName: programName.val().toLowerCase(),
          programCode: programCode.val().toLowerCase(),
        },
        { headers: { "csrf-token": csrf } }
      );

      tableData(table.row.add, data.program);
      addModal.hide();
      programCode.val("");
      programName.val("");
      displayToast({ status, data });
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
  const programCode = $(event.currentTarget).find("#programCode");
  const programName = $(event.currentTarget).find("#programName");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const submit = $(event.currentTarget).find("#editButton");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("button");

  try {
    const { data, status } = await axios.get(`/api/programs/${id}`);
    programCode.val(data.program.programCode);
    programName.val(data.program.programName);
    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        submit.html("Submitting...");
        buttons.addClass("disabled");
        removeValidationError([programCode, programName]);

        const { data, status } = await axios.put(
          `/api/programs/${id}`,
          {
            programCode: programCode.val().toLowerCase(),
            programName: programName.val().toLowerCase(),
          },
          {
            headers: {
              "csrf-token": csrf,
            },
          }
        );
        console.log(data.program);
        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.program
        );
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
        displayToast({ response });
      } finally {
        buttons.removeClass("disabled");
        submit.html("Submit");
      }
    });
  } catch (error) {
    submit.addClass("disabled");
    displayToast(error.response);
  }
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();

  try {
    if (isConfirmed) {
      const { status, data } = await axios.delete(`/api/programs/${id}`, {
        headers: { "csrf-token": csrf },
      });
      table.row(element.closest("tr")).remove().draw();
      displayToast({ status, data });
    }
  } catch (error) {
    displayToast(error.response);
  }
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
