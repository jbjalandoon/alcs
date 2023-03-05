const calendarContainer = $("#calendarContainer")[0];
const scheduleTable = $("#scheduleTable");
let semester, schoolYearName, semesterName;
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

(async () => {
  const activeSemester = await getActiveSemester();
  semester = activeSemester.id;
  schoolYearName = activeSemester.year;
  semesterName = activeSemester.sem;
  $("#pageTitle").html(`MY SCHEDULE - SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`);

  const calendarSchedules = await getFacultySchedules(false);
  const tableSchedules = await getFacultySchedules(true);
  const unitsCount = await getFacultyUnitsCount(userId);
  const hoursCount = calendarSchedules.map((e) => e.hour).reduce((a, b) => a + b);
  $("#unitsCount").html(unitsCount);
  $("#hoursCount").html(hoursCount);
  calendarSchedules.forEach((element) => {
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

  tableSchedules.forEach((element) => {
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
})();

const getFacultyUnitsCount = async (faculty) => {
  try {
    const unitsRequest = await fetch(`/api/schedules/faculty/units/${semester}/${userId}`);
    const units = await unitsRequest.json();
    return units.data;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const getFacultySchedules = async (grouped) => {
  try {
    const url = grouped
      ? `/api/schedules/faculty/grouped/course/${semester}/${userId}`
      : `/api/schedules/faculty/${semester}/${userId}`;
    const request = await fetch(url);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getFacultyType = async (faculty) => {
  try {
    const typeRequest = await fetch(`/api/faculty/type/${faculty}`);
    const type = await typeRequest.json();
    return type.data;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const downloadFacultyCalendarXLSX = async () => {
  try {
    let facultyCode,
      facultyName,
      facultyType,
      facultyID,
      unitsCount = 0;
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
    const wb = XLSX.utils.book_new();
    const schedules = await getFacultySchedules(false);
    const times = [];
    for (let i = 7; i < 22; i++) {
      for (let j = 0; j < 2; j++) {
        let hour = i.toString().padStart(2, "0");
        let minute = (j * 30).toString().padStart(2, "0");
        let hour2 = hour;
        let minute2 = "30";
        if (j * 30 === 30) {
          hour2 = (i + 1).toString().padStart(2, "0");
          minute2 = "00";
        }
        times.push(hour + ":" + minute + "-" + hour2 + ":" + minute2);
      }
    }
    const data = [];
    const merges = [];
    const mergedCells = [];
    const overLoadCells = [];
    const labCells = [];
    const lectureCell = [];
    for (let i = 0; i < times.length; i++) {
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
        cellData(""),
        cellData(""),
      ];
      schedules.forEach((element, index) => {
        console.log(element);
        const course = element.course.courseCode.toUpperCase();
        const program = element.program.programCode.toUpperCase();
        const section = element.sectionName.toUpperCase();
        const room = element.room.roomName.toUpperCase();
        const level = element.level.display.toUpperCase();
        const eventTime = element.startTime;
        const day = element.day === 0 ? 7 : element.day;

        if (times[i].split("-")[0] === eventTime) {
          rowData[day * 2] = {
            v: `${course}\n${program}${level}-${section}\n${room}`,
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
            s: { r: i + 7, c: day * 2 },
            e: {
              r: i + 6 + element.hour * 2,
              c: day * 2,
            },
          });
          const mergeCell = [];
          for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
            let singleCell = `${cols[day * 2]}${j + 6}`;
            mergeCell.push(singleCell);
            if (element.isOverload) {
              overLoadCells.push(singleCell);
            }
            if (element.type === "lecture" && !element.isOverload) {
              lectureCell.push(singleCell);
            }
            if (element.type === "lab" && !element.isOverload) {
              labCells.push(singleCell);
            }
          }
          mergedCells.push(mergeCell);
        }
      });
      data.push(rowData);
    }
    facultyCode = schedules[0].faculty.userInformation.facultyCode.toUpperCase();
    facultyName = `${schedules[0].faculty.userInformation.firstName} ${schedules[0].faculty.userInformation.middleName} ${schedules[0].faculty.userInformation.lastName}`;
    facultyID = schedules[0].faculty._id;
    facultyType = await getFacultyType(facultyID);
    unitsCount = await getFacultyUnitsCount(facultyID);
    const hoursCount = schedules.map((e) => e.hour).reduce((a, b) => a + b);
    const ws = XLSX.utils.aoa_to_sheet([
      [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
      [cellHeaderText(facultyCode.toUpperCase())],
      [cellHeaderText(facultyName.toUpperCase())],
      [cellHeaderText(facultyType.facultyType.toUpperCase())],
      [cellHeaderText(`${unitsCount} UNITS / ${hoursCount} HOURS`)],
      [],
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
        cellData(""),
        cellData("Sunday"),
      ],
      ...data,
    ]);
    for (let i = 0; i <= 5; i++) {
      merges.push({
        s: { r: i, c: 0 },
        e: {
          r: i,
          c: 14,
        },
      });
    }
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
          font: {
            color: { rgb: "FFFFFF" },
          },
        };
      });
    });
    lectureCell.forEach((element) => {
      ws[element].s.fill = { fgColor: { rgb: "007BFF" } };
    });
    labCells.forEach((element) => {
      ws[element].s.fill = { fgColor: { rgb: "0DCAF0" } };
    });
    overLoadCells.forEach((element) => {
      ws[element].s.fill = { fgColor: { rgb: "DC3545" } };
    });
    ws["!cols"] = [
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
      { wch: 3 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, facultyCode.toUpperCase());

    XLSX.writeFile(wb, `${facultyCode.toUpperCase()}.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went Wrong",
    });
  }
};

const downloadFacultyTableXLSX = async () => {
  try {
    let facultyID, facultyCode, facultyName, facultyUnits;
    const data = [];
    const wb = XLSX.utils.book_new();
    const schedules = await getFacultySchedules(true);
    schedules.forEach((element) => {
      data.push([
        cellData(element.course.courseCode.toUpperCase()),
        cellData(element.course.courseDescription.toUpperCase()),
        cellData(element.course.units),
        cellData(element.course.lecture),
        cellData(element.course.lab),
        cellData(
          element.data
            .map((element) => {
              return `${days[element.day]} ${element.startTime} - ${
                element.endTime
              } (${element.program.programCode.toUpperCase()}${element.level.display}-${element.sectionName} ${
                element.room.roomName
              }) `;
            })
            .join("\n")
        ),
      ]);
    });
    facultyID = userId;
    facultyCode = schedules[0].data[0].faculty.userInformation.facultyCode;
    facultyName = `${schedules[0].data[0].faculty.userInformation.firstName} ${schedules[0].data[0].faculty.userInformation.lastName}`;
    facultyUnits = await getFacultyUnitsCount(facultyID);
    const ws = XLSX.utils.aoa_to_sheet([
      [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
      [cellHeaderText(facultyCode.toUpperCase())],
      [cellHeaderText(facultyName.toUpperCase())],
      [cellHeaderText(`${facultyUnits} UNITS`)],
      [],
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
    const merges = [];
    for (let i = 0; i < 5; i++) {
      merges.push({
        s: { r: i, c: 0 },
        e: {
          r: i,
          c: 5,
        },
      });
    }

    ws["!merges"] = merges;
    ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, facultyCode.toUpperCase());
    XLSX.writeFile(wb, `${facultyCode.toUpperCase()}.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong",
    });
  }
};

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

const cellHeaderText = (data) => {
  return {
    v: data,
    t: "s",
    s: {
      alignment: {
        horizontal: "center",
        vertical: "left",
        wrapText: true,
      },
      font: { sz: 14, bold: true },
    },
  };
};
