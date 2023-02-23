const table = $("#facultyTable").DataTable({
  oLanguage: {
    sEmptyTable: `<div class="spinner-border" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`,
  },
});

const dataTable = (operation, data) => {
  console.log(data);
  const firstName = data.userInformation.firstName.toUpperCase();
  const middleName =
    data.userInformation.middleName != null
      ? data.userInformation.middleName.toUpperCase()
      : "";
  const lastName = data.userInformation.lastName.toUpperCase();
  operation([
    data.userInformation.facultyCode.toUpperCase(),
    firstName + " " + middleName + " " + lastName,
    data.userInformation.facultyType.facultyType.toUpperCase(),
    data.email,
    data.userInformation.academicQualifications.length !== 0
      ? data.userInformation.academicQualifications
          .map((element) => {
            return `
              <div>
                <h6>${element.academicQualification.academicQualification}</h6>
                <ul>
                  <li>${element.experience} year/s of experience.</li>
                  <li>${degreeEquivalent[element.degree - 1]}</li>
                  ${element.licenseIndustry
                    .map((element) => {
                      return "<li>" + element.tag.toUpperCase() + "</li>";
                    })
                    .join("")}
                </ul>
              </div>`;
          })
          .join("")
      : "N/A",
    data.userInformation.courseTaken.length !== 0
      ? data.userInformation.courseTaken
          .map((element) => {
            return element.courseCode.toUpperCase();
          })
          .join(", ")
      : "N/A",
    ` 
    <button class="btn text-light btn-sm btn-danger mb-1" onClick="deleteData('${data._id}', this)">Delete</button>
    `,
  ]).draw();
};

const csrf = $("#csrf").val();

let semester;

const degreeEquivalent = [
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral",
];

const addModal = new bootstrap.Modal($("#addModal"));
const existing = [];

fetch(`/api/curriculums/semesters/active`)
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    console.log(result.data[0]);
    semester = result.data[0].semesters._id;
    $("#cardLabel").html(
      `LIST OF ACTIVE FACULTY MEMBERS - S.Y ${
        result.data[0].schoolYear[0].year
      } (${result.data[0].semesters.sem.toUpperCase()} SEMESTER)`
    );
    return fetch(`/api/curriculums/faculty/${semester}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      existing.push(element._id);
      dataTable(table.row.add, element);
    });
    return fetch(`/api/faculty`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    $(addModal._element).on("show.bs.modal", (event) => {
      const button = $(event.currentTarget).find("#addButton");
      const faculty = $(event.currentTarget).find("#faculty").select2({
        multiple: true,
        width: "100%",
      });
      faculty.empty();
      result.data.forEach((element) => {
        if (existing.indexOf(element._id) === -1) {
          const firstName = element.userInformation.firstName.toUpperCase();
          const middleName = element.userInformation.middleName
            ? element.userInformation.middleName.toUpperCase()
            : "";
          const lastName = element.userInformation.lastName.toUpperCase();
          const name = `${firstName} ${middleName} ${lastName}`;
          faculty.append(new Option(name, element._id));
        }
      });
      button.off("click");
      button.on("click", () => {
        fetch(`/api/curriculums/faculty/${semester}`, {
          method: "POST",
          headers: { "csrf-token": csrf, "Content-Type": "application/json" },
          body: JSON.stringify({
            faculty: faculty.val(),
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            addModal.hide();
            result.data.forEach((element) => {
              existing.push(element._id);
              dataTable(table.row.add, element);
            });
          })
          .catch((error) => {
            console.log(error);
          });
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });

const deleteData = (id, element) => {
  Swal.fire({
    title: "Are you sure?",
    text: "The existing schedule of the faculty will also remove, You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    preConfirm: () => {
      return fetch(`/api/curriculums/faculty/${semester}/${id}`, {
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
      existing.splice(existing.indexOf(id), 1);
      table.row(element.closest("tr")).remove().draw();
      displayToast(result.value);
    }
  });
};
