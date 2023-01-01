const degreeTable = $("#degreeTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`,
  },
});
const csrf = $("#csrf").val();

const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));
const addModalElement = $(addModal._element);
const editModalElement = $(editModal._element);
let degree, abbreviation, tags;
let id;
let button;
fetch("/api/degree")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      Toast.fire({ icon: "warning", title: "Something went Wrong!" });
      return;
    }
    result.data.forEach((element) => {
      degreeTable.row
        .add([
          element.degree.toUpperCase(),
          element.abbreviation.toUpperCase(),
          element.tags.map(e => e.tag).join(', ').toUpperCase(),
          `
            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${element._id}">Edit</button>
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
          `,
        ])
        .draw();
    });
    Toast.fire({ icon: "success", title: "Data successfuly loaded" });
  })
  .catch((error) => {
    console.log(error);
    Toast.fire({ icon: "warning", title: "Something Went Wrong!" });
  });

addModalElement.on("show.bs.modal", (event) => {
  fetch("/api/tags/")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      degree = addModalElement.find(".modal-body #degree");
      abbreviation = addModalElement.find(".modal-body #abbreviation");
      tags = addModalElement.find(".modal-body #tags").select2({
        width: "100%",
        tags: true,
        multiple: true,
      });
      result.data.forEach((element) => {
        tags
          .append(new Option(element.tag.toUpperCase(), element.tag))
          .trigger("change");
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

$("#add-button").on("click", () => {
  fetch("/api/degree", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      degree: degree.val(),
      abbreviation: abbreviation.val(),
      tags: tags.val(),
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return Toast.fire({ icon: "warning", title: "Something Went Wrong!" });
      }
      degreeTable.row
        .add([
          degree.val(),
          abbreviation.val(),
          tags.val().join(", ").toUpperCase(),
          "actions",
        ])
        .draw();
      degree.val("");
      abbreviation.val("");
      tags.val("");
      addModal.hide();
      Toast.fire({ icon: "success", title: "Successfully Added" });
    })
    .catch((error) => {
      console.log(error);
      return Toast.fire({ icon: "warning", title: "Something Went Wrong!" });
    });
});

editModalElement.on("show.bs.modal", (event) => {
  button = event.relatedTarget;
  id = button.getAttribute("data-bs-id");
  yearLevel = modalElement.find(".modal-body #year-level");
  editButton = modalElement.find("#edit-button");
  yearLevel.removeClass("is-invalid").val("");
  fetch("/api/levels/" + id, {
    method: "GET",
  })
    .then((response) => {
      return response.json();
    })
    .then((level) => {
      if (!level.ok) {
        Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
      }
      yearLevel.val(level.data.level);
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "warning", title: "Failed to Fetch Data" });
    });
});

$("#edit-button").on("click", () => {
  yearLevel.removeClass("is-invalid");
  fetch("/api/levels/" + id, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `year_level=${yearLevel.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        yearLevel
          .addClass(result.errors.year_level ? "is-invalid" : "")
          .siblings("div .invalid-feedback")
          .html(result.errors.year_level.msg);
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      editModal.hide();
      Toast.fire({
        icon: "success",
        title: "Successfuly Edited",
      });
      button.closest("tr").innerHTML = `
        <td>${yearLevel.val()}</td>
        <td>
          <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
          <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${id}', this)">Delete</button>
        </td>
      `;
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
      levelTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
