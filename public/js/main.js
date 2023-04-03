const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const changePasswordModal = new bootstrap.Modal($("#changePasswordModal"));

const setAttributes = (element, attributes) => {
  Object.keys(attributes).forEach((attr) => {
    element.setAttribute(attr, attributes[attr]);
  });
};

$("#logout").on("click", (event) => {
  event.preventDefault();
  var logoutForm = $("#logoutForm");
  logoutForm.submit();
});

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const displayToast = ({ status }) => {
  let icon, message;
  switch (status) {
    case 200:
      icon = "success";
      message = "Successfully Edited";
      break;
    case 201:
      icon = "success";
      message = "Successfully Created";
      break;
    case 204:
      icon = "success";
      message = "Successfully Deleted";
      break;
    case 400:
      icon = "warning";
      message = "Validation Error";
      break;
    case 404:
      icon = "warning";
      message = "Not Found";
      break;
    case 500:
      icon = "warning";
      message = "Something went wrong";
      break;
    default:
      icon = "warning";
      message = "Something went wrong";
      break;
  }
  return Toast.fire({
    icon: icon,
    title: message,
  });
};

const removeValidationError = (elements) => {
  elements.forEach((e) => {
    e.removeClass("is-invalid");
  });
};

const displayValidationError = (errors, currentTarget) => {
  Object.keys(errors).forEach((e) => {
    $(currentTarget)
      .find("#" + e)
      .addClass("is-invalid")
      .siblings("div .invalid-feedback")
      .html(errors[e].msg);
  });
};

const actionButton = (id) => {
  return `
      <button class="btn btn-sm btn-primary mb-1" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-id="${id}">Edit</button>
      <button class="btn text-light btn-sm btn-danger mb-1" onClick="deleteData('${id}', this)">Delete</button>
    `;
};

const getActiveSemester = async () => {
  try {
    const request = await fetch(`/api/curriculums/semesters/active`);
    const result = await request.json();

    if (result.data.length === 0) {
      return null;
    }
    return {
      id: result.data[0].semesters._id,
      year: result.data[0].schoolYear[0].year,
      sem: result.data[0].semesters.sem,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

$(changePasswordModal._element).on("show.bs.modal", (event) => {
  const csrf = $("#csrf").val();
  const oldPassword = $(event.currentTarget).find("#oldPassword");
  const newPassword = $(event.currentTarget).find("#newPassword");
  const retypePassword = $(event.currentTarget).find("#retypePassword");
  const submit = $(event.currentTarget).find("#submit");
  removeValidationError([oldPassword, newPassword, retypePassword]);
  oldPassword.val("");
  newPassword.val("");
  retypePassword.val("");
  submit.on("click", () => {
    fetch("/authentication/password", {
      method: "PUT",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        oldPassword: oldPassword.val(),
        newPassword: newPassword.val(),
        retypePassword: retypePassword.val(),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        removeValidationError([oldPassword, newPassword, retypePassword]);
        if (result.errors) {
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        changePasswordModal.hide();
        Toast.fire({
          icon: "success",
          title: "Password Successfuly Changed",
        });
      })
      .catch((error) => {
        Toast.fire({
          icon: "warning",
          title: "Something Went Wrong",
        });
      });
  });
});

const loading = () => {
  Swal.fire({
    didOpen: () => {
      Swal.showLoading();
    },
    allowOutsideClick: false,
  });
};
