// Finding Schedule Form
const scheduleSchoolYearForm = $("#schedule-form #school_year");
const scheduleSemesterForm = $("#schedule-form #semester");
const scheduleProgramForm = $("#schedule-form #program");
const scheduleYearLevelForm = $("#schedule-form #year_level");
const scheduleSectionForm = $("#schedule-form #section");

const course_schedule = []
const room_schedule = []

// Assigning Schedule
let scheduleCourseForm;
let scheduleRoomForm;
let scheduleFromForm;
let scheduleToForm;
let scheduleDayForm;
let csrf;
// Buttons
const scheduleSubmitButton = $("#schedule-form #submit");
let assignSubmitButton;

let scheduleModal;

// Tables
const scheduleTable = $("#scheduleTable");

scheduleSchoolYearForm.on("change", () => {
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-semester-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
    },
    dataType: "JSON",
    success: (response) => {
      response.semesters.forEach((semester) => {
        scheduleSemesterForm.append(
          new Option(semester.sem.toUpperCase() + " SEMESTER", semester.sem)
        );
        scheduleSemesterForm.attr("disabled", false);
        scheduleSubmitButton.addClass("d-none");
      });
    },
  });
});

scheduleSemesterForm.on("change", () => {
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-program-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
      semester: scheduleSemesterForm.val(),
    },
    dataType: "json",
    success: (response) => {
      scheduleProgramForm.find("option:not(:first)").remove();
      response.programs.forEach((program) => {
        scheduleProgramForm.append(
          new Option(
            program.program.program_name.toUpperCase(),
            program.program._id
          )
        );
        scheduleYearLevelForm.val("");
        scheduleYearLevelForm.attr("disabled", true);
        scheduleProgramForm.val("");
        scheduleProgramForm.attr("disabled", false);
        scheduleSubmitButton.addClass("d-none");
      });
    },
  });
});

scheduleProgramForm.on("change", () => {
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-level-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
      semester: scheduleSemesterForm.val(),
      program: scheduleProgramForm.val(),
    },
    dataType: "json",
    success: (response) => {
      scheduleYearLevelForm.find("option:not(:first)").remove();
      response.years.forEach((year) => {
        scheduleYearLevelForm.append(
          new Option(year.year_level.level.toUpperCase(), year.year_level._id)
        );
        scheduleYearLevelForm.attr("disabled", false);
      });
    },
  });
});

scheduleYearLevelForm.on("change", () => {
  const school_year = scheduleSchoolYearForm.val();
  const semester = scheduleSemesterForm.val();
  const program = scheduleProgramForm.val();
  const year_level = scheduleYearLevelForm.val();
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-sections-list",
    type: "GET",
    data: {
      school_year: school_year,
      semester: semester,
      program: program,
      year_level: year_level,
    },
    dataType: "json",
    success: (response) => {
      scheduleSectionForm.find("option:not(:first)").remove();
      response.sections.forEach((section) => {
        scheduleSectionForm.append(
          new Option(section.section.toUpperCase(), section.section)
        );
      });
      scheduleSectionForm.attr("disabled", false);
    },
  });
});

scheduleSectionForm.on("change", () => {
  scheduleSubmitButton.removeClass("d-none");
});

scheduleSubmitButton.on("click", () => {
  const school_year = scheduleSchoolYearForm.val();
  const semester = scheduleSemesterForm.val();
  const program = scheduleProgramForm.val();
  const year_level = scheduleYearLevelForm.val();
  const section = scheduleSectionForm.val();

  $.ajax({
    url: "http://localhost:3000/admin/schedules/courses",
    type: "GET",
    dataType: "html",
    data: {
      school_year: school_year,
      semester: semester,
      program: program,
      year_level: year_level,
      section: section,
    },
    success: (response) => {
      scheduleTable.html(response);
    },
  });
});

let hour = 7;
for (let i = 1; i <= 15; i++) {
  $(".timetable tbody").append(
    "<tr height='2px'><td>" +
      hour +
      ":00</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>"
  );
  hour++;
}
