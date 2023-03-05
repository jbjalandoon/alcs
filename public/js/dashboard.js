const csrf = $("#csrf").val();

const config = {
  allDaySlot: false,
  dayHeaderFormat: { weekday: "short" },
  firstDay: 1,
  slotLabelInterval: { minutes: 30 },
  slotLabelFormat: { hour: "numeric", minute: "2-digit" },
  height: "auto",
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
    const facultyCode = info.event.extendedProps.faculty.toUpperCase();
    // info.setExtendedProp(
    //   "customTitle",
    //   `${course}<br>${program}${level}-${section}<br>${room}<br>${initials}`
    // );
    timeEl.innerHTML = "";
    titleEl.innerHTML = `${course}<br>${program}${level}-${section}<br>${room}<br>${facultyCode}`;
  },
};

const spinner = $("#spinner");
const content = $("#content");
const facultyView = $("#facultyView").select2({ width: "100%" });
const roomView = $("#roomView").select2({ width: "100%" });
const programView = $("#programView");
const yearView = $("#yearView");
const sectionView = $("#sectionView");

const facultyCalendar = new FullCalendar.Calendar(document.querySelector("#facultyCalendar"), config);
const roomCalendar = new FullCalendar.Calendar(document.querySelector("#roomCalendar"), config);
const sectionCalendar = new FullCalendar.Calendar(document.querySelector("#sectionCalendar"), config);
let semester, activeYear, activeSemester;
let schoolYearName, semesterName;
let activeFaculty, activeRoom, scheduleWithoutFaculty, scheduleWithoutTimeslot;

const triggerTabList = document.querySelectorAll("#myTab button");
triggerTabList.forEach((triggerEl) => {
  const tabTrigger = new bootstrap.Tab(triggerEl);

  triggerEl.addEventListener("click", (event) => {
    event.preventDefault();
    tabTrigger.show();
    facultyCalendar.render();
    roomCalendar.render();
    sectionCalendar.render();
  });
});

const addModal = new bootstrap.Modal($("#addModal"));
const facultyModal = new bootstrap.Modal($("#activeFacultyModal"));
const activeFacultyCard = $("#activeFacultyCard");

(async () => {
  const activeSemester = await getActiveSemester();
  semester = activeSemester.id;
  schoolYearName = activeSemester.year;
  semesterName = activeSemester.sem;

  $("#contentHeader").html(`Dasboard (SY ${schoolYearName} - ${semesterName.toUpperCase()} SEMESTER)`);
  const unassignedScheduleCount = await getUnassignedScheduleCount(semester);
  const unloadedScheduleCount = await getUnloadedScheduleCount(semester);
  const activeFaculty = await getActiveFaculty(semester);
  const activeRoom = await getActiveRoom(semester);

  if (activeFaculty.length !== 0) {
    activeFaculty.forEach((element) => {
      const information = element.userInformation;
      facultyView.append(
        new Option(information.firstName.toUpperCase() + " " + information.lastName.toUpperCase(), element._id)
      );
    });

    facultyView.on("change", renderFacultyCalendar);
    facultyView.on("change", renderFacultyTable);
    facultyView.trigger("change");
  } else {
    facultyView.attr("disabled", true);
  }
  if (activeRoom.length !== 0) {
    activeRoom.forEach((element) => {
      roomView.append(new Option(element.room.roomName.toUpperCase(), element._id));
    });
    roomView.on("change", renderRoomCalendar);
    roomView.trigger("change");
  } else {
    roomView.attr("disabled", true);
    roomCalendar.render();
  }

  renderSectionForm();
  sectionView.on("change", renderSectionCalendar);
  sectionView.on("change", renderSectionTable);
  $("#activeFaculty").html(activeFaculty.length);
  $("#activeRoom").html(activeRoom.length);
  $("#unloadedSchedules").html(unloadedScheduleCount);
  $("#unassignedSchedule").html(unassignedScheduleCount);

  $(".owl-carousel").owlCarousel({
    nav: true,
    items: 1,
    margin: 10,
  });

  spinner.addClass("d-none");
  content.removeClass("d-none");
})();

activeFacultyCard.on("click", (event) => {
  facultyModal.show();
});

