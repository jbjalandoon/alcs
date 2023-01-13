const degreeEquivalent = [
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral",
];

fetch("/api/faculty/" + userId)
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const firstName = result.data.userInformation.firstName;
    const middleName = result.data.userInformation.middleName
      ? result.data.userInformation.middleName
      : "";
    const lastName = result.data.userInformation.lastName;
    const fullName =
      firstName.toUpperCase() +
      " " +
      middleName.toUpperCase() +
      " " +
      lastName.toUpperCase();
    $("#facultyCode").html(
      result.data.userInformation.facultyCode.toUpperCase()
    );
    $("#name").html(fullName);
    $("#email").html(result.data.email.toUpperCase());
    $("#facultyType").html(
      result.data.userInformation.facultyType.facultyType.toUpperCase()
    );
    $("#academicQualifications").html(
      result.data.userInformation.academicQualifications.length !== 0
        ? result.data.userInformation.academicQualifications
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
        : "N/A"
    );
    $("#courseTaken").html(
      result.data.userInformation.courseTaken.length !== 0
        ? result.data.userInformation.courseTaken
            .map((element) => {
              return element.courseCode.toUpperCase();
            })
            .join(", ")
        : "N/A"
    );
  })
  .catch((error) => {
    console.log(error);
  });
