const calendarContainer = $("#calendarContainer")[0];
const scheduleTable = $("#scheduleTable");
let semester;
const userId = $("#userId").val();
const config = {
  allDaySlot: false,
  height: "auto",
  dayHeaderFormat: { weekday: "short" },
  firstDay: 1,
  slotLabelInterval: { minutes: 30 },
  slotLabelFormat: { hour: "numeric", minute: "2-digit" },
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
  eventDidMount: (info) => {
    const titleEl = info.el.querySelector(".fc-event-title");
    const timeEl = info.el.querySelector(".fc-event-time");
    info.el.style.textAlign = "center";

    const course = info.event.extendedProps.course.toUpperCase();
    const program = info.event.extendedProps.program.toUpperCase();
    const section = info.event.extendedProps.section.toUpperCase();
    const room = info.event.extendedProps.room.toUpperCase();
    const level = info.event.extendedProps.level.toUpperCase();
    const firstName = info.event.extendedProps.faculty.userInformation.firstName;
    const middleName = info.event.extendedProps.faculty.userInformation.middleName
      ? info.event.extendedProps.faculty.userInformation.middleName
      : "";
    const lastName = info.event.extendedProps.faculty.userInformation.lastName;
    const initials = `${firstName.charAt(0)}${middleName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    // info.setExtendedProp(
    //   "customTitle",
    //   `${course}<br>${program}${level}-${section}<br>${room}<br>${initials}`
    // );
    timeEl.innerHTML = "";
    titleEl.innerHTML = `${course}<br>${program}${level}-${section}<br>${room}<br>${initials}`;
  },
};

$(".owl-carousel").owlCarousel({
  nav: true,
  items: 1,
  margin: 10,
});

const calendar = new FullCalendar.Calendar(calendarContainer, config);
calendar.render();

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    semester = result.data[0].semesters._id;
    return fetch(`/api/schedules/faculty/${semester}/${userId}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const downloadSpreadsheetButton = $("#downloadSpreadsheetCalendar");
    downloadSpreadsheetButton.off("click");
    result.data.forEach((element) => {
      calendar.addEvent({
        id: element._id,
        hourDuration: element.hour,
        daysOfWeek: [element.day],
        startTime: element.startTime,
        endTime: element.endTime,
        overlap: false,
        editabe: false,
        course: element.course.courseCode,
        program: element.program.programCode,
        section: element.sectionName,
        room: element.room.roomName,
        level: element.level.display,
        faculty: element.faculty,
      });
    });
    downloadSpreadsheetButton.removeClass("d-none");
    downloadSpreadsheetButton.on("click", () => {
      downloadSpreadsheet("calendar-view.xlsx", calendar.getEvents());
    });
    return fetch(`/api/schedules/faculty/grouped/course/${semester}/${userId}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const downloadTable = $("#downloadSpreadsheetTable");
    downloadTable.off("click");
    downloadTable.removeClass("d-none");
    scheduleTable.find("tbody").empty();
    result.data.forEach((element) => {
      const tBody = scheduleTable.find("tbody");
      const tRow = $("<tr></tr>");
      tRow
        .append($("<td></td>").html(element.course.courseCode.toUpperCase()))
        .append($("<td></td>").html(element.course.courseDescription.toUpperCase()))
        .append($("<td></td>").html(element.course.units))
        .append($("<td></td>").html(element.course.lecture))
        .append($("<td></td>").html(element.course.lab))
        .append(
          $("<td></td>").html(
            "<ul>" +
              element.data
                .map((e) => {
                  return `<li>${days[e.day]} ${e.startTime} - ${e.endTime} (${e.program.programCode.toUpperCase()}${
                    e.level.display
                  }-${e.sectionName})</li>`;
                })
                .join("") +
              "</ul>"
          )
        );
      tBody.append(tRow);
    });
    downloadTable.on("click", () => {
      downloadSpreadsheetTable(
        "table-view.xlsx",
        [result.data].map((element) => {
          return { schedule: element };
        })
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });

function downloadSpreadsheet(filename, events) {
  // Create a new Excel file
  const wb = XLSX.utils.book_new();

  // Create an array of time strings from 7:00 AM to 9:00 PM at 30 minute intervals
  const times = [];
  for (let i = 7; i < 21; i++) {
    for (let j = 0; j < 2; j++) {
      let hour = i.toString().padStart(2, "0");
      let minute = (j * 30).toString().padStart(2, "0");
      let hour2 = hour;
      let minute2 = "30";
      if (j * 30 === 30) {
        hour2 = (i + 1).toString().padStart(2, "0");
        minute2 = "00";
      }
      // if (minute.length === 1) {
      //   minute = "0" + minute;
      // }
      times.push(hour + ":" + minute + "-" + hour2 + ":" + minute2);
    }
  }

  // Create a 2D array with the time strings as the first column and the random activities at random times
  const data = [];
  const merges = [];
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
  const mergedCells = [];
  for (let i = 0; i < times.length; i++) {
    let row = [];
    let rowData = [
      cellData(times[i].split("-")[0] + " - " + times[i].split("-")[1]),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
      cellData(""),
    ];
    events.forEach((element) => {
      const eventTime =
        element.start.getHours().toString().padStart(2, "0") +
        ":" +
        element.start.getMinutes().toString().padStart(2, "0");
      if (times[i].split("-")[0] === eventTime) {
        const course = element.extendedProps.course.toUpperCase();
        const program = element.extendedProps.program.toUpperCase();
        const section = element.extendedProps.section.toUpperCase();
        const room = element.extendedProps.room.toUpperCase();
        const level = element.extendedProps.level.toUpperCase();
        const firstName = element.extendedProps.faculty.userInformation.firstName;
        const middleName = element.extendedProps.faculty.userInformation.middleName
          ? element.extendedProps.faculty.userInformation.middleName
          : "";
        const lastName = element.extendedProps.faculty.userInformation.lastName;
        const initials = `${firstName.charAt(0)}${middleName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        rowData[element.start.getDay() * 2] = {
          v: `${course}\n${program}${level}-${section}\n${room}\n${initials}`,
          t: "s",
          s: {
            alignment: {
              horizontal: "center",
              vertical: "top",
              wrapText: true,
            },
            border: {
              top: { style: "thick", color: { rgb: "#000000" } },
              bottom: { style: "thick", color: { rgb: "#000000" } },
              left: { style: "thick", color: { rgb: "#000000" } },
              right: { style: "thick", color: { rgb: "#000000" } },
            },
          },
        };
        merges.push({
          s: { r: i + 1, c: element.start.getDay() * 2 },
          e: {
            r: i + element.extendedProps.hourDuration * 2,
            c: element.start.getDay() * 2,
          },
        });
        const mergeCell = [];
        for (let j = i + 2; j <= i + 1 + element.extendedProps.hourDuration * 2; j++) {
          let singleCell = `${cols[element.start.getDay() * 2]}${j}`;
          mergeCell.push(singleCell);
        }
        mergedCells.push(mergeCell);
      }
    });
    data.push(rowData);
  }
  // Create a worksheet with the data and a header row with labels for Time and Monday through Friday
  const ws = XLSX.utils.aoa_to_sheet([
    [
      cellData("Time"),
      cellData(""),
      cellData("Monday"),
      cellData(""),
      cellData("Tuesday"),
      cellData(""),
      cellData("Wednesday"),
      cellData(""),
      cellData("Thursday"),
      cellData(""),
      cellData("Friday"),
      cellData(""),
      cellData("Saturday"),
    ],
    ...data,
  ]);
  ws["!merges"] = merges;
  mergedCells.forEach((element) => {
    element.forEach((element) => {
      ws[element].s = {
        alignment: {
          horizontal: "center",
          vertical: "top",
          wrapText: true,
        },
        border: {
          top: { style: "thick", color: { rgb: "#000000" } },
          bottom: { style: "thick", color: { rgb: "#000000" } },
          left: { style: "thick", color: { rgb: "#000000" } },
          right: { style: "thick", color: { rgb: "#000000" } },
        },
      };
    });
  });
  ws["!cols"] = [
    { wch: 20 }, // "characters"
    { wch: 3 }, // "characters"
    { wch: 20 }, // "pixels"
    { wch: 3 }, // "characters"
    { wch: 20 },
    { wch: 3 }, // "characters"
    { wch: 20 },
    { wch: 3 }, // "characters"
    { wch: 20 },
    { wch: 3 }, // "characters"
    { wch: 20 },
    { wch: 3 }, // "characters"
    { wch: 20 },
  ];
  // Merge the cells for each activity

  // Add the worksheet to the Excel file
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Write the Excel file to the filesystem
  XLSX.writeFile(wb, filename);
}

