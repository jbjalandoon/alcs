const calendarContainer = $("#calendarContainer")[0];
const scheduleTable = $("#scheduleTable");
let semester;
const days = ["m", "t", "w", "th", "f", "s", null];
const config = {
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
  eventDidMount: (info) => {
    const titleEl = info.el.querySelector(".fc-event-title");
    const timeEl = info.el.querySelector(".fc-event-time");
    info.el.style.textAlign = "center";

    const course = info.event.extendedProps.course.toUpperCase();
    const program = info.event.extendedProps.program.toUpperCase();
    const section = info.event.extendedProps.section.toUpperCase();
    const room = info.event.extendedProps.room.toUpperCase();
    const level = info.event.extendedProps.level.toUpperCase();
    const firstName =
      info.event.extendedProps.faculty.userInformation.firstName;
    const middleName = info.event.extendedProps.faculty.userInformation
      .middleName
      ? info.event.extendedProps.faculty.userInformation.middleName
      : "";
    const lastName = info.event.extendedProps.faculty.userInformation.lastName;
    const initials = `${firstName.charAt(0)}${middleName.charAt(
      0
    )}${lastName.charAt(0)}`.toUpperCase();
    // info.setExtendedProp(
    //   "customTitle",
    //   `${course}<br>${program}${level}-${section}<br>${room}<br>${initials}`
    // );
    timeEl.innerHTML = "";
    titleEl.innerHTML = `${course}<br>${program}${level}-${section}<br>${room}<br>${initials}`;
  },
};

const calendar = new FullCalendar.Calendar(calendarContainer, config);

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    semester = result.data[0].semesters._id;
    console.log(result);
    $("#cardTitle")
      .addClass("fw-bolder")
      .html(
        `SCHEDULE - (${result.data[0].school_year[0].year.toUpperCase()} - ${result.data[0].semesters.sem.toUpperCase()} SEMESTER)`
      );
    return fetch(`/api/schedules/faculty/${semester}/${userId}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const downloadSpreadsheetButton = $("#downloadSpreadsheet");
    downloadSpreadsheetButton.off("click");
    result.data.forEach((element) => {
      calendar.addEvent({
        id: element._id,
        hourDuration: element.hour,
        daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
        startTime: element.start_time,
        endTime: element.end_time,
        overlap: false,
        editabe: false,
        course: element.course.courseCode,
        program: element.program.programCode,
        section: element.section_name,
        room: element.room.roomName,
        level: element.level.display,
        faculty: element.faculty,
      });
    });
    downloadSpreadsheetButton.removeClass("d-none");
    downloadSpreadsheetButton.on("click", () => {
      downloadSpreadsheet("weekly-schedule.xlsx", calendar.getEvents());
    });
    calendar.render();
    return fetch(`/api/schedules/faculty/grouped/${semester}/${userId}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const downloadTable = $("#downloadTable");
    downloadTable.off("click");
    downloadTable.removeClass("d-none");
    result.data.forEach((element) => {
      const tBody = scheduleTable.find("tbody");
      const tRow = $("<tr></tr>");
      tRow
        .append($("<td></td>").html(element.course.courseCode.toUpperCase()))
        .append(
          $("<td></td>").html(element.course.courseDescription.toUpperCase())
        )
        .append($("<td></td>").html(element.course.units))
        .append(
          $("<td></td>").html(
            "<ul>" +
              element.data
                .map((e) => {
                  return `<li>${e.day.toUpperCase()} ${e.start_time} - ${
                    e.end_time
                  } (${e.program.programCode.toUpperCase()}${e.level.display}${
                    e.section_name
                  })</li>`;
                })
                .join("") +
              "</ul>"
          )
        );
      tBody.append(tRow);
    });
    downloadTable.on("click", () => {
      downloadSpreadsheetTable("filename", downloadTable);
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
  const cols = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
  ];
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
        const firstName =
          element.extendedProps.faculty.userInformation.firstName;
        const middleName =
          element.extendedProps.faculty.userInformation.middleName ? element.extendedProps.faculty.userInformation.middleName : '';
        const lastName = element.extendedProps.faculty.userInformation.lastName;
        const initials = `${firstName.charAt(0)}${middleName.charAt(
          0
        )}${lastName.charAt(0)}`.toUpperCase();
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
        for (
          let j = i + 2;
          j <= i + 1 + element.extendedProps.hourDuration * 2;
          j++
        ) {
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

function downloadSpreadsheetTable(filename, table) {
  console.log(document.getElementById("downloadTable"));
  var wb = XLSX.utils.table_to_book(document.getElementById("scheduleTable"), {
    sheet: "Sheet JS",
  });
  var wbout = XLSX.write(wb, {
    bookType: "xlsx",
    bookSST: true,
    type: "binary",
  });

  saveAs(
    new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
    "test.xlsx"
  );

  // This function is used to convert the workbook data to a binary string
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
