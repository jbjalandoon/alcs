const csrf = $("#csrf").val();

let sem, activeYear, activeSemester;
let activeFaculty, activeRoom, scheduleWithoutFaculty, scheduleWithoutTimeslot;
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

const facultyView = $("#facultyView").select2({ width: "100%" });
const roomView = $("#roomView").select2({ width: "100%" });
const programView = $("#programView");
const yearView = $("#yearView");
const sectionView = $("#sectionView");

const addModal = new bootstrap.Modal($("#addModal"));

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    console.log(result)
    if (result.data.length === 0) {
      Toast.fire({
        icon: "warning",
        title: "There is no current active semester",
      });
      return Promise.reject();
    }
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
    sem = result.data[0].semesters._id;
    $("#cardTitle").html(
      `DASHBOARD ${
        result.data[0].schoolYear[0].year
      } (${result.data[0].semesters.sem.toUpperCase()} SEMESTER)`
    );
    return fetch("/api/curriculums/faculty/" + sem);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const downloadCurrentFaculty = $("#downloadCurrentFaculty");
    const downloadAllFaculty = $("#downloadAllFaculty");
    result.data.forEach((element) => {
      facultyView.append(
        new Option(
          element.faculty.userInformation.firstName.toUpperCase() +
            " " +
            element.faculty.userInformation.lastName.toUpperCase(),
          element._id
        )
      );
    });
    if (result.data.length !== 0) {
      facultyView.on("change", (event) => {
        fetch(`/api/schedules/faculty/${sem}/${facultyView.val()}`)
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            downloadCurrentFaculty.off("click");
            downloadAllFaculty.off("click");
            facultyCalendar.getEvents().forEach((element) => {
              element.remove();
            });
            result.data.forEach((element) => {
              facultyCalendar.addEvent({
                id: element._id,
                hourDuration: element.hour,
                daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
                startTime: element.start_time,
                endTime: element.end_time,
                overlap: false,
                editabe: false,
                units: element.course.units,
                course: element.course.courseCode,
                type: element.type,
                program: element.program.programCode,
                section: element.section_name,
                room: element.room.roomName,
                level: element.level.display,
                faculty: element.faculty,
              });
            });
            facultyCalendar.render();
            downloadCurrentFaculty.on("click", () => {
              downloadSpreadsheet(
                facultyView.val() + ".xlsx",
                [result.data],
                "faculty"
              );
            });
            downloadAllFaculty.on("click", () => {
              fetch(`/api/schedules/faculty/${sem}`)
                .then((response) => {
                  return response.json();
                })
                .then((result) => {
                  downloadSpreadsheet(
                    "faculty.xlsx",
                    result.data.map((e) => e.data),
                    "faculty"
                  );
                })
                .catch((error) => {
                  console.log(error);
                });
            });
          })
          .catch((error) => {
            console.log(error);
          });
      });
      facultyView.trigger("change");
    }
    activeFaculty = result.data.length;
    $("#activeFaculty").html(activeFaculty);
    facultyCalendar.render();
    return fetch(`/api/curriculums/room/${sem}`);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const downloadCurrentRoom = $("#downloadCurrentRoom");
    const downloadAllRoom = $("#downloadAllRoom");
    result.data.forEach((element) => {
      roomView.append(
        new Option(element.room.roomName.toUpperCase(), element._id)
      );
    });
    if (result.data.length !== 0) {
      roomView.on("change", () => {
        fetch(`/api/schedules/room/finished/${sem}/${roomView.val()}`)
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            downloadCurrentRoom.off("click");
            downloadAllRoom.off("click");
            roomCalendar.getEvents().forEach((element) => {
              element.remove();
            });
            result.data.forEach((element) => {
              roomCalendar.addEvent({
                id: element._id,
                hourDuration: element.hour,
                daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
                startTime: element.start_time,
                endTime: element.end_time,
                overlap: false,
                editabe: false,
                units: element.course.units,
                course: element.course.courseCode,
                type: element.type,
                program: element.program.programCode,
                section: element.section_name,
                room: element.room.roomName,
                level: element.level.display,
                faculty: element.faculty,
              });
            });
            downloadCurrentRoom.on("click", () => {
              downloadSpreadsheet(
                roomView.find("option").filter(":selected").text() + ".xlsx",
                [result.data],
                "room"
              );
            });
            downloadAllRoom.on("click", () => {
              fetch(`/api/schedules/room/${sem}`)
                .then((response) => {
                  return response.json();
                })
                .then((result) => {
                  downloadSpreadsheet(
                    "room.xlsx",
                    result.data.map((e) => e.data),
                    "room"
                  );
                })
                .catch((error) => {
                  console.log(error);
                });
            });
            roomCalendar.render();
          })
          .catch((error) => {
            console.log(error);
          });
      });
      roomView.trigger("change");
    }
    activeRoom = result.data.length;
    $("#activeRoom").html(activeRoom);
    roomCalendar.render();

    return fetch("/api/curriculums/programs/" + sem);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      programView.append(
        new Option(element.program.programName.toUpperCase(), element._id)
      );
    });
    if (result.data.length !== 0) {
      programView.on("change", () => {
        fetch("/api/curriculums/year-levels/" + programView.val())
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            yearView.empty();
            result.data.forEach((element) => {
              yearView.append(
                new Option(element.level.yearLevel.toUpperCase(), element._id)
              );
            });
            yearView.on("change", () => {
              fetch("/api/curriculums/sections/" + yearView.val())
                .then((response) => {
                  return response.json();
                })
                .then((result) => {
                  sectionView.empty();
                  if (result.data.length === 0) {
                    sectionCalendar.getEvents().forEach((element) => {
                      element.remove();
                    });
                    return Toast.fire({
                      icon: "warning",
                      title: "No Section Found",
                    });
                  }
                  result.data.forEach((element) => {
                    sectionView.append(
                      new Option(element.section.toUpperCase(), element._id)
                    );
                  });
                  sectionView.on("change", () => {
                    fetch(`/api/schedules/section/${sem}/${sectionView.val()}`)
                      .then((response) => {
                        return response.json();
                      })
                      .then((result) => {
                        sectionCalendar.getEvents().forEach((element) => {
                          element.remove();
                        });
                        result.data.forEach((element) => {
                          const downloadCurrentSection = $(
                            "#downloadCurrentSection"
                          );

                          const downloadAllSection = $("#downloadAllSection");
                          downloadCurrentSection.off("click");
                          downloadAllSection.off("click");
                          sectionCalendar.addEvent({
                            id: element._id,
                            hourDuration: element.hour,
                            daysOfWeek: [
                              (days.indexOf(element.day) + 1).toString(),
                            ],
                            startTime: element.start_time,
                            endTime: element.end_time,
                            overlap: false,
                            editabe: false,
                            units: element.course.units,
                            course: element.course.courseCode,
                            type: element.type,
                            program: element.program.programCode,
                            section: element.section_name,
                            room: element.room.roomName,
                            level: element.level.display,
                            faculty: element.faculty,
                          });
                          downloadCurrentSection.on("click", () => {
                            downloadSpreadsheet(
                              sectionView
                                .find("option")
                                .filter(":selected")
                                .text() + ".xlsx",
                              [result.data],
                              "section"
                            );
                          });
                          downloadAllSection.on("click", () => {
                            fetch(`/api/schedules/section/${sem}`)
                              .then((response) => {
                                return response.json();
                              })
                              .then((result) => {
                                downloadSpreadsheet(
                                  "section.xlsx",
                                  result.data.map((e) => e.data),
                                  "section"
                                );
                              })
                              .catch((error) => {
                                console.log(error);
                              });
                          });
                        });
                      });
                  });
                  sectionView.trigger("change");
                })
                .catch((error) => {
                  console.log(error);
                });
            });
            yearView.trigger("change");
          })
          .catch((error) => {
            console.log(error);
          });
      });
    }
    programView.trigger("change");
    sectionCalendar.render();
    return fetch("/api/schedules/loadable-schedules/" + sem);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    scheduleWithoutFaculty = result.data.length;
    $("#scheduleWithoutFaculty").html(scheduleWithoutFaculty);
    return fetch("/api/schedules/assignable-schedules/" + sem);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    scheduleWithoutTimeslot = result.data.length;
    $("#scheduleWithoutTimeslot").html(scheduleWithoutTimeslot);
  })
  .catch((error) => {
    // Toast.fire({ icon: "error", title: "Something went wrong" });
    console.log(error);
  });

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
        activeYear.append(
          new Option(element.schoolYear.toUpperCase(), element._id)
        );
      });
      activeYear.on("change", (event) => {
        console.log(activeYear.val());
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
              activeSemester.append(
                new Option(element.sem.toUpperCase(), element._id)
              );
            });
            activeSemester.removeAttr("disabled");
          })
          .catch((error) => {
            console.log(error);
          });
      });
      activeSemester.on("change", (event) => {
        $("#addButton").removeClass("disabled");
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

$("#addButton").on("click", () => {
  fetch("/api/curriculums/active/" + activeSemester.val(), {
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
      console.log(error);
    });
});

function downloadSpreadsheet(filename, events, type) {
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

  const wb = XLSX.utils.book_new();
  events.forEach((element) => {
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
        console.log(element);
        if (type === "faculty")
          sheet = element.faculty.userInformation.facultyCode.toUpperCase();
        if (type === "room") sheet = element.room.roomName.toUpperCase();
        if (type === "section")
          sheet =
            element.program.programCode.toUpperCase() +
            "" +
            element.level.display.toUpperCase() +
            " - " +
            element.section_name.toUpperCase();
        const eventTime = element.start_time;
        if (times[i].split("-")[0] === eventTime) {
          const course = element.course.courseCode.toUpperCase();
          const program = element.program.programCode.toUpperCase();
          const section = element.section_name.toUpperCase();
          const room = element.room.roomName.toUpperCase();
          const level = element.level.display.toUpperCase();
          const firstName = element.faculty.userInformation.firstName;
          const middleName = element.faculty.userInformation.middleName
            ? element.faculty.userInformation.middleName
            : "";
          const lastName = element.faculty.userInformation.lastName;
          const initials = `${firstName.charAt(0)}${middleName.charAt(
            0
          )}${lastName.charAt(0)}`.toUpperCase();
          rowData[(days.indexOf(element.day) + 1) * 2] = {
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
            s: { r: i + 1, c: (days.indexOf(element.day) + 1) * 2 },
            e: {
              r: i + element.hour * 2,
              c: (days.indexOf(element.day) + 1) * 2,
            },
          });
          const mergeCell = [];
          for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
            let singleCell = `${cols[(days.indexOf(element.day) + 1) * 2]}${j}`;
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
    XLSX.utils.book_append_sheet(wb, ws, sheet);
  });

  // Create a worksheet with the data and a header row with labels for Time and Monday through Friday

  // Merge the cells for each activity

  // Add the worksheet to the Excel file

  // Write the Excel file to the filesystem
  XLSX.writeFile(wb, filename);
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
