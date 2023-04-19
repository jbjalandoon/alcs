const csrf = $("#csrf").val();

const config = {
  allDaySlot: false,
  dayHeaderFormat: { weekday: "short" },
  firstDay: 1,
  slotLabelInterval: { minutes: 30 },
  slotLabelFormat: { hour: "numeric", minute: "2-digit" },
  height: "auto",
  eventClassNames: ["overflow-auto text-center"],
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

const spinner = $("#spinner");
const content = $("#content");
const facultyView = $("#facultyView").select2({ width: "100%" });
const roomView = $("#roomView").select2({ width: "100%" });
const programView = $("#programView");
const yearView = $("#yearView");
const sectionView = $("#sectionView");

const facultyCalendar = new FullCalendar.Calendar(
  document.querySelector("#facultyCalendar"),
  config
);

const roomCalendar = new FullCalendar.Calendar(
  document.querySelector("#roomCalendar"),
  config
);
const sectionCalendar = new FullCalendar.Calendar(
  document.querySelector("#sectionCalendar"),
  config
);
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
  try {
    const { data, status } = await axios.get(
      `/api/curriculums/semesters/active`
    );
    semester = data.semester._id;
    schoolYearName = data.year.year.toUpperCase();
    semesterName = data.semester.sem.toUpperCase();
    $("#contentHeader").html(
      `S.Y. ${data.year.year.toUpperCase()} (${data.semester.sem.toUpperCase()} SEMESTER)`
    );
    const { data: unassignedSchedule } = await axios.get(
      `/api/dashboard/analytics/unassigned-schedule/${semester}`
    );
    const { data: unloadedSchedule } = await axios.get(
      `/api/dashboard/analytics/unloaded-schedule/${semester}`
    );
    $("#unloadedSchedules").html(unassignedSchedule.count);
    $("#unassignedSchedule").html(unloadedSchedule.count);

    const { data: activeFaculty } = await axios.get(
      `/api/curriculums/faculty/${semester}`
    );
    const { data: activeRoom } = await axios.get(
      `/api/schedules/rooms/active/${semester}`
    );
    $("#activeFaculty").html(activeFaculty.faculty.length);
    $("#activeRoom").html(activeRoom.rooms.length);

    activeFaculty.faculty.forEach((element) => {
      const information = element.userInformation;
      facultyView.append(
        new Option(
          information.firstName.toUpperCase() +
            " " +
            information.lastName.toUpperCase(),
          element._id
        )
      );
    });

    facultyView.trigger("change");

    activeRoom.rooms.forEach((element) => {
      roomView.append(new Option(element._id.toUpperCase(), element._id));
    });
    roomView.trigger("change");
    const { data: programData } = await axios.get(
      `/api/curriculums/programs/${semester}`
    );

    programData.programs.forEach((element) => {
      programView.append(
        new Option(element.program.programCode.toUpperCase(), element._id)
      );
    });
    programView.trigger("change");
  } catch (error) {
    console.error(error);
    displayToast(error.response);
  } finally {
    $(".owl-carousel").owlCarousel({
      nav: true,
      items: 1,
      margin: 10,
    });
    spinner.addClass("d-none");
    content.removeClass("d-none");
    facultyCalendar.render();
    roomCalendar.render();
    sectionCalendar.render();
  }
})();

