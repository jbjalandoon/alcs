const facultyTable = $("#facultyTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
       </div>`,
  },
});

const csrf = $("#csrf").val();

const addModal = new bootstrap.Modal($("#addModal"));
let firstName, middleName, lastName, facultyCode, email, facultyType;

fetch("/api/faculty", { method: "GET" })
  .then((response) => {
    return response.json();
  })
  .then((faculty) => {
    if (!faculty.ok) {
      Toast.fire({ icon: "warning", title: "Something went wrong" });
    }
    console.log(faculty);
    faculty.data.forEach((element) => {
      facultyTable.row
        .add([
          element.userInformation.faculty_code,
          element.userInformation.first_name +
            " " +
            element.userInformation.middle_name +
            " " +
            element.userInformation.last_name,
          element.userInformation.faculty_type,
          element.email,
          ` 
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${element._id}', this)">Delete</button>
          `,
        ])
        .draw();
    });
    Toast.fire({ icon: "success", title: "Data laoding is success" });
  })
  .catch((error) => {
    console.log(error);
    Toast.fire({ icon: "warning", title: "Something went wrong" });
  });

$("#add-button").on("click", () => {
  firstName = $("#addForm #first-name");
  middleName = $("#addForm #middle-name");
  lastName = $("#addForm #last-name");
  facultyCode = $("#addForm #faculty-code");
  email = $("#addForm #email");
  facultyType = $("#addForm #faculty-type");
  firstName.removeClass("is-invalid");
  middleName.removeClass("is-invalid");
  lastName.removeClass("is-invalid");
  facultyCode.removeClass("is-invalid");
  email.removeClass("is-invalid");
  facultyType.removeClass("is-invalid");
  fetch("/api/faculty", {
    method: "POST",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `first_name=${firstName.val()}&middle_name=${middleName.val()}&last_name=${lastName.val()}&faculty_code=${facultyCode.val()}&faculty_type=${facultyType.val()}&email=${email.val()}`,
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        if (result.errors) {
          firstName
            .addClass(result.errors.first_name ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(result.errors.first_name ? result.errors.first_name.msg : "");
          middleName
            .addClass(result.errors.middle_name ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(
              result.errors.middle_name ? result.errors.middle_name.msg : ""
            );
          lastName
            .addClass(result.errors.last_name ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(result.errors.last_name ? result.errors.last_name.msg : "");
          facultyCode
            .addClass(result.errors.faculty_code ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(
              result.errors.faculty_code ? result.errors.faculty_code.msg : ""
            );
          email
            .addClass(result.errors.email ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(result.errors.email ? result.errors.email.msg : "");
          facultyType
            .addClass(result.errors.faculty_type ? "is-invalid" : "")
            .siblings("div .invalid-feedback")
            .html(
              result.errors.faculty_type ? result.errors.faculty_type.msg : ""
            );
        }
        Toast.fire({ icon: "warning", title: "Something went wrong" });
        return;
      }
      addModal.hide();
      firstName.removeClass("is-invalid").val("");
      middleName.removeClass("is-invalid").val("");
      lastName.removeClass("is-invalid").val("");
      facultyCode.removeClass("is-invalid").val("");
      email.removeClass("is-invalid").val("");
      facultyType.removeClass("is-invalid").val("");

      facultyTable.row
        .add([
          result.data.userInformation.faculty_code,
          result.data.userInformation.first_name +
            " " +
            result.data.userInformation.middle_name +
            " " +
            result.data.userInformation.last_name,
          result.data.userInformation.faculty_type,
          result.data.email,
          ` 
            <button class="btn text-light btn-sm btn-danger" onClick="deleteData('${result.data._id}', this)">Delete</button>
          `,
        ])
        .draw();
      Toast.fire({ icon: "success", title: "Successfuly added new faculty" });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "warning", title: "Something went wrong" });
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
      return fetch("/api/faculty/" + id, {
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
      facultyTable.row(element.closest("tr")).remove().draw();
      Toast.fire({
        icon: "success",
        title: "Successfully Deleted",
      });
    }
  });
};
