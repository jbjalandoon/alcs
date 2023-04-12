const table = $("#facultyTable").DataTable({});

const tableData = (operation, data) => {
  const { firstName, lastName, middleName } = data.userInformation;
  const { facultyCode, facultyType, academicQualifications, courseTaken } =
    data.facultyInformation;
  const { email } = data;
  operation([
    facultyCode.toUpperCase(),
    `${firstName} ${middleName} ${lastName}`,
    facultyType.facultyType.toUpperCase(),
    email,
    academicQualifications.length !== 0
      ? academicQualifications
          .map((element) => {
            return `
              <div>
                <h6>${element.academicQualification.toUpperCase()}</h6>
                <ul>
                  <li>${element.experience} year/s of experience.</li>
                  <li>${degreeEquivalent[element.degree - 1]}</li>
                  ${element.licenseIndustry
                    .map((element) => {
                      return "<li>" + element.toUpperCase() + "</li>";
                    })
                    .join("")}
                </ul>
              </div>`;
          })
          .join("")
      : "N/A",
    courseTaken.length !== 0
      ? courseTaken
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

(async () => {
  try {
    const { data, status } = await axios.get(
      `/api/curriculums/semesters/active`
    );
    semester = data.semester._id;
    $("#cardLabel").html(
      `S.Y. ${data.year.year.toUpperCase()} (${data.semester.sem.toUpperCase()} SEMESTER)`
    );

    const { data: facultyData } = await axios.get(
      `/api/curriculums/faculty/${semester}`
    );

    facultyData.faculty.forEach((element) => {
      existing.push(element._id);
      tableData(table.row.add, element);
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
})();

$(addModal._element).on("show.bs.modal", async (event) => {
  const submit = $(event.currentTarget).find("#addButton");
  const buttons = $(event.currentTarget).find("button");
  const form = $(event.currentTarget).find("form");
  const faculty = $(event.currentTarget).find("#faculty").select2({
    multiple: true,
    width: "100%",
  });
  faculty.empty();
  form.off("submit");
  try {
    const { data } = await axios.get(`/api/faculty`);

    const { faculty: facultyData } = data;
    facultyData.forEach((e) => {
      if (existing.indexOf(e._id) === -1) {
        const { firstName, middleName, lastName } = e.userInformation;
        const name = `${firstName} ${middleName} ${lastName}`;
        faculty.append(new Option(name.toUpperCase(), e._id));
      }
    });
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        submit.html("Submitting...");
        buttons.addClass("disabled");
        removeValidationError([faculty]);

        const { data, status } = await axios.post(
          `/api/curriculums/faculty/${semester}`,
          { faculty: faculty.val() },
          { headers: { "csrf-token": csrf } }
        );
        data.faculty.forEach((element) => {
          existing.push(element._id);
          tableData(table.row.add, element);
        });
        addModal.hide();
        displayToast({ data, status });
      } catch (error) {
        console.log(error);
        if (error.response.status === 400) {
          displayValidationError(
            error.response.data.errors,
            event.currentTarget
          );
        }
        displayToast(error.response);
      } finally {
        submit.html("Submit");
        buttons.removeClass("disabled");
      }
    });
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

const deleteData = async (id, element) => {
  const { isConfirmed } = await confirmDelete();
  try {
    if (isConfirmed) {
      const { data, status } = await axios.delete(
        `/api/curriculums/faculty/${semester}/${id}`,
        { headers: { "csrf-token": csrf } }
      );
      console.log(data);
      existing.splice(existing.indexOf(id), 1);
      table.row(element.closest("tr")).remove().draw();
      displayToast({ data, status });
    }
  } catch (error) {
    displayToast(error.response);
  }
};
