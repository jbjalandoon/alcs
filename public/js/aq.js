const table = $("#qualificationTable").DataTable({});
const csrf = $("#csrf").val();

const tableData = (operation, data) => {
  operation([
      data.academicQualification.toUpperCase(),
      data.licenseIndustry.length === 0
        ? "N/A"
        : "<ul>" +
          data.licenseIndustry
            .map((element) => {
              return `<li>${element.toUpperCase()}</li>`;
            })
            .join("") +
          "</ul>",
      actionButton(data._id),
    ])
    .draw();
};

(async () => {
  try {
    const { data } = await axios.get("/api/academic-qualifications");
    data.aq.forEach((element) => {
      tableData(table.row.add, element);
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
})();

let editModal = new bootstrap.Modal($("#editModal"), modalConfig);
let addModal = new bootstrap.Modal($("#addModal"), modalConfig);

$(addModal._element).on("show.bs.modal", (event) => {
  const academicQualification = $(event.currentTarget).find(
    "#academicQualification"
  );
  const licenseIndustry = $(event.currentTarget)
    .find("#licenseIndustry")
    .select2({
      multiple: true,
      tags: true,
      width: "100%",
    });
  const form = $(event.currentTarget).find("form");
  const submit = $(event.currentTarget).find("#addButton");
  const buttons = $(event.currentTarget).find("button");
  academicQualification.val("");
  licenseIndustry.empty().trigger("change");
  form.off("submit");
  form.on("submit", async (formEvent) => {
    try {
      formEvent.preventDefault();
      removeValidationError([academicQualification, licenseIndustry]);
      buttons.addClass("disabled");
      submit.html("Submitting");
      const { data, status } = await axios.post(
        "/api/academic-qualifications",
        {
          academicQualification: academicQualification.val().toLowerCase(),
          licenseIndustry: licenseIndustry.val().map((e) => e.toLowerCase()),
        },
        { headers: { "csrf-token": csrf } }
      );
      tableData(table.row.add , data.aq);
      addModal.hide();
      displayToast({ status, data });
    } catch (error) {
      console.log(error);
      console.log(error.response.data.errors);
      displayValidationError(error.response.data.errors, event.currentTarget);
      displayToast(error.response);
    } finally {
      buttons.removeClass("disabled");
      submit.html("Submit");
    }
  });
});

$(editModal._element).on("show.bs.modal", async (event) => {
  const academicQualification = $(event.currentTarget).find(
    "#academicQualification"
  );
  const licenseIndustry = $(event.currentTarget)
    .find("#licenseIndustry")
    .select2({
      tags: true,
      multiple: true,
      width: "100%",
    });
  const id = $(event.relatedTarget).attr("data-bs-id");
  const form = $(event.currentTarget).find("form");
  const buttons = $(event.currentTarget).find("buttons");
  const submit = $(event.currentTarget).find("#editButton");
  licenseIndustry.empty().trigger("change");
  try {
    const { data, status } = await axios.get(
      `/api/academic-qualifications/${id}`
    );
    academicQualification.val(data.aq.academicQualification);
    data.aq.licenseIndustry.forEach((e) =>
      licenseIndustry.append(new Option(e, e))
    );
    licenseIndustry.val(data.aq.licenseIndustry).trigger("change");

    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        buttons.addClass("disabled");
        submit.html("Submitting...");

        const { data, status } = await axios.put(
          `/api/academic-qualifications/${id}`,
          {
            academicQualification: academicQualification.val().toLowerCase(),
            licenseIndustry: licenseIndustry.val().map((e) => e.toLowerCase()),
          },
          { headers: { "csrf-token": csrf } }
        );
        // console.log(data);
        editModal.hide();
        tableData(
          table.row($(event.relatedTarget).closest("tr")).data,
          data.aq
        );
        return displayToast({ status, data });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            errors.response.data.errors,
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
    submit.addClass("disabled");
  }
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
