const facultySchoolYearForm = $("#facultyForm #year");
const facultySemesterForm = $("#facultyForm #semester");
const facultySubmitButton = $("#facultyForm button");

facultySchoolYearForm.on("change", () => {
  $.ajax({
    url: "/admin/schedules/get-semester-list",
    type: "GET",
    dataType: "json",
    data: {
      school_year: facultySchoolYearForm.val(),
    },
    success: (response) => {
      response.semesters.forEach((element) => {
        facultySemesterForm.append(
          new Option(element.sem.toUpperCase() + " SEMESTER", element.sem)
        );
      });
      facultySemesterForm.attr("disabled", false);
    },
    error: (response) => {
      console.log(response.responseText);
    },
  });
});

facultySemesterForm.on('change', () => {
    facultySubmitButton.removeClass('d-none')
})
