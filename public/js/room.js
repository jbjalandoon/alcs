const table = $("#roomTable").DataTable({

});
const csrf = $("#csrf").val();

const editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
let uploadModal = new bootstrap.Modal($("#uploadModal"));

fetch("/api/rooms", {
  method: "GET",
})
  .then((response) => {
    return response.json();
  })
  .then((room) => {
    room.data.forEach((element) => {
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
  })
  .catch((error) => {
    console.log(error);
    displayToast(error);
  });

$(addModal._element).on("show.bs.modal", (event) => {
  const roomName = $(event.currentTarget).find("#roomName");
  const laboratory = $(event.currentTarget).find("#laboratory");
  roomName.val("");
  laboratory.prop("checked", false);
  const button = $(event.currentTarget).find("#addButton");
  button.off("click");
  removeValidationError([roomName, laboratory]);
  button.on("click", () => {
    fetch("/api/rooms", {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: roomName.val().toLowerCase(),
        laboratory: laboratory.is(":checked"),
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
        addModal.hide();
        table.row
          .add([
            result.data.roomName.toUpperCase(),
            result.data.laboratory ? "Yes" : "No",
            `<td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
        </td>`,
          ])
          .draw();
        return displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayValidationError(error);
      });
  });
});

$(editModal._element).on("show.bs.modal", (event) => {
  const roomName = $(event.currentTarget).find("#roomName");
  const laboratory = $(event.currentTarget).find("#laboratory");
  const id = $(event.relatedTarget).attr("data-bs-id");
  const button = $(event.currentTarget).find("#editButton");
  removeValidationError([roomName, laboratory]);
  button.off("click");
  fetch("/api/rooms/" + id)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      roomName.val(result.data.roomName);
      laboratory.prop("checked", result.data.laboratory);
      button.on("click", () => {
        fetch("/api/rooms/" + id, {
          method: "PUT",
          headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: roomName.val().toLowerCase(),
            laboratory: laboratory.is(":checked"),
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
            editModal.hide();
            table
              .row($(event.relatedTarget).closest("tr"))
              .data([
                result.data.roomName.toUpperCase(),
                Boolean(result.data.laboratory) ? "Yes" : "No",
                `<td>
                  <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
                  <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
                </td>`,
              ])
              .draw();
            return displayToast(result);
          });
      });
    })
    .catch((error) => {
      console.log(error);
      displayToast(error);
    });
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
      return fetch("/api/rooms/" + id, {
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