$(facultyModal._element).on("show.bs.modal", async (event) => {
  const facultyRequest = await fetch(`/api/curriculums/faculty/${semester}`);
  const faculty = await facultyRequest.json();
  const table = $(event.currentTarget).find("table");
  table.find("tbody").empty();
  faculty.data.sort((a, b) => {
    if (a.userInformation.facultyType.facultyType > b.userInformation.facultyType.facultyType) {
      return -1;
    }

    if (a.userInformation.facultyType.facultyType < b.userInformation.facultyType.facultyType) {
      return 1;
    }

    return 0;
  });
  faculty.data.forEach(async (element) => {
    const faculty = element.userInformation;
    table.find("tbody").append(`
      <tr>
        <td>${faculty.facultyCode.toUpperCase()}</td>
        <td>${faculty.firstName.toUpperCase()} ${faculty.lastName.toUpperCase()}</td>
        <td>${faculty.facultyType.facultyType.toUpperCase()}</td>
        <td>${await getFacultyUnitsCount(element._id)}</td>
      </tr>
    `);
  });
});

const getActiveFaculty = async () => {
  try {
    const request = await fetch(`/api/curriculums/faculty/${semester}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getActiveRoom = async () => {
  try {
    const request = await fetch(`/api/curriculums/room/${semester}`);
    const response = await request.json();

    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getUnloadedScheduleCount = async () => {
  try {
    const request = await fetch(`/api/dashboard/analytics/unloaded-schedule/${semester}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const getUnassignedScheduleCount = async () => {
  try {
    const request = await fetch(`/api/dashboard/analytics/unassigned-schedule/${semester}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const getFacultySchedules = async (grouped) => {
  try {
    const url = grouped
      ? `/api/schedules/faculty/grouped/course/${semester}/${facultyView.val()}`
      : `/api/schedules/faculty/${semester}/${facultyView.val()}`;
    const request = await fetch(url);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getRoomSchedules = async () => {
  try {
    const request = await fetch(`/api/schedules/room/${semester}/${roomView.val()}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const renderFacultyCalendar = async () => {
  try {
    const facultySchedules = await getFacultySchedules(false);
    const facultyType = await getFacultyType(facultyView.val());
    $("#facultyUnits").html(await getFacultyUnitsCount(facultyView.val()));
    if (facultySchedules.length !== 0)
      $("#facultyHours").html(facultySchedules.map((e) => e.hour).reduce((a, b) => a + b));
    $("#facultyTypes").html(facultyType.facultyType.toUpperCase());
    facultyCalendar.getEvents().forEach((element) => {
      element.remove();
    });
    facultySchedules.forEach((element) => {
      let color;
      if (element.isOverload) {
        color = "#DC3545";
      } else {
        color = element.type === "lecture" ? "#007BFF" : "#0DCAF0";
      }
      facultyCalendar.addEvent({
        scheduleID: element._id,
        hourDuration: element.hour,
        daysOfWeek: [element.day],
        startTime: element.startTime,
        endTime: element.endTime,
        courseType: element.type,
        overlap: false,
        durationEditable: false,
        color: color,
        startEditable: false,
        course: element.course.courseCode,
        program: element.program.programCode,
        faculty: element.faculty ? element.faculty.userInformation.facultyCode : "",
        section: element.sectionName,
        room: element.room.roomName,
        level: element.level.display,
      });
      facultyCode = element.faculty.userInformation.facultyCode;
    });
    facultyCalendar.render();
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong in faculty calendar",
    });
    facultyCalendar.render();
  }
};

const renderFacultyTable = async () => {
  try {
    const facultySchedules = await getFacultySchedules(semester, true);
    const facultyScheduleTable = $("#facultyScheduleTable");
    const tBody = facultyScheduleTable.find("tbody");
    facultyScheduleTable.find("tbody").empty();
    let facultyCode;
    facultySchedules.forEach((element) => {
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
                  facultyCode = e.faculty.userInformation.facultyCode;
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
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong in faculty table",
    });
  }
};

const renderRoomCalendar = async () => {
  try {
    const roomSchedules = await getRoomSchedules(semester);
    roomCalendar.getEvents().forEach((element) => {
      element.remove();
    });

    roomSchedules.forEach((element) => {
      roomCalendar.addEvent({
        scheduleID: element._id,
        hourDuration: element.hour,
        daysOfWeek: [element.day],
        startTime: element.startTime,
        endTime: element.endTime,
        courseType: element.type,
        overlap: false,
        durationEditable: false,
        color: "#007BFF",
        startEditable: false,
        course: element.course.courseCode,
        program: element.program.programCode,
        faculty: element.faculty ? element.faculty.userInformation.facultyCode : "",
        section: element.sectionName,
        room: element.room.roomName,
        level: element.level.display,
      });
    });

    roomCalendar.render();
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong in room calendar",
    });
  }
};

const getPrograms = async (semester) => {
  try {
    const request = await fetch(`/api/curriculums/programs/${semester}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getYearLevels = async (program) => {
  try {
    const request = await fetch(`/api/curriculums/levels/${program}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getSections = async (yearLevel) => {
  try {
    const request = await fetch(`/api/curriculums/sections/${yearLevel}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getSectionsTotalUnits = async (section) => {
  try {
    const sectionUnitsRequest = await fetch(`/api/curriculums/sections/units/${section}`);
    const sectionUnits = await sectionUnitsRequest.json();
    return sectionUnits.data[0].totalUnits;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const renderSectionForm = async () => {
  const programs = await getPrograms(semester);
  programs.forEach((element) => {
    programView.append(new Option(element.program.programCode.toUpperCase(), element._id));
  });

  programView.on("change", async () => {
    const yearLevels = await getYearLevels(programView.val());
    yearView.empty();
    if (yearLevels.length === 0) {
      yearView.attr("disabled", true);
      sectionView.attr("disabled", true);
      return Toast.fire({ icon: "warning", title: "Year Level is empty" });
    }
    yearView.attr("disabled", false);
    sectionView.attr("disabled", false);
    yearLevels.forEach((element) => {
      yearView.append(new Option(element.level.display.toUpperCase(), element._id));
    });
    yearView.trigger("change");
  });
  programView.trigger("change");

  yearView.on("change", async () => {
    const sections = await getSections(yearView.val());
    sectionCalendar.getEvents().forEach((element) => {
      element.remove();
    });
    sectionView.empty();
    if (sections.length === 0) {
      sectionView.attr("disabled", true);
      return Toast.fire({ icon: "warning", title: "Section is empty" });
    }
    sectionView.attr("disabled", false);
    sections.forEach((element) => {
      sectionView.append(new Option(element.section.toUpperCase(), element._id));
    });
    sectionView.trigger("change");
  });
};

const getSectionSchedules = async (grouped) => {
  try {
    const url = grouped
      ? `/api/schedules/section/grouped/course/${semester}/${sectionView.val()}`
      : `/api/schedules/sections/${sectionView.val()}`;
    const request = await fetch(url);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const renderSectionCalendar = async () => {
  try {
    const sectionSchedules = await getSectionSchedules(false);
    sectionCalendar.getEvents().forEach((element) => {
      element.remove();
    });
    sectionSchedules.forEach((element) => {
      element.schedules.forEach((schedule) => {
        sectionCalendar.addEvent({
          scheduleID: schedule._id,
          hourDuration: schedule.hour,
          daysOfWeek: [schedule.day],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          courseType: schedule.type,
          overlap: false,
          durationEditable: false,
          color: "#007BFF",
          textColor: "white",
          startEditable: false,
          course: element.course.courseCode,
          program: element.program.programCode,
          faculty: element.faculty ? element.faculty.userInformation.facultyCode : "",
          section: element.sectionName,
          room: schedule.room.roomName,
          level: element.yearLevel.display,
        });
      });
    });
    sectionCalendar.render();
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong in faculty calendar",
    });
  }
};

const renderSectionTable = async () => {
  try {
    const sectionSchedules = await getSectionSchedules(true);
    const sectionScheduleTable = $("#sectionScheduleTable");
    const tBody = sectionScheduleTable.find("tbody");
    tBody.empty();
    sectionSchedules.forEach((element) => {
      const tRow = $("<tr></tr>");
      tRow
        .append($("<td></td>").html(element.course.courseCode.toUpperCase()))
        .append($("<td></td>").html(element.course.courseDescription.toUpperCase()))
        .append($("<td></td>").html(element.course.units))
        .append($("<td></td>").html(element.course.lecture))
        .append($("<td></td>").html(element.course.lab))
        .append(
          $("<td></td>").html(
            element.data[0].faculty
              ? `${element.data[0].faculty.userInformation.firstName.toUpperCase()} ${element.data[0].faculty.userInformation.lastName.toUpperCase()}`
              : "NA"
          )
        )
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
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong in section table",
    });
  }
};

const getFacultyUnitsCount = async (faculty) => {
  try {
    const unitsRequest = await fetch(`/api/schedules/faculty/units/${semester}/${faculty}`);
    const units = await unitsRequest.json();
    return units.data;
  } catch (error) {
    console.error(error);
    return 0;
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

$(addModal._element).on("show.bs.modal", (event) => {
  if (activeYear) activeYear.off("change");
  if (activeSemester) activeSemester.off("change");
  activeYear = $(event.currentTarget).find("#year");
  activeSemester = $(event.currentTarget).find("#semester");
  activeYear.empty();
  activeSemester.empty();
  activeSemester.append(
    $("<option>--Select Semester--</option>").attr({
      selected: true,
      disabled: true,
    })
  );
  fetch("/api/curriculums/school-year")
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      activeYear.off("change");
      activeYear.append(
        $("<option>--Select Year--</option>").attr({
          selected: true,
          disabled: true,
        })
      );
      result.data.forEach((element) => {
        activeYear.append(new Option(element.schoolYear.toUpperCase(), element._id));
      });
      activeYear.on("change", (event) => {
        fetch("/api/curriculums/semesters/" + activeYear.val())
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            $("#addButton").addClass("disabled");
            activeSemester.empty();
            activeSemester.append(
              $("<option>--Select Semester--</option>").attr({
                selected: true,
                disabled: true,
              })
            );
            result.data.forEach((element) => {
              activeSemester.append(new Option(element.sem.toUpperCase(), element._id));
            });
            activeSemester.removeAttr("disabled");
          })
          .catch((error) => {
            console.error(error);
          });
      });
      activeSemester.on("change", (event) => {
        $("#addButton").removeClass("disabled");
      });
    })
    .catch((error) => {
      console.error(error);
    });
});

$("#addButton").on("click", () => {
  fetch(`/api/curriculums/semesters/active/${activeSemester.val()}`, {
    method: "PUT",
    headers: { "csrf-token": csrf, "Content-Type": "application/json" },
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result) {
        return;
      }
      // addModal.hide();
      window.location.reload();
      Toast.fire({
        icon: "success",
        title: "Successfully Set an Active Semester",
      });
    })
    .then((error) => {
      console.error(error);
    });
});

function downloadSpreadsheet(filename, events, type) {
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

  const wb = XLSX.utils.book_new();
  events.forEach((element) => {
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
    let sheet;
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
      ];
      element.forEach((element) => {
        const eventTime = element.startTime;
        if (times[i].split("-")[0] === eventTime) {
          const course = element.course.courseCode.toUpperCase();
          const program = element.program.programCode.toUpperCase();
          const section = element.sectionName.toUpperCase();
          const room = element.room.roomName.toUpperCase();
          const level = element.level.display.toUpperCase();
          const initials = element.faculty ? element.faculty.userInformation.facultyCode.toUpperCase() : "";
          const day = element.day === 0 ? 7 : element.day;

          rowData[day * 2] = {
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
            s: { r: i + 1, c: day * 2 },
            e: {
              r: i + element.hour * 2,
              c: day * 2,
            },
          });
          const mergeCell = [];
          for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
            let singleCell = `${cols[day * 2]}${j}`;
            mergeCell.push(singleCell);
          }
          mergedCells.push(mergeCell);
        }
      });
      data.push(rowData);
    }
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
    XLSX.utils.book_append_sheet(wb, ws, sheet);
  });
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

    ws["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, sheet);
  });
  XLSX.writeFile(wb, filename);
}

const downloadFacultyCalendarXLSX = async () => {
  try {
    let facultyCode,
      facultyName,
      facultyType,
      facultyID,
      unitsCount = 0,
      hoursCount = 0;
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
    if (schedules.length !== 0) hoursCount = schedules.map((e) => e.hour).reduce((a, b) => a + b);

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

const downloadAllFacultyCalendarXLSX = async () => {
  try {
    let facultyCode,
      facultyName,
      facultyID,
      facultyType,
      unitsCount = 0;
    hoursCount = 0;
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
    const wb = XLSX.utils.book_new();
    const facultySchedulesRequest = await fetch(`/api/schedules/faculty/${semester}`);
    const facultySchedules = await facultySchedulesRequest.json();
    for (let i = 0; i < facultySchedules.data.length; i++) {
      hoursCount = 0;
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
      const labCells = [];
      const lectureCell = [];
      const overLoadCells = [];
      for (let time = 0; time < times.length; time++) {
        let rowData = [
          cellData(times[time].split("-")[0] + " - " + times[time].split("-")[1]),
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
        facultySchedules.data[i].data.forEach((element, index) => {
          const course = element.course.courseCode.toUpperCase();
          const program = element.program.programCode.toUpperCase();
          const section = element.sectionName.toUpperCase();
          const room = element.room.roomName.toUpperCase();
          const level = element.level.display.toUpperCase();
          const eventTime = element.startTime;
          const day = element.day === 0 ? 7 : element.day;
          if (times[time].split("-")[0] === eventTime) {
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
              s: { r: time + 7, c: day * 2 },
              e: {
                r: time + 6 + element.hour * 2,
                c: day * 2,
              },
            });
            const mergeCell = [];
            for (let j = time + 2; j <= time + 1 + element.hour * 2; j++) {
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
      facultyCode = facultySchedules.data[i].data[0].faculty.userInformation.facultyCode.toUpperCase();
      facultyID = facultySchedules.data[i].data[0].faculty._id;
      facultyName = `${facultySchedules.data[i].data[0].faculty.userInformation.firstName} ${facultySchedules.data[i].data[0].faculty.userInformation.middleName} ${facultySchedules.data[i].data[0].faculty.userInformation.lastName}`;
      facultyType = await getFacultyType(facultyID);
      if (facultySchedules.data[i].data.length !== 0)
        hoursCount = facultySchedules.data[i].data.map((e) => e.hour).reduce((a, b) => a + b);
      unitsCount = await getFacultyUnitsCount(facultyID);
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
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, facultyCode.toUpperCase());
    }
    XLSX.writeFile(wb, `faculty.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Something went wrong" });
  }
};

const downloadRoomCalendarXLSX = async () => {
  try {
    const room = roomView.find(":selected").text();
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
    const wb = XLSX.utils.book_new();
    const schedules = await getRoomSchedules();
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
        const level = element.level.display.toUpperCase();
        const initials = element.faculty ? element.faculty.userInformation.facultyCode.toUpperCase() : "";
        const eventTime = element.startTime;
        const day = element.day === 0 ? 7 : element.day;

        if (times[i].split("-")[0] === eventTime) {
          rowData[day * 2] = {
            v: `${course}\n${program}${level}-${section}\n${initials}`,
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
            s: { r: i + 4, c: day * 2 },
            e: {
              r: i + 3 + element.hour * 2,
              c: day * 2,
            },
          });
          const mergeCell = [];
          for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
            let singleCell = `${cols[day * 2]}${j + 3}`;
            mergeCell.push(singleCell);
          }
          mergedCells.push(mergeCell);
        }
      });
      data.push(rowData);
    }
    const ws = XLSX.utils.aoa_to_sheet([
      [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
      [cellHeaderText(room)],
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
    for (let i = 0; i < 2; i++) {
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
          fill: { fgColor: { rgb: "007BFF" } },
          font: {
            color: { rgb: "FFFFFF" },
          },
        };
      });
    });
    ws["!cols"] = [
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, room);

    XLSX.writeFile(wb, `${room} - SCHEDULES.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Something went wrong" });
  }
};

const downloadAllRoomCalendarXLSX = async () => {
  try {
    let roomName;
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
    const wb = XLSX.utils.book_new();
    const roomSchedulesRequest = await fetch(`/api/schedules/room/${semester}`);
    const roomSchedules = await roomSchedulesRequest.json();
    roomSchedules.data.forEach((element) => {
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
        element.data.forEach((element, index) => {
          roomName = element.room.roomName.toUpperCase();
          const course = element.course.courseCode.toUpperCase();
          const program = element.program.programCode.toUpperCase();
          const section = element.sectionName.toUpperCase();
          const level = element.level.display.toUpperCase();
          const initials = element.faculty ? element.faculty.userInformation.facultyCode.toUpperCase() : "";
          const eventTime = element.startTime;
          const day = element.day === 0 ? 7 : element.day;

          if (times[i].split("-")[0] === eventTime) {
            rowData[day * 2] = {
              v: `${course}\n${program}${level}-${section}\n${initials}`,
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
              s: { r: i + 4, c: day * 2 },
              e: {
                r: i + 3 + element.hour * 2,
                c: day * 2,
              },
            });
            const mergeCell = [];
            for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
              let singleCell = `${cols[day * 2]}${j + 3}`;
              mergeCell.push(singleCell);
            }
            mergedCells.push(mergeCell);
          }
        });
        data.push(rowData);
      }
      const ws = XLSX.utils.aoa_to_sheet([
        [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
        [cellHeaderText(roomName.toUpperCase())],
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
      for (let i = 0; i <= 2; i++) {
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
            fill: { fgColor: { rgb: "007BFF" } },
            font: {
              color: { rgb: "FFFFFF" },
            },
          };
        });
      });
      ws["!cols"] = [
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, roomName.toUpperCase());
    });

    XLSX.writeFile(wb, `ROOMS SCHEDULES.xlsx`);
  } catch (error) {}
};

const downloadSectionCalendarXLSX = async () => {
  try {
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
    const wb = XLSX.utils.book_new();
    const schedules = await getSectionSchedules(false);
    const unitsCount = await getSectionsTotalUnits(sectionView.val());
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
    const scheduleData = [];
    schedules.forEach((element) => {
      element.schedules.forEach((schedule) => {
        scheduleData.push({
          course: element.course,
          faculty: element.faculty,
          program: element.program,
          level: element.yearLevel,
          sectionName: element.sectionName,
          ...schedule,
        });
      });
    });
    const data = [];
    const merges = [];
    const mergedCells = [];
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
      scheduleData.forEach((element, index) => {
        const course = element.course.courseCode.toUpperCase();
        const room = element.room ? element.room.roomName.toUpperCase() : "";
        const initials = element.faculty ? element.faculty.userInformation.facultyCode.toUpperCase() : "";
        const eventTime = element.startTime;
        const day = element.day === 0 ? 7 : element.day;
        if (times[i].split("-")[0] === eventTime) {
          rowData[day * 2] = {
            v: `${course}\n${room}\n${initials}`,
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
            s: { r: i + 5, c: day * 2 },
            e: {
              r: i + 4 + element.hour * 2,
              c: day * 2,
            },
          });
          const mergeCell = [];
          for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
            let singleCell = `${cols[day * 2]}${j + 4}`;
            mergeCell.push(singleCell);
            if (element.type === "lecture") {
              lectureCell.push(singleCell);
            }
            if (element.type === "lab") {
              labCells.push(singleCell);
            }
          }
          mergedCells.push(mergeCell);
        }
      });
      data.push(rowData);
    }
    const ws = XLSX.utils.aoa_to_sheet([
      [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
      [
        cellHeaderText(
          `${programView.find(":selected").text()} ${yearView.find(":selected").text()} - ${sectionView
            .find(":selected")
            .text()}`
        ),
      ],
      [cellHeaderText(`${unitsCount} UNITS`)],
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
    merges.push({
      s: { r: 0, c: 0 },
      e: {
        r: 0,
        c: 14,
      },
    });
    merges.push({
      s: { r: 1, c: 0 },
      e: {
        r: 1,
        c: 14,
      },
    });
    merges.push({
      s: { r: 2, c: 0 },
      e: {
        r: 2,
        c: 14,
      },
    });
    merges.push({
      s: { r: 3, c: 0 },
      e: {
        r: 3,
        c: 14,
      },
    });
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
    ws["!cols"] = [
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
      { wch: 3 },
      { wch: 17 },
    ];
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${programView.find(":selected").text()} ${yearView.find(":selected").text()} - ${sectionView
        .find(":selected")
        .text()}`
    );

    XLSX.writeFile(
      wb,
      `${programView.find(":selected").text()}${yearView.find(":selected").text()}-${sectionView
        .find(":selected")
        .text()} - SCHEDULES.xlsx`
    );
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Can't Generate XLSX, Something went wrong" });
  }
};

