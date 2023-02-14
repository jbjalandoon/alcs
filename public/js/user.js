const table = $("#userTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`,
  },
});

const csrf = $("#csrf").val();

const addModal = new bootstrap.Modal($("#addModal"));
const editModal = new bootstrap.Modal($("#editModal"));

const dataTable = (operation, data) => {
  const firstName = data.userInformation.firstName.toUpperCase();
  const middleName = data.userInformation.middleName
    ? data.userInformation.middleName.toUpperCase()
    : "";
  const lastName = data.userInformation.lastName.toUpperCase();
  operation([
    firstName + " " + middleName + " " + lastName,
    data.email,
    `
      ${actionButton(data._id)}
    `,
  ]).draw();
};

fetch("/api/users")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      dataTable(table.row.add, element);
    });
  })
  .catch((error) => {
    console.log(error);
  });

$(addModal._element).on("show.bs.modal", (event) => {
  const firstName = $(event.currentTarget).find("#firstName");
  const middleName = $(event.currentTarget).find("#middleName");
  const lastName = $(event.currentTarget).find("#lastName");
  const email = $(event.currentTarget).find("#email");
  const submit = $(event.currentTarget).find("#submit");
  removeValidationError([firstName, middleName, lastName, email]);
  firstName.val("");
  middleName.val("");
  lastName.val("");
  email.val("");
  submit.on("click", () => {
    fetch("/api/users", {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.val().toLowerCase(),
        middleName: middleName.val().toLowerCase(),
        lastName: lastName.val().toLowerCase(),
        email: email.val().toLowerCase(),
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
        dataTable(table.row.add, result.data);
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayToast(error);
      });
  });
});

$(editModal._element).on("show.bs.modal", (event) => {
  const firstName = $(event.currentTarget).find("#firstName");
  const middleName = $(event.currentTarget).find("#middleName");
  const lastName = $(event.currentTarget).find("#lastName");
  const email = $(event.currentTarget).find("#email");
  const submit = $(event.currentTarget).find("#submit");
  removeValidationError([firstName, middleName, lastName, email]);
  fetch(`/api/users/${$(event.relatedTarget).attr("data-bs-id")}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      firstName.val(result.data.userInformation.firstName);
      middleName.val(result.data.userInformation.middleName);
      lastName.val(result.data.userInformation.lastName);
      email.val(result.data.email);
      submit.on("click", () => {
        fetch(`/api/users/${$(event.relatedTarget).attr("data-bs-id")}`, {
          method: "PUT",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.val().toLowerCase(),
            middleName: middleName.val().toLowerCase(),
            lastName: lastName.val().toLowerCase(),
            email: email.val().toLowerCase(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            removeValidationError([firstName, middleName, lastName, email]);

            if (result.errors) {
              displayValidationError(result.errors, event.currentTarget);
              return displayToast(result);
            }
            editModal.hide();
            dataTable(
              table.row($(event.relatedTarget).closest("tr")).data,
              result.data
            );
            displayToast(result);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    })
    .catch((error) => {
      console.log(error);
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
      return fetch("/api/users/" + id, {
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
      displayToast(result.value);
    }
  });
};