function downloadSpreadsheetTable(filename, events) {
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

  const wb = XLSX.utils.book_new();
  events.forEach((element) => {
    const data = [];
    element.schedule.forEach((element) => {
      data.push([
        cellData(element.course.courseCode.toUpperCase()),
        cellData(element.course.courseDescription.toUpperCase()),
        cellData(element.course.units),
        cellData(element.course.lecture),
        cellData(element.course.lab),
        cellData(
          element.data
            .map((element) => {
              return `${element.day} ${element.startTime} - ${
                element.endTime
              } (${element.program.programCode.toUpperCase()}${element.level.display}-${element.sectionName})`;
            })
            .join(" | ")
        ),
      ]);
    });
    let sheet;
    const ws = XLSX.utils.aoa_to_sheet([
      [
        cellData("Course Code"),
        cellData("Course"),
        cellData("Units"),
        cellData("Lecture"),
        cellData("Lab"),
        cellData("Schedule"),
      ],
      ...data,
    ]);

    ws["!cols"] = [
      { wch: 25 }, // "characters"
      { wch: 30 }, // "pixels"
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, sheet);
  });

  // Create a worksheet with the data and a header row with labels for Time and Monday through Friday

  // Merge the cells for each activity

  // Add the worksheet to the Excel file

  // Write the Excel file to the filesystem
  XLSX.writeFile(wb, filename);
}

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; ++i) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}
const cellData = (data) => {
  return {
    v: data,
    t: "s",
    s: {
      alignment: {
        horizontal: "center",
        vertical: "top",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "#000000" } },
        bottom: { style: "thin", color: { rgb: "#000000" } },
        left: { style: "thin", color: { rgb: "#000000" } },
        right: { style: "thin", color: { rgb: "#000000" } },
      },
    },
  };
};