const downloadFacultyCalendarPDF = async () => {
  try {
    const schedules = await getFacultySchedules(false);

    // Create a new jsPDF instance
    const doc = new jsPDF("l");

    // Define the table headers
    const headers = [["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]];

    // Define the table rows
    const rows = [];

    // Define the times for the first column with 30 minute intervals
    for (let i = 7; i <= 21; i++) {
      rows.push([i + ":00"]);
      rows.push([i + ":30"]);
    }

    // Add the activities for random 3 hours for each day
    for (let i = 0; i < 7; i++) {
      const activities = [];
      for (let j = 0; j < 6; j++) {
        activities.push("");
      }
      // Generate 3 random activities for random days
      schedules.forEach((element, j) => {
        const day = element.day !== 0 ? element.day - 1 : 6; // Random day index
        const hour = parseInt(element.startTime.split(":")[0]); // Random hour between 7-9
        const minute = parseInt(element.startTime.split(":")[1]); // Random minute 0 or 30
        const course = element.course.courseCode.toUpperCase();
        const program = element.program.programCode.toUpperCase();
        const section = element.sectionName.toUpperCase();
        const room = element.room.roomName.toUpperCase();
        const level = element.level.display.toUpperCase();
        const activity = `${course}\n${program}${level}-${section}\n${room}`;
        const index = (hour - 7) * 2 + minute / 30; // Calculate the row index
        // Set the activity for 3 consecutive rows
        activities[index] = {
          content: activity,
          colSpan: 1,
          rowSpan: element.hour * 2,
          styles: { halign: "center", border: { top: 6, right: 6, bottom: 6, left: 6 } },
        };
        rows[index][day + 1] = {
          content: activity,
          colSpan: 1,
          rowSpan: element.hour * 2,
          styles: { halign: "center", border: { top: 6, right: 6, bottom: 6, left: 6 } },
        };
        rows[index + 1][day + 1] = "";
        rows[index + 2][day + 1] = "";
      });
      rows.forEach(function (row) {
        if (row.length === 1) {
          // Add the activities to the row
          row.push({
            content: "",
            colSpan: 1,
            rowSpan: 1,
            styles: { halign: "center" },
          });
        }
      });
    }

    facultyCode = schedules[0].faculty.userInformation.facultyCode.toUpperCase();
    facultyName = `${schedules[0].faculty.userInformation.firstName} ${schedules[0].faculty.userInformation.middleName} ${schedules[0].faculty.userInformation.lastName}`;
    facultyID = schedules[0].faculty._id;
    facultyType = await getFacultyType(facultyID);
    unitsCount = await getFacultyUnitsCount(facultyID);
    console.log(unitsCount);
    doc.setFontSize(10);
    doc.text(
      `SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM\n${facultyName.toUpperCase()}\n${facultyType.facultyType.toUpperCase()}\n${unitsCount} UNITS`,
      14,
      15
    );
    // Generate the table using jsPDF autotable
    doc.autoTable({
      theme: "grid",
      headStyles: {
        halign: "center",
        cellWidth: 33,
        border: { top: 1, bottom: 1, left: 1, right: 1 },
      },
      bodyStyles: { halign: "center", fontSize: 8, cellPadding: 0.5 },
      head: headers,
      body: rows,
      margin: { top: 30 },
    });

    // Save the PDF document
    doc.save("table.pdf");
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Something went wrong" });
  }
};

const downloadAllFacultyCalendarPDF = async () => {
  alert("test");
};

const downloadAllSectionCalendarXLSX = async () => {
  try {
    let sectionName, unitsCount, sectionID;
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];
    const wb = XLSX.utils.book_new();
    const sectionSchedulesRequest = await fetch(`/api/schedules/section/${semester}/${programView.val()}`);
    const sectionSchedules = await sectionSchedulesRequest.json();
    const schedules = sectionSchedules.data.map((e) => e.data);
    for (scheduleIndex = 0; scheduleIndex < schedules.length; scheduleIndex++) {
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
      const lectureCell = [];
      const labCells = [];
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
        schedules[scheduleIndex].forEach((element, index) => {
          const course = element.course.courseCode.toUpperCase();
          const room = element.room.roomName.toUpperCase();
          const initials = element.faculty ? element.faculty.userInformation.facultyCode.toUpperCase() : "";
          const eventTime = element.startTime;
          const day = element.day === 0 ? 7 : element.day;
          if (times[i].split("-")[0] === eventTime) {
            rowData[day * 2] = {
              v: `${course}\n${room}\n${initials}`,
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
              s: { r: i + 5, c: day * 2 },
              e: {
                r: i + 4 + element.hour * 2,
                c: day * 2,
              },
            });
            const mergeCell = [];
            for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
              let singleCell = `${cols[day * 2]}${j + 4}`;
              mergeCell.push(singleCell);
              if (element.type === "lecture") {
                lectureCell.push(singleCell);
              }
              if (element.type === "lab") {
                labCells.push(singleCell);
              }
            }
            mergedCells.push(mergeCell);
          }
        });
        data.push(rowData);
      }
      sectionName = `${schedules[scheduleIndex][0].program.programCode.toUpperCase()} ${schedules[
        scheduleIndex
      ][0].level.display.toUpperCase()} - ${schedules[scheduleIndex][0].sectionName.toUpperCase()}`;
      sectionID = schedules[scheduleIndex][0].section;
      unitsCount = await getSectionsTotalUnits(sectionID);
      const ws = XLSX.utils.aoa_to_sheet([
        [cellHeaderText(sectionName)],
        [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
        [cellHeaderText(`${unitsCount} UNITS`)],
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
      for (let i = 0; i < 4; i++) {
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
      ws["!cols"] = [
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
        { wch: 3 },
        { wch: 17 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, sectionName);
    }

    XLSX.writeFile(wb, `${programView.find(":selected").text()}.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Can't Download, Something went wrong" });
  }
};

const downloadFacultyTableXLSX = async () => {
  try {
    let facultyID, facultyCode, facultyName, facultyUnits;
    const data = [];
    const wb = XLSX.utils.book_new();
    const schedules = await getFacultySchedules(true);
    console.log(schedules);
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
    facultyID = facultyView.val();
    facultyCode = schedules[0].data[0].faculty.userInformation.facultyCode;
    facultyName = facultyView.find(":selected").text();
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

const downloadAllFacultyTableXLSX = async () => {
  try {
    const schedulesRequest = await fetch(`/api/schedules/faculty/grouped/course/${semester}`);
    const schedules = await schedulesRequest.json();
    const wb = XLSX.utils.book_new();
    for (let i = 0; i < schedules.data.length; i++) {
      const data = [];
      let facultyID, facultyCode, facultyName, facultyUnits;
      schedules.data[i].schedule.forEach((element) => {
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
      console.log(schedules.data[i]);
      facultyID = facultyView.val();
      facultyCode = schedules.data[i].faculty.userInformation.facultyCode;
      facultyName = `${schedules.data[i].faculty.userInformation.firstName} ${schedules.data[i].faculty.userInformation.lastName}`;
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
    }
    XLSX.writeFile(wb, `FACULTY SCHEDULES.xlsx`);
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something Went Wrong",
    });
  }
};

const downloadSectionTableXLSX = async () => {
  try {
    const data = [];
    const wb = XLSX.utils.book_new();
    const schedules = await getSectionSchedules(true);
    schedules.forEach((element) => {
      console.log(element);
      data.push([
        cellData(element.course.courseCode.toUpperCase()),
        cellData(element.course.courseDescription.toUpperCase()),
        cellData(element.course.units),
        cellData(element.course.lecture),
        cellData(element.course.lab),
        cellData(
          element.data[0].faculty
            ? `${element.data[0].faculty.userInformation.firstName.toUpperCase()} ${element.data[0].faculty.userInformation.lastName.toUpperCase()}`
            : "N/A"
        ),
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
    const unitsCount = await getSectionsTotalUnits(sectionView.val());
    const ws = XLSX.utils.aoa_to_sheet([
      [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
      [
        cellHeaderText(
          `${programView.find(":selected").text()} ${yearView.find(":selected").text()} - ${sectionView
            .find(":selected")
            .text()}`
        ),
      ],
      [cellHeaderText(`${unitsCount} UNITS`)],
      [],
      [
        cellData("Course Code"),
        cellData("Course"),
        cellData("Units"),
        cellData("Lecture"),
        cellData("Lab"),
        cellData("Faculty"),
        cellData("Schedule"),
      ],
      ...data,
    ]);
    const merges = [];
    for (let i = 0; i < 4; i++) {
      merges.push({
        s: { r: i, c: 0 },
        e: {
          r: i,
          c: 6,
        },
      });
    }

    ws["!merges"] = merges;
    ws["!cols"] = [{ wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${programView.find(":selected").text()} ${yearView.find(":selected").text()} - ${sectionView
        .find(":selected")
        .text()}`
    );
    XLSX.writeFile(
      wb,
      `${programView.find(":selected").text()} ${yearView.find(":selected").text()} - ${sectionView
        .find(":selected")
        .text()}.xlsx`
    );
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong",
    });
  }
};

const downloadAllSectionTableXLSX = async () => {
  try {
    let programName, yearLevel, section, unitsCount;
    const wb = XLSX.utils.book_new();
    const schedulesRequest = await fetch(`/api/schedules/section/grouped/course/${semester}`);
    const schedules = await schedulesRequest.json();
    for (let i = 0; i < schedules.data.length; i++) {
      const data = [];
      schedules.data[i].schedule.forEach((element) => {
        data.push([
          cellData(element.course.courseCode.toUpperCase()),
          cellData(element.course.courseDescription.toUpperCase()),
          cellData(element.course.units),
          cellData(element.course.lecture),
          cellData(element.course.lab),
          cellData(
            `${element.data[0].faculty.userInformation.firstName.toUpperCase()} ${element.data[0].faculty.userInformation.lastName.toUpperCase()}`
          ),
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
      programName = schedules.data[i].schedule[0].data[0].program.programCode;
      yearLevel = schedules.data[i].schedule[0].data[0].level.display;
      section = schedules.data[i].schedule[0].data[0].sectionName;
      unitsCount = await getSectionsTotalUnits(schedules.data[i].schedule[0].data[0].section);
      const ws = XLSX.utils.aoa_to_sheet([
        [cellHeaderText(`SY ${schoolYearName.toUpperCase()} ${semesterName.toUpperCase()} SEM`)],
        [cellHeaderText(`${programName.toUpperCase()} ${yearLevel} - ${section}`)],
        [cellHeaderText(`${unitsCount} UNITS`)],
        [],
        [
          cellData("Course Code"),
          cellData("Course"),
          cellData("Units"),
          cellData("Lecture"),
          cellData("Lab"),
          cellData("Faculty"),
          cellData("Schedule"),
        ],
        ...data,
      ]);
      const merges = [];
      for (let i = 0; i < 4; i++) {
        merges.push({
          s: { r: i, c: 0 },
          e: {
            r: i,
            c: 6,
          },
        });
      }

      ws["!merges"] = merges;
      ws["!cols"] = [{ wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, ws, `${programName.toUpperCase()} ${yearLevel} - ${section}`);
    }
    XLSX.writeFile(wb, `${programView.find(":selected").text()}.xlsx`);
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

const cellHeader = (data) => {
  return {
    v: data,
    t: "s",
    s: {
      alignment: {
        horizontal: "right",
        vertical: "center",
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
