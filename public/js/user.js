const table = $("#userTable").DataTable();

const csrf = $("#csrf").val();

const addModal = new bootstrap.Modal($("#addModal"), {
  backdrop: "static",
  keyboard: false,
});
const editModal = new bootstrap.Modal($("#editModal"), {
  backdrop: "static",
  keyboard: false,
});

const dataTable = (operation, { _id: id, email, role, userInformation }) => {
  const { firstName, middleName, lastName } = userInformation;
  operation([
    `${firstName} ${middleName} ${lastName}`.toUpperCase(),
    email,
    role.toUpperCase(),
    `
      ${actionButton(id)}
    `,
  ]).draw();
};

(async () => {
  try {
    const { data } = await axios.get("/api/users");
    data.user.forEach((element) => {
      dataTable(table.row.add, element);
    });
  } catch (error) {
    console.log(error);
  }
})();

$(addModal._element).on("show.bs.modal", (event) => {
  const firstName = $(event.currentTarget).find("#firstName");
  const middleName = $(event.currentTarget).find("#middleName");
  const lastName = $(event.currentTarget).find("#lastName");
  const email = $(event.currentTarget).find("#email");
  const form = $(event.currentTarget).find("form");
  const submit = $(event.currentTarget).find("#submit");
  const buttons = $(event.currentTarget).find("button");
  removeValidationError([firstName, middleName, lastName, email]);
  firstName.val("");
  middleName.val("");
  lastName.val("");
  email.val("");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      buttons.addClass("disabled");
      submit.html("Submitting...");
      const userInformation = {
        firstName: firstName.val().toLowerCase(),
        middleName: middleName.val().toLowerCase(),
        lastName: lastName.val().toLowerCase(),
      };
      const { data } = await axios.post(
        "/api/users",
        { role: "admin", email: email.val().toLowerCase(), ...userInformation },
        {
          headers: {
            "csrf-token": csrf,
          },
        }
      );
      dataTable(table.row.add, data.user);
      firstName.val("");
      middleName.val("");
      lastName.val("");
      email.val("");
      addModal.hide();
    } catch ({ response }) {
      const { status, data } = response;
      if (status === 400) {
        displayValidationError(data.errors, event.currentTarget);
        return;
      }
      displayToast(response);
    } finally {
      buttons.removeClass("disabled");
      submit.html("Submit");
    }
  });
});

$(editModal._element).on("show.bs.modal", async (event) => {
  const id = $(event.relatedTarget).attr("data-bs-id");
  const firstName = $(event.currentTarget).find("#firstName");
  const middleName = $(event.currentTarget).find("#middleName");
  const lastName = $(event.currentTarget).find("#lastName");
  const email = $(event.currentTarget).find("#email");
  const form = $(event.currentTarget).find("form");
  const submit = $(event.currentTarget).find("#submit");
  const buttons = $(event.currentTarget).find("button");
  try {
    buttons.addClass("disabled");
    const { data } = await axios.get(`/api/users/${id}`);
    const { userInformation, email: currentEmail } = data.user;
    firstName.val(userInformation.firstName);
    middleName.val(userInformation.middleName);
    lastName.val(userInformation.lastName);
    email.val(currentEmail);
    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();

        buttons.addClass("disabled");
        submit.html("Submitting...");
        removeValidationError([firstName, middleName, lastName, email]);
        const response = await axios.put(
          `/api/users/${id}`,
          {
            firstName: firstName.val().toLowerCase(),
            middleName: middleName.val().toLowerCase(),
            lastName: lastName.val().toLowerCase(),
            email: email.val().toLowerCase(),
          },
          {
            headers: { "csrf-token": csrf },
          }
        );
        const { data } = response;
        dataTable(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.user
        );
        editModal.hide();
        displayToast(response);
      } catch (error) {
        const { status, data } = response;
        if (status === 400) {
          displayValidationError(data.errors, event.currentTarget);
          return;
        }

        editModal.hide();
      } finally {
        buttons.removeClass("disabled");
        submit.html("Submit");
      }
    });
    buttons.removeClass("disabled");
  } catch (error) {
    submit.addClass("disabled");
    displayToast(error?.response);
  }
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();
  try {
    if (isConfirmed) {
      const response = await axios.delete(`/api/users/${id}`, {
        headers: { "csrf-token": csrf },
      });

      table.row(element.closest("tr")).remove().draw();
      displayToast(response);
    }
  } catch (error) {
    displayToast(error.response);
  }
};
