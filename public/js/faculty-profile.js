const calendarEl = document.getElementById("calendar");
const calendar = new FullCalendar.Calendar(calendarEl, {
  allDaySlot: false,
  hiddenDays: [0],
  height: "auto",
  dayHeaderFormat: { weekday: "long" },
  initialView: "timeGridWeek",
  headerToolbar: {
    left: "",
    right: "",
  },
  slotMinTime: "7:00:00",
  slotMaxTime: "22:00:00",
  validRange: {
    start: "7:00:00",
    end: "22:00:00",
  },
});

const degreeEquivalent = [
  "Associate's Degree",
  "Bachelors's Degree",
  "Masters's Degree",
  "Doctoral",
];

let semester;

const faculty = document.querySelector("#faculty").value;
const body = document.querySelector("#content-body");
const header = document.querySelector("#content-header");

const tab = document.querySelector("#tab");
const tabContent = document.querySelector("#tabContent");

const spinners = document.querySelectorAll(".spinner-border");

const schoolYearSelect = document.querySelector("#school-year");
const semesterSelect = document.querySelector("#semester");
const submitSchedule = document.querySelector("#submitSchedule");

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (result.data.length === 0) {
      return Toast.fire({
        title: "There is no current active semester",
        icon: "warning",
      });
    }
    semester = result.data[0].semesters._id;
    return fetch("/api/faculty/" + faculty);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    $("#facultyCode").html(
      result.data.userInformation.faculty_code.toUpperCase()
    );
    $("#facultyType").html(
      result.data.userInformation.faculty_type.toUpperCase()
    );
    $("#schedulePreference").html(
      result.data.userInformation.schedulePreference
        .map((element) => {
          return element.toUpperCase();
        })
        .join(", ")
    );
    $("#fullName").html(
      `${result.data.userInformation.first_name} ${result.data.userInformation.middle_name} ${result.data.userInformation.last_name}`
    );
    $("#email").html(result.data.email.toUpperCase());
    $("#academicQualification").html(
      result.data.userInformation.academicQualifications
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
    );
    $("#examTaken").html(
      result.data.userInformation.courseTaken.length !== 0
        ? result.data.userInformation.courseTaken
            .map((element) => {
              return element.course_code;
            })
            .join(", ")
        : "N/A"
    );
    return fetch(`/api/schedules/faculty/${semester}/${faculty}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const days = ["m", "t", "w", "th", "f", "s"];
    result.data.forEach((element) => {
      calendar.addEvent({
        id: element._id,
        title: `${element.course.course_description} (${element.program.program_code}${element.section_name}) - ${element.room.room_name}`,
        daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
        startTime: element.start_time,
        endTime: element.end_time,
        overlap: false,
        editabe: false,
      });
    });
    spinners.forEach((element) => {
      element.classList.add("d-none");
    });
    calendar.render();
    tab.classList.remove("d-none");
    tabContent.classList.remove("d-none");
  })
  .catch((error) => {
    console.log(error);
  });

$("#downloadSchedule").on("click", () => {
  const table = document.querySelector("#calendar");
  TableToExcel.convert(table);
});
