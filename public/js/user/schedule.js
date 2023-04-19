const calendarContainer = $("#calendarContainer")[0];
const scheduleTable = $("#scheduleTable");
let semester, schoolYearName, semesterName;
const userId = $("#userId").val();

const viewSchedule = async (info) => {
  try {
    const id = info.event.id;
    const { data } = await axios.get(
      `/api/schedules/sections/view/${semester}/${id}`
    );
    const { schedule } = data;
    await Swal.fire({
      icon: "info",
      title: `${schedule.course.courseCode.toUpperCase()} (${schedule.program.programCode.toUpperCase()} ${
        schedule.level.display
      }-${schedule.sectionName})- ${schedule.type.toUpperCase()}`,
      text: `${days[schedule.day]} ${schedule.startTime} - ${
        schedule.endTime
      } (${schedule.room.toUpperCase()}${
        schedule.faculty
          ? "/" + schedule.faculty.facultyInformation.facultyCode.toUpperCase()
          : ""
      })`,
      width: "50%",
      showCancelButton: true,
      showDenyButton: info.event.extendedProps.current,
      showConfirmButton: false,
      denyButtonText: `Remove`,
      cancelButtonText: `Close`,
    });
  } catch (error) {
    console.error(error);
    displayToast(error.response);
  }
};

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
  eventClassNames: ["overflow-auto"],
  slotMinTime: "7:00:00",
  slotMaxTime: "22:00:00",
  validRange: {
    start: "7:00:00",
    end: "22:00:00",
  },
  eventClick: viewSchedule,

  eventContent: (info) => {
    const { course, program, section, room, level, type } =
      info.event.extendedProps;
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.justifyContent = "center";
    div.style.alignItems = "center";
    div.style.overflow = "hidden";

    // const faculty = info.event.extendedProps.faculty
    //   ? info.event.extendedProps.faculty.toUpperCase()
    //   : "";
    const courseEl = document.createElement("span");
    courseEl.innerHTML = course.toUpperCase();
    const programEl = document.createElement("span");
    programEl.innerHTML = `${program.toUpperCase()} ${level} - ${section}`;
    const roomEl = document.createElement("span");
    roomEl.innerHTML = room.toUpperCase();
    const typeEl = document.createElement("span");
    typeEl.innerHTML = type.toUpperCase();
    div.append(courseEl, programEl, roomEl, typeEl);

    let arrayOfDomNodes = [div];
    return { domNodes: arrayOfDomNodes };
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
  try {
    const { data } = await axios.get(`/api/curriculums/semesters/active`);
    semester = data.semester._id;
    schoolYearName = data.year.year;
    semesterName = data.semester.sem;
    $("#pageTitle").html(
      `S.Y. ${schoolYearName.toUpperCase()} (${semesterName.toUpperCase()} SEMESTER)`
    );

    const { data: facultySchedules } = await axios.get(
      `/api/schedules/faculty/${semester}/${userId}`
    );
    const { data: unitsCounts } = await axios.get(
      `/api/schedules/faculty/units/${semester}/${userId}`
    );
    unitsCount = unitsCounts.units;
    const hoursCount = facultySchedules.schedules
      .map((e) => e.hour)
      .reduce((a, b) => a + b, 0);

    $("#unitsCount").html(unitsCount);
    $("#hoursCount").html(hoursCount);
    facultySchedules.schedules.forEach((element) => {
      if (element.isOverload) {
        color = "#DC3545";
      } else {
        color = element.type === "lecture" ? "#007BFF" : "#3399FF";
      }
      calendar.addEvent({
        id: element._id,
        hourDuration: element.hour,
        daysOfWeek: [element.day],
        startTime: element.startTime,
        endTime: element.endTime,
        overlap: false,
        editabe: false,
        units: element.course.units,
        course: element.course.courseCode,
        type: element.type,
        color: color,
        program: element.program.programCode,
        section: element.sectionName,
        room: element.room,
        level: element.level.display,
        faculty: element.faculty,
      });
    });

    const { data: facultySchedulesGrouped } = await axios.get(
      `/api/schedules/faculty/grouped/course/${semester}/${userId}`
    );
    const tBody = scheduleTable.find("tbody");
    scheduleTable.find("tbody").empty();
    facultySchedulesGrouped.courses.forEach((element) => {
      const tRow = $("<tr></tr>");
      tRow
        .append($("<td></td>").html(element.course.courseCode.toUpperCase()))
        .append(
          $("<td></td>").html(element.course.courseDescription.toUpperCase())
        )
        .append($("<td></td>").html(element.course.units))
        .append($("<td></td>").html(element.course.lecture))
        .append($("<td></td>").html(element.course.lab))
        .append(
          $("<td></td>").html(
            "<ul>" +
              element.schedules
                .map((e) => {
                  facultyCode = e.faculty.userInformation.facultyCode;
                  return `<li>[${e.room}] ${days[e.day]} ${e.startTime} - ${
                    e.endTime
                  } (${e.program.programCode.toUpperCase()}${e.level.display}-${
                    e.sectionName
                  })</li>`;
                })
                .join("") +
              "</ul>"
          )
        );
      tBody.append(tRow);
    });
  } catch (error) {
    console.log(error);
    displayToast(error);
  }

  tableSchedules.forEach((element) => {
    const tBody = scheduleTable.find("tbody");
    const tRow = $("<tr></tr>");
    tRow
      .append($("<td></td>").html(element.course.courseCode.toUpperCase()))
      .append(
        $("<td></td>").html(element.course.courseDescription.toUpperCase())
      )
      .append($("<td></td>").html(element.course.units))
      .append($("<td></td>").html(element.course.lecture))
      .append($("<td></td>").html(element.course.lab))
      .append(
        $("<td></td>").html(
          "<ul>" +
            element.data
              .map((e) => {
                return `<li>${days[e.day]} ${e.startTime} - ${
                  e.endTime
                } (${e.program.programCode.toUpperCase()}${e.level.display}-${
                  e.sectionName
                })</li>`;
              })
              .join("") +
            "</ul>"
        )
      );
    tBody.append(tRow);
  });
})();

