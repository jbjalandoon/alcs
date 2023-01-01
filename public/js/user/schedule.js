const calendarContainer = $("#calendarContainer")[0];
let semester;

const calendar = new FullCalendar.Calendar(calendarContainer, {
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
calendar.render();

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    semester = result.data[0].semesters._id;
  });
