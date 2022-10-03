let school_year;
let semester;
let program;
let year_level;
const sectionMultiSelect = $("#curriculum-form #sections").selectize({
  delimiter: ",",
  persist: false,
  create: function (input) {
    return {
      value: input,
      text: input,
    };
  },
});

const courseMultiSelect = $("#curriculum-form #courses").selectize({
  maxItems: 10,
  onChange(value) {
    $.ajax({
      url: "/admin/api/courses",
      type: "GET",
      data: {
        courses: value,
      },
      dataType: "json",
      success: function (res) {
        console.log(res);
        $("#unitCounter").html(res.totalUnits);
      },
    });
  },
});

const schoolYearForm = $("#curriculum-form #school_year");
const semesterForm = $("#curriculum-form #semester");
const programForm = $("#curriculum-form #program");
const yearLevelForm = $("#curriculum-form #year_level");

schoolYearForm.on("change", () => {
  const sectionForm = sectionMultiSelect[0].selectize;
  const courseForm = courseMultiSelect[0].selectize;
  semesterForm.val("");
  programForm.val("");
  yearLevelForm.val("");
  courseForm.disable();
  sectionForm.disable();
  sectionForm.clear();
  courseForm.clear();

  school_year = schoolYearForm.val();
  if (school_year !== "") {
    semesterForm.attr("disabled", false);
    programForm.attr("disabled", true);
    yearLevelForm.attr("disabled", true);
  } else {
    semesterForm.attr("disabled", true);
  }
});

semesterForm.on("change", () => {
  const sectionForm = sectionMultiSelect[0].selectize;
  const courseForm = courseMultiSelect[0].selectize;
  programForm.val("");
  yearLevelForm.val("");
  courseForm.disable();
  sectionForm.disable();
  sectionForm.clear();
  courseForm.clear();
  semester = $("#curriculum-form #semester").val();
  if (semester !== "") {
    programForm.attr("disabled", false);
    yearLevelForm.attr("disabled", true);
  } else {
    programForm.attr("disabled", true);
  }
});

programForm.on("change", () => {
  const sectionForm = sectionMultiSelect[0].selectize;
  const courseForm = courseMultiSelect[0].selectize;
  yearLevelForm.val("");
  courseForm.disable();
  sectionForm.disable();
  sectionForm.clear();
  courseForm.clear();
  program = programForm.val();
  if (program !== "") {
    yearLevelForm.attr("disabled", false);
  } else {
    yearLevelForm.attr("disabled", true);
  }
});

yearLevelForm.on("change", () => {
  const sectionForm = sectionMultiSelect[0].selectize;
  const courseForm = courseMultiSelect[0].selectize;
  year_level = yearLevelForm.val();
  courseForm.disable();
  sectionForm.disable();
  $.ajax({
    url: "http://localhost:3000/admin/curriculums/sections-courses",
    type: "GET",
    data: {
      school_year: school_year,
      semester: semester,
      program: program,
      year_level: year_level,
    },
    dataType: "json",
    success: (value) => {
      sectionForm.clear();
      courseForm.clear();
      courseForm.enable();
      sectionForm.enable();
      if (value.sections) {
        value.sections.forEach((element) => {
          sectionForm.createItem(element);
        });
      }

      if (value.sections) {
        courseForm.setValue(value.courses);
      }
    },
  });
});

const changeProgramTab = (value) => {
  let programTabValue = value;
  let programTabSelector = document.querySelector(
    "#" + programTabValue + "-tab"
  );
  let programTab = new coreui.Tab(programTabSelector);
  console.log(programTabValue);
  programTab.show();
};
