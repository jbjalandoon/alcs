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

function setAttributes(element, attributes) {
  Object.keys(attributes).forEach((attr) => {
    element.setAttribute(attr, attributes[attr]);
  });
}

$("#logout").on("click", (event) => {
  event.preventDefault();
  var logoutForm = $("#logoutForm");
  logoutForm.submit();
});


const displayToast = (result) => {
  let icon, message;
  switch (result.status) {
    case 200:
      icon = "success";
      message = "Request is Successful";
      break;
    case 201:
      icon = "success";
      message = "Successfully Created";
      break;
    case 202:
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
      message = "Internal Server Error";
      break;
    default:
      icon = "warning";
      message = "Do Something";
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
    console.log(e);
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
