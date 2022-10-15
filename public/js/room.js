const roomTable = $("#roomTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
           </div>`,
  },
});
const csrf = $("#csrf").val();

let editModal = new bootstrap.Modal($("#editModal"));
const addModal = new bootstrap.Modal($("#addModal"));
let modalElement = $(editModal._element);
let roomName, laboratory, id, button;

fetch("/api/rooms", {
  method: "GET",
})
  .then((response) => {
    return response.json();
  })
  .then((room) => {
    if (!room.ok) {
      Toast.fire({ icon: "warning", title: "Something went wrong" });
      return;
    }
    room.data.forEach((element) => {
      roomTable.row
        .add([
          element.room_name,
          Boolean(element.laboratory) ? "Yes" : "No",
          `<td>
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
           </td>`,
        ])
        .draw();
    });
    Toast.fire({ icon: "success", title: "Loading data is successful" });
  });

$("#add-button").on("click", () => {
  roomName = $("#addForm #room-name");
  laboratory = $("#addForm #laboratory");
  roomName.removeClass("is-invalid");
  laboratory.removeClass("is-invalid");
  fetch("/api/rooms", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `room_name=${roomName.val()}&laboratory${laboratory.is(":checked")}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        roomName
          .addClass(result.errors.room_name ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.room_name.msg);
        laboratory
          .addClass(result.errors.laboratory ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.laboratory.msg);
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      addModal.hide();
      roomName.removeClass("is-invalid").val("");
      laboratory.removeClass("is-invalid");
      roomTable.row
        .add([
          result.data.room_name,
          Boolean(result.data.laboratory) ? "Yes" : "No",
          `<td>
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${result.data._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
        </td>`,
        ])
        .draw();
    })
    .catch((error) => {
      Toast.fire({ icon: "warning", title: "Something went wrong" });
    });
});

modalElement.on("show.bs.modal", (event) => {
  button = event.relatedTarget;
  id = button.getAttribute("data-bs-id");
  modalTitle = modalElement.find(".modal-title");
  roomName = modalElement.find(".modal-body #room-name");
  laboratory = modalElement.find(".modal-body #laboratory");
  editButton = modalElement.find("#edit-button");
  roomName.removeClass("is-invalid").val("");
  laboratory.removeClass("is-invalid").prop("checked", false);
  fetch("/api/rooms/" + id, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((room) => {
      if (!room.ok) {
        Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
      }
      roomName.val(room.data.room_name);
      laboratory.prop("checked", room.data.laboratory);
    });
});

$("#edit-button").on("click", () => {
  roomName.removeClass("is-invalid");
  laboratory.removeClass("is-invalid");
  fetch("/api/rooms/" + id, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `room_name=${roomName.val()}&laboratory=${laboratory.is(":checked")}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (result.errors) {
        roomName
          .addClass(result.errors.room_name ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.room_name.msg);
        return;
      }
      if (!result.ok) {
        return Toast.fire({
          icon: "warning",
          title: "Something Went Wrong!",
        });
      }
      editModal.hide();
      Toast.fire({
        icon: "success",
        title: "Successfuly Edited",
      });
      button.closest("tr").innerHTML = `
        <td>${roomName.val()}</td>
        <td>${laboratory.is(":checked") ? "Yes" : "No"}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${id}', this)">Delete</button>
        </td>
      `;
    })
    .catch((error) => {
      Toast.fire({
        icon: "warning",
        title: "Something Went Wrong!",
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
      roomTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