const downloadFacultyCalendarXLSX = async () => {
  try {
    let requestUrl, schedules, headers, title;

    requestUrl = `/api/schedules/faculty/${semester}/${userId}`;
    const { data: scheduleData } = await axios.get(requestUrl);
    schedules = scheduleData.schedules;
    const {
      facultyInformation,
      userInformation,
      _id: id,
    } = schedules[0].faculty;
    const facultyCode = facultyInformation.facultyCode;
    title = facultyCode;
    const facultyName = `${userInformation.firstName} ${userInformation.middleName} ${userInformation.lastName}`;
    const facultyID = id;
    const { data: facultyType } = await axios.get(
      `/api/faculty/type/${facultyID}`
    );
    const { data: facultyUnits } = await axios.get(
      `/api/schedules/faculty/units/${semester}/${facultyID}`
    );
    if (schedules.length !== 0)
      hoursCount = schedules.map((e) => e.hour).reduce((a, b) => a + b);
    headers = headersToDataSheets([
      facultyCode.toUpperCase(),
      facultyName.toUpperCase(),
      facultyType.facultyType.toUpperCase(),
      "Units: " + facultyUnits.units,
      "Hours: " + hoursCount,
    ]);
    const wb = XLSX.utils.book_new();
    const { data, merges, mergedCells, lectureCell, labCells, overLoadCells } =
      schedulesToDataSheets(schedules, headers.length);
    const ws = XLSX.utils.aoa_to_sheet([
      ...headers,
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
    for (let i = 0; i <= headers.length - 1; i++) {
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

    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}.xlsx`);
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
    let courses, title;
    const { data: facultySchedule } = await axios.get(
      `/api/schedules/faculty/grouped/course/${semester}/${userId}`
    );
    courses = facultySchedule.courses;
    const {
      facultyInformation,
      userInformation,
      _id: id,
    } = courses[0].schedules[0].faculty;
    const facultyCode = facultyInformation.facultyCode;
    title = facultyCode;
    const facultyName = `${userInformation.firstName} ${userInformation.middleName} ${userInformation.lastName}`;
    const facultyID = id;
    const { data: facultyType } = await axios.get(
      `/api/faculty/type/${facultyID}`
    );
    const { data: facultyUnits } = await axios.get(
      `/api/schedules/faculty/units/${semester}/${facultyID}`
    );
    const schedules = [];
    courses.forEach((e) => {
      schedules.push(...e.schedules);
    });
    const hoursCount = schedules.map((e) => e.hour).reduce((a, b) => a + b);
    headers = headersToDataSheets([
      facultyCode.toUpperCase(),
      facultyName.toUpperCase(),
      facultyType.facultyType.toUpperCase(),
      "Units: " + facultyUnits.units,
      "Hours: " + hoursCount,
    ]);

    const wb = XLSX.utils.book_new();
    const data = [];
    courses.forEach((element) => {
      data.push([
        cellData(element.course.courseCode.toUpperCase()),
        cellData(element.course.courseDescription.toUpperCase()),
        cellData(element.course.units),
        cellData(element.course.lecture),
        cellData(element.course.lab),
        cellData(
          element.schedules
            .map((element) => {
              return `${days[element.day]} ${element.startTime} - ${
                element.endTime
              } (${element.program.programCode.toUpperCase()}${
                element.level.display
              }-${element.sectionName} ${element.room}) `;
            })
            .join("\n")
        ),
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet([
      ...headers,
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
    for (let i = 0; i < headers.length; i++) {
      merges.push({
        s: { r: i, c: 0 },
        e: {
          r: i,
          c: 5,
        },
      });
    }

    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong",
    });
  }
};

const schedulesToDataSheets = (schedules, skip) => {
  const times = [];
  const data = [];
  const mergedCells = [];
  const merges = [];
  const overLoadCells = [];
  const labCells = [];
  const lectureCell = [];
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
    "P",
    "Q",
    "R",
  ];
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
      const course = element.course.courseCode.toUpperCase();
      const program = element.program.programCode.toUpperCase();
      const section = element.sectionName.toUpperCase();
      const room = element.room.toUpperCase();
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
          s: { r: i + skip + 1, c: day * 2 },
          e: {
            r: i + skip + element.hour * 2,
            c: day * 2,
          },
        });
        const mergeCell = [];
        for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
          let singleCell = `${cols[day * 2]}${j + skip}`;
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

  return { data, merges, mergedCells, lectureCell, labCells, overLoadCells };
};

const headersToDataSheets = (headers) => {
  headers.unshift(
    `SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`
  );
  return headers.map((e) => [cellHeaderText(e)]);
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
