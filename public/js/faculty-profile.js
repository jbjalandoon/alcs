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

const faculty = document.querySelector("#faculty").value;
const body = document.querySelector("#content-body");
const header = document.querySelector("#content-header");

const tab = document.querySelector("#tab");
const tabContent = document.querySelector("#tabContent");

const spinners = document.querySelectorAll(".spinner-border");

const schoolYearSelect = document.querySelector("#school-year");
const semesterSelect = document.querySelector("#semester");
const submitSchedule = document.querySelector("#submitSchedule");

fetch("/api/curriculums/school-year")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      schoolYearSelect.append(
        new Option(element.school_year.year.toUpperCase(), element.school_year._id)
      );
    });
    console.log(result);
  })
  .catch((error) => {
    console.log(error);
  });

schoolYearSelect.addEventListener("change", (event) => {
  console.log(schoolYearSelect.value)
  semesterSelect.removeAttribute("disabled");
  fetch("/api/curriculums/semesters/" + schoolYearSelect.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      result.data.forEach(element => {
        semesterSelect.append(new Option((element.sem + ' semester').toUpperCase(), element._id))
      })
    })
    .catch((error) => {
      console.log(error);
    });
});

semesterSelect.addEventListener('change', (event) => {
  submitSchedule.classList.remove('disabled')
})

submitSchedule.addEventListener('click', (event) => {
  fetch(`/api/schedules/faculty/${semesterSelect.value}/${faculty}` )
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
    calendar.render()
    tab.classList.remove("d-none");
    tabContent.classList.remove("d-none");
  })
  .catch((error) => {
    console.log(error);
  });
})

