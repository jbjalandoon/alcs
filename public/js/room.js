const table = $("#roomTable").DataTable({});
const csrf = $("#csrf").val();

const tableData = (operation, data) => {
  console.log(data);
  operation([
    data.roomName.toUpperCase(),
    Boolean(data.isLaboratory) ? "Yes" : "No",
    `${actionButton(data._id)}`,
  ]).draw();
};

const editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
const uploadModal = new bootstrap.Modal($("#uploadModal"));

(async () => {
  try {
    const { data } = await axios.get("/api/rooms");
    data.room.forEach((e) => tableData(table.row.add, e));
  } catch (error) {
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", (event) => {
  const roomName = $(event.currentTarget).find("#roomName");
  const laboratory = $(event.currentTarget).find("#laboratory");
  const submit = $(event.currentTarget).find("#addButton");
  const buttons = $(event.currentTarget).find("button");
  const form = $(event.currentTarget).find("form");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      removeValidationError([roomName, laboratory]);
      submit.html("Submitting...");
      buttons.addClass("disabled");

      const { data, status } = await axios.post(
        `/api/rooms`,
        {
          roomName: roomName.val().toLowerCase(),
          isLaboratory: laboratory.is(":checked"),
        },
        { headers: { "csrf-token": csrf } }
      );

      tableData(table.row.add, data.room);
      roomName.val("");
      laboratory.prop("checked", false);
      addModal.hide();
      displayToast({ data, status });
    } catch (error) {
      console.log(error.response);
      if (error.response.status === 400) {
        displayValidationError(error.response.data.errors, event.currentTarget);
      }

      displayToast(error.response);
    } finally {
      submit.html("Submit");
      submit.removeClass("disabled");
    }
  });
});

$(editModal._element).on("show.bs.modal", async (event) => {
  const roomName = $(event.currentTarget).find("#roomName");
  const laboratory = $(event.currentTarget).find("#laboratory");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const submit = $(event.currentTarget).find("#editButton");
  const buttons = $(event.currentTarget).find("button");
  const form = $(event.currentTarget).find("form");
  try {
    removeValidationError([roomName, laboratory]);
    const { data } = await axios.get(`/api/rooms/${id}`);
    roomName.val(data.room.roomName);
    laboratory.prop("checked", data.room.laboratory);
    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        buttons.addClass("disabled");
        submit.html("Submitting...");
        removeValidationError([roomName, laboratory]);

        const { data, status } = await axios.put(
          `/api/rooms/${id}`,
          {
            roomName: roomName.val(),
            isLaboratory: laboratory.is(":checked"),
          },
          { headers: { "csrf-token": csrf } }
        );

        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.room
        );
        displayToast({ data, status });
        editModal.hide();
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

$(uploadModal._element).on("show.bs.modal", (event) => {
  const button = $(event.currentTarget).find("#uploadButton");
  const body = new FormData();
  button.off("click");
  button.on("click", () => {
    body.append(
      "spreadsheet",
      $(event.currentTarget).find("#spreadsheet")[0].files[0]
    );
    fetch("/api/rooms/upload", {
      method: "POST",
      headers: { "csrf-token": csrf },
      body: body,
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
        uploadModal.hide();
        table.rows().remove().draw();

        result.data.forEach((element) => {
          table.row
            .add([
              element.roomName.toUpperCase(),
              Boolean(element.laboratory) ? "Yes" : "No",
              `<td>
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
           </td>`,
            ])
            .draw();
        });
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayToast(error);
      });
  });
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();
  try {
    if (isConfirmed) {
      const { data, status } = await axios.delete(`/api/rooms/${id}`, {
        headers: { "csrf-token": csrf },
      });
      table.row(element.closest("tr")).remove().draw();
      displayToast({ data, status });
    }
  } catch (error) {
    displayToast(error.response);
  }
};