$(addModal._element).on("show.bs.modal", async (event) => {
  try {
    const activeYear = $(event.currentTarget).find("#year");
    const activeSemester = $(event.currentTarget).find("#semester");
    const buttons = $(event.currentTarget).find("button");
    const submit = $(event.currentTarget).find("#addButton");
    const form = $(event.currentTarget).find("form");
    submit.removeClass("disabled");
    activeSemester.empty();
    const { data } = await axios.get(`/api/curriculums/school-year`);
    data.curriculum.forEach((element) => {
      activeYear.append(
        new Option(element.schoolYear.toUpperCase(), element._id)
      );
    });
    activeYear.off("change");
    activeYear.on("change", async () => {
      try {
        submit.removeClass("disabled");
        activeSemester.empty();
        const { data } = await axios.get(
          `/api/curriculums/semesters/${activeYear.val()}`
        );
        data.semesters.forEach((element) => {
          activeSemester.append(
            new Option(element.sem.toUpperCase(), element._id)
          );
        });
        activeSemester.removeAttr("disabled");
      } catch (error) {
        submit.addClass("disabled");
        displayToast(error.response);
      }
    });
    activeYear.trigger("change");

    form.off("submit");
    form.on("submit", async (formEvent) => {
      try {
        formEvent.preventDefault();
        submit.html("Submitting");
        buttons.addClass("disabled");
        const { data, status } = await axios.put(
          `/api/curriculums/semesters/active/${activeSemester.val()}`,
          {},
          { headers: { "csrf-token": csrf } }
        );
        window.location.reload();
      } catch (error) {
        displayToast(error.response);
      } finally {
        submit.html("Submit");
        buttons.removeClass("disabled");
      }
    });
  } catch (error) {
    submit.addClass("disabled");
    displayToast(error.response);
  }
});

activeFacultyCard.on("click", (event) => {
  facultyModal.show();
});

