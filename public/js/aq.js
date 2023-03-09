const table = $("#qualificationTable").DataTable({

});
const csrf = $("#csrf").val();

const tableData = (tableElement, data) => {
  tableElement.row
    .add([
      data.academicQualification.toUpperCase(),
      data.licenseIndustry.length === 0
        ? "N/A"
        : "<ul>" +
          data.licenseIndustry
            .map((element) => {
              return `<li>${element.tag.toUpperCase()}</li>`;
            })
            .join("") +
          "</ul>",
      actionButton(data._id),
    ])
    .draw();
};

fetch("/api/academic-qualifications")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result) {
      return;
    }
    result.data.forEach((element) => {
      tableData(table, element);
    });
  })
  .catch((error) => {
    console.log(error);
  });

let editModal = new bootstrap.Modal($("#editModal"));
let addModal = new bootstrap.Modal($("#addModal"));

$(addModal._element).on("show.bs.modal", (event) => {
  const academicQualification = $(event.currentTarget).find("#academicQualification");
  const licenseIndustry = $(event.currentTarget).find("#licenseIndustry").select2({
    multiple: true,
    tags: true,
    width: "100%",
  });
  const button = $(event.currentTarget).find("#addButton");
  console.log(licenseIndustry);
  button.off("click");
  academicQualification.val("");
  licenseIndustry.empty().trigger("change");
  removeValidationError([academicQualification, licenseIndustry]);
  fetch("/api/tags")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.forEach((element) => {
        licenseIndustry.append(new Option(element.tag.toUpperCase(), element.tag));
      });
    })
    .catch((error) => {
      console.log(error);
      return displayToast(error);
    });
  button.on("click", () => {
    fetch("/api/academic-qualifications", {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        academicQualification: academicQualification.val().toLowerCase(),
        licenseIndustry: licenseIndustry.val().map((e) => e.toLowerCase()),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (result.errors) {
          console.log(result.errors);
          displayValidationError(result.errors, event.currentTarget);
          return displayToast(result);
        }
        addModal.hide();
        tableData(table, result.data);
        return displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        return displayToast(error);
      });
  });
});

$(editModal._element).on("show.bs.modal", (event) => {
  const academicQualification = $(event.currentTarget).find("#academicQualification");
  const licenseIndustry = $(event.currentTarget).find("#licenseIndustry").select2({
    tags: true,
    multiple: true,
    width: "100%",
  });
  const id = $(event.relatedTarget).attr("data-bs-id");
  const button = $(event.currentTarget).find("#editButton");
  button.off("click");
  licenseIndustry.empty().trigger("change");
  fetch("/api/tags")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.forEach((element) => {
        console.log(element);
        licenseIndustry.append(new Option(element.tag.toUpperCase(), element.tag));
      });
      return fetch("/api/academic-qualifications/" + id);
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      academicQualification.val(result.data.academicQualification);
      licenseIndustry.val(result.data.licenseIndustry.map((e) => e.tag)).trigger("change");
    })
    .catch((error) => {
      console.log(error);
      return displayToast(error);
    });
  button.on("click", () => {
    fetch("/api/academic-qualifications/" + id, {
      method: "PUT",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        academicQualification: academicQualification.val().toLowerCase(),
        licenseIndustry: licenseIndustry.val().map((e) => e.toLowerCase()),
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
        editModal.hide();
        table
          .row($(event.relatedTarget).closest("tr"))
          .data([
            result.data.academicQualification.toUpperCase(),
            result.data.licenseIndustry.length === 0
              ? "N/A"
              : "<ul>" +
                result.data.licenseIndustry
                  .map((element) => {
                    return `<li>${element.tag.toUpperCase()}</li>`;
                  })
                  .join("") +
                "</ul>",
            actionButton(result.data._id),
          ])
          .draw();
        return displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        return displayToast(error);
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
      return fetch("/api/academic-qualifications/" + id, {
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
  })
    .then((result) => {
      console.log(result);
      if (result.isConfirmed) {
        table.row(element.closest("tr")).remove().draw();
        Toast.fire({
          icon: "success",
          title: "Successfully Deleted",
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
};