$(facultyModal._element).on("show.bs.modal", async (event) => {
  const facultyRequest = await fetch(`/api/curriculums/faculty/${semester}`);
  const faculty = await facultyRequest.json();
  const table = $(event.currentTarget).find("table");
  table.find("tbody").empty();
  faculty.data.sort((a, b) => {
    if (
      a.userInformation.facultyType.facultyType >
      b.userInformation.facultyType.facultyType
    ) {
      return -1;
    }

    if (
      a.userInformation.facultyType.facultyType <
      b.userInformation.facultyType.facultyType
    ) {
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

programView.on("change", async (event) => {
  try {
    yearView.empty();
    sectionView.empty();
    const programValue = $(event.currentTarget).val();
    const { data: levelData } = await axios.get(
      `/api/curriculums/levels/${programValue}`
    );
    yearView.attr("disabled", false);
    sectionView.attr("disabled", false);
    levelData.levels.forEach((element) => {
      yearView.append(
        new Option(element.level.display.toUpperCase(), element._id)
      );
    });
    yearView.trigger("change");
  } catch (error) {
    yearView.attr("disabled", true);
    sectionView.attr("disabled", true);
    displayToast(error.response);
  }
});

yearView.on("change", async (event) => {
  try {
    const level = $(event.currentTarget).val();
    const { data: sectionData } = await axios.get(
      `/api/curriculums/sections/${level}`
    );

    sectionView.empty();
    sectionData.sections.forEach((element) => {
      sectionView.append(
        new Option(element.section.toUpperCase(), element._id)
      );
    });
    sectionView.attr("disabled", false);
    sectionView.trigger("change");
  } catch (error) {
    scheduleSectionForm.attr("disabled", true);
    displayToast(error.response);
  }
});

sectionView.on("change", async (event) => {
  try {
    const current = $(event.currentTarget);
    const section = current.val();

    const events = sectionCalendar.getEvents();
    events.forEach((element) => {
      element.remove();
    });

    const { data: scheduleData } = await axios.get(
      `/api/schedules/sections/${section}`
    );
    const { data: scheduleGroupedData } = await axios.get(
      `/api/schedules/sections/grouped/course/${semester}/${sectionView.val()}`
    );
    scheduleData.schedules.forEach((element) => {
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
          color: schedule.type === "lecture" ? "#007BFF" : "#3399FF",
          textColor: schedule.type === "lecture" ? "white" : "black",
          startEditable: false,
          course: element.course.courseCode,
          program: element.program.programCode,
          type: schedule.type,
          faculty:
            element.faculty != null
              ? element.faculty.userInformation.facultyCode
              : null,
          section: element.sectionName,
          room: schedule.room,
          level: element.level.display,
          current: true,
        });
      });
    });

    const sectionScheduleTable = $("#sectionScheduleTable");
    const tBody = sectionScheduleTable.find("tbody");
    tBody.empty();
    scheduleGroupedData.courses.forEach((element) => {
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
            element.schedules[0].faculty
              ? `${element.schedules[0].faculty.userInformation.firstName.toUpperCase()} ${element.schedules[0].faculty.userInformation.lastName.toUpperCase()}`
              : "NA"
          )
        )
        .append(
          $("<td></td>").html(
            "<ul>" +
              element.schedules
                .map((e) => {
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
    displayToast(error.response);
  }
});

roomView.on("change", async (event) => {
  try {
    const { data } = await axios.get(
      `/api/schedules/rooms/${semester}/${roomView.val()}`
    );
    roomCalendar.getEvents().forEach((element) => {
      element.remove();
    });
    data.schedules.forEach((element) => {
      roomCalendar.addEvent({
        scheduleID: element._id,
        hourDuration: element.hour,
        daysOfWeek: [element.day],
        startTime: element.startTime,
        endTime: element.endTime,
        courseType: element.type,
        overlap: false,
        durationEditable: false,
        startEditable: false,
        course: element.course.courseCode,
        program: element.program.programCode,
        section: element.sectionName,
        room: element.room,
        type: element.type,
        level: element.level.display,
        faculty: element.faculty
          ? element.faculty.userInformation.facultyCode
          : "",
        current: false,
        color: "#007BFF",
        textColor: "white",
      });
    });
    roomCalendar.render();
  } catch (error) {
    displayToast(error.response);
  }
});

facultyView.on("change", async (event) => {
  try {
    const facultyValue = event.currentTarget.value;
    facultyCalendar.getEvents().forEach((element) => {
      element.remove();
    });
    const { data: facultyData } = await axios.get(
      `/api/faculty/${facultyValue}`
    );
    const { data: facultySchedules } = await axios.get(
      `/api/schedules/faculty/${semester}/${facultyValue}`
    );
    const { data: facultySchedulesGrouped } = await axios.get(
      `/api/schedules/faculty/grouped/course/${semester}/${facultyView.val()}`
    );
    const { data: unitsCounts } = await axios.get(
      `/api/schedules/faculty/units/${semester}/${facultyValue}`
    );
    const { units } = unitsCounts;
    hoursCount = facultySchedules.schedules
      .map((e) => e.hour)
      .reduce((a, b) => a + b, 0);
    unitsCount = units;
    const { facultyType } = facultyData.faculty.facultyInformation;
    $("#facultyHours").html(hoursCount);
    $("#facultyUnits").html(unitsCount);
    $("#facultyTypes").html(facultyType.facultyType.toUpperCase());
    facultySchedules.schedules.forEach((element) => {
      facultyCalendar.addEvent({
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
        program: element.program.programCode,
        section: element.sectionName,
        room: element.room,
        level: element.level.display,
        faculty: element.faculty,
        color: "#007BFF",
        textColor: "white",
      });
    });
    facultyCalendar.render();
    const facultyScheduleTable = $("#facultyScheduleTable");
    const tBody = facultyScheduleTable.find("tbody");
    facultyScheduleTable.find("tbody").empty();
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
    displayToast(error.response);
  }
});

$(".btn-download-calendar").on("click", async (e) => {
  try {
    const caseData = $(e.currentTarget).attr("case-data");
    let requestUrl, schedules, headers, title;
    switch (caseData) {
      case "facultyCalendar":
        requestUrl = `/api/schedules/faculty/${semester}/${facultyView.val()}`;
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
        break;
      case "roomCalendar":
        requestUrl = `/api/schedules/rooms/${semester}/${roomView.val()}`;
        const { data: roomScheduleData } = await axios.get(requestUrl);
        schedules = roomScheduleData.schedules;
        const room = roomView.find(":selected").text();
        title = room;
        headers = headersToDataSheets([room.toUpperCase()]);
        break;
      case "sectionCalendar":
        requestUrl = `/api/schedules/sections/${sectionView.val()}`;
        const { data: sectionScheduleData } = await axios.get(requestUrl);
        schedules = [];
        sectionScheduleData.schedules.forEach((e) => {
          schedules.push(
            ...e.schedules.map((el) => {
              return { ...e, ...el };
            })
          );
        });
        const program = programView.find(":selected").text();
        const year = yearView.find(":selected").text();
        const section = sectionView.find(":selected").text();
        const yearSection = `${program} ${year}-${section}`;
        const { data: unitsCount } = await axios.get(
          `/api/curriculums/sections/units/${sectionView.val()}`
        );
        title = yearSection;
        headers = headersToDataSheets([
          yearSection,
          `UNITS: ${unitsCount.count.totalUnits}`,
        ]);
        break;
      default:
        break;
    }
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
    displayToast(error.response);
  }
});

$(".btn-download-all-calendar").on("click", async (e) => {
  try {
    const caseData = $(e.currentTarget).attr("case-data");
    let schedules, filename;
    switch (caseData) {
      case "faculty":
        const { data: facultySchedule } = await axios.get(
          `/api/schedules/faculty/${semester}`
        );
        schedules = facultySchedule.schedules;
        filename = "FACULTY SCHEDULES";
        break;
      case "room":
        const { data: roomSchedule } = await axios.get(
          `/api/schedules/rooms/${semester}`
        );
        schedules = roomSchedule.schedules;
        filename = "ROOM SCHEDULES";

        break;
      case "section":
        const { data: sectionSchedule } = await axios.get(
          `/api/schedules/sections/${semester}/${programView.val()}`
        );
        schedules = sectionSchedule.schedules;
        filename = `${programView.find(":selected").text()} ${yearView
          .find(":selected")
          .text()} SCHEDULES`;

        break;
      default:
        break;
    }
    const wb = XLSX.utils.book_new();
    let title;
    for (let i = 0; i < schedules.length; i++) {
      let headers;
      switch (caseData) {
        case "faculty":
          const { firstName, lastName, middleName } =
            schedules[i].faculty.userInformation;
          const { _id: id } = schedules[i].faculty;
          const { facultyCode } = schedules[i].faculty.facultyInformation;
          const facultyName = `${firstName} ${middleName} ${lastName}`;
          const { data: facultyType } = await axios.get(
            `/api/faculty/type/${id}`
          );
          title = facultyCode;
          const { data: facultyUnits } = await axios.get(
            `/api/schedules/faculty/units/${semester}/${id}`
          );
          if (schedules.length !== 0)
            hoursCount = schedules[i].schedules
              .map((e) => e.hour)
              .reduce((a, b) => a + b);
          headers = headersToDataSheets([
            facultyCode.toUpperCase(),
            facultyName.toUpperCase(),
            facultyType.facultyType.toUpperCase(),
            "Units: " + facultyUnits.units,
            "Hours: " + hoursCount,
          ]);
          break;
        case "room":
          const { _id: room } = schedules[i];
          headers = headersToDataSheets([room.toUpperCase()]);
          title = room;
          break;
        case "section":
          const { program, level, sectionName, section } = schedules[i];
          const yearSection = `${program} ${level}-${sectionName}`;
          const { data: unitsCount } = await axios.get(
            `/api/curriculums/sections/units/${section}`
          );
          title = yearSection.toUpperCase();
          headers = headersToDataSheets([
            yearSection.toUpperCase(),
            `UNITS: ${unitsCount.count.totalUnits}`,
          ]);
          break;
        default:
          break;
      }

      const {
        data,
        merges,
        mergedCells,
        lectureCell,
        labCells,
        overLoadCells,
      } = schedulesToDataSheets(schedules[i].schedules, headers.length);
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
    }
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

$(".btn-download-table").on("click", async (e) => {
  try {
    const caseData = $(e.currentTarget).attr("case-data");
    let courses, title;
    switch (caseData) {
      case "faculty":
        const { data: facultySchedule } = await axios.get(
          `/api/schedules/faculty/grouped/course/${semester}/${facultyView.val()}`
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
        break;
      case "section":
        const { data: sectionSchedule } = await axios.get(
          `/api/schedules/sections/grouped/course/${semester}/${sectionView.val()}`
        );
        courses = sectionSchedule.courses;
        const program = programView.find(":selected").text();
        const year = yearView.find(":selected").text();
        const section = sectionView.find(":selected").text();
        const yearSection = `${program} ${year}-${section}`;
        const { data: unitsCount } = await axios.get(
          `/api/curriculums/sections/units/${sectionView.val()}`
        );
        title = yearSection;
        headers = headersToDataSheets([
          yearSection,
          `UNITS: ${unitsCount.count.totalUnits}`,
        ]);
        break;
      default:
        break;
    }
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
    console.log(error);
    displayToast(error.response);
  }
});

$(".btn-download-all-table").on("click", async (e) => {
  try {
    const caseData = $(e.currentTarget).attr("case-data");
    let sheet, filename;
    switch (caseData) {
      case "faculty":
        const { data: facultyData } = await axios.get(
          `/api/schedules/faculty/grouped/course/${semester}`
        );
        sheet = facultyData.faculty;
        filename = `FACULTY SCHEDULES`;
        break;
      case "section":
        const { data: sectionData } = await axios.get(
          `/api/schedules/sections/grouped/course/${semester}`
        );
        sheet = sectionData.section;
        filename = `${programView.find(":selected").text()} ${yearView
          .find(":selected")
          .text()} SCHEDULES`;
        break;
      default:
        break;
    }
    const wb = XLSX.utils.book_new();
    for (let i = 0; i < sheet.length; i++) {
      const data = [];
      let headers, title;
      sheet[i].schedule.forEach((element) => {
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
                } (${element.program.programCode.toUpperCase()}${
                  element.level.display
                }-${element.sectionName} ${element.room}) `;
              })
              .join("\n")
          ),
        ]);
      });

      switch (caseData) {
        case "faculty":
          const facultyID = facultyView.val();
          const facultyCode = sheet[i].faculty.facultyInformation.facultyCode;
          const facultyName = `${sheet[i].faculty.userInformation.firstName} ${sheet[i].faculty.userInformation.lastName}`;
          title = facultyCode.toUpperCase();
          const { data: facultyType } = await axios.get(
            `/api/faculty/type/${facultyID}`
          );
          const { data: facultyUnits } = await axios.get(
            `/api/schedules/faculty/units/${semester}/${facultyID}`
          );
          headers = headersToDataSheets([
            facultyCode.toUpperCase(),
            facultyName.toUpperCase(),
            facultyType.facultyType.toUpperCase(),
            "Units: " + facultyUnits.units,
          ]);
          break;
        case "section":
          const { level, program, section, sectionId } = sheet[i];
          console.log(sheet[i]);
          const yearSection = `${program.toUpperCase()} ${level}-${section}`;
          title = yearSection;
          const { data: unitsCount } = await axios.get(
            `/api/curriculums/sections/units/${sectionId}`
          );
          headers = headersToDataSheets([
            yearSection,
            `UNITS: ${unitsCount.count.totalUnits}`,
          ]);
          break;
        default:
          break;
      }

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
    }
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

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

const getFacultyUnitsCount = async (faculty) => {
  try {
    const unitsRequest = await fetch(
      `/api/schedules/faculty/units/${semester}/${faculty}`
    );
    const units = await unitsRequest.json();
    return units.data;
  } catch (error) {
    console.error(error);
    return 0;
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
