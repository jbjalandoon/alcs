const csrf = $("#csrf").val();

let sem, activeYear, activeSemester;
let activeFaculty, activeRoom, scheduleWithoutFaculty, scheduleWithoutTimeslot;
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
    const facultyCode = info.event.extendedProps.faculty.toUpperCase();
    // info.setExtendedProp(
    //   "customTitle",
    //   `${course}<br>${program}${level}-${section}<br>${room}<br>${initials}`
    // );
    timeEl.innerHTML = "";
    titleEl.innerHTML = `${course}<br>${program}${level}-${section}<br>${room}<br>${facultyCode}`;
  },
};

$(".owl-carousel").owlCarousel({
  nav: true,
  items: 1,
  margin: 10,
});

const facultyCalendar = new FullCalendar.Calendar(document.querySelector("#facultyCalendar"), config);

const roomCalendar = new FullCalendar.Calendar(document.querySelector("#roomCalendar"), config);

const sectionCalendar = new FullCalendar.Calendar(document.querySelector("#sectionCalendar"), config);

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
    // Acive Curriculum
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
      `S.Y. ${result.data[0].schoolYear[0].year} (${result.data[0].semesters.sem.toUpperCase()} SEMESTER)`
    );
    return fetch("/api/curriculums/faculty/" + sem);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    // Faculty
    const downloadCurrentFaculty = $("#downloadCurrentFaculty");
    const downloadAllFaculty = $("#downloadAllFaculty");
    result.data.forEach((element) => {
      facultyView.append(
        new Option(
          element.userInformation.firstName.toUpperCase() + " " + element.userInformation.lastName.toUpperCase(),
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
            let facultyCode;
            downloadCurrentFaculty.off("click");
            downloadAllFaculty.off("click");
            facultyCalendar.getEvents().forEach((element) => {
              element.remove();
            });
            result.data.forEach((element) => {
              facultyCalendar.addEvent({
                scheduleID: element._id,
                hourDuration: element.hour,
                daysOfWeek: [element.day],
                startTime: element.startTime,
                endTime: element.endTime,
                courseType: element.type,
                overlap: false,
                durationEditable: false,
                color: element.type === "lecture" ? "#007BFF" : "#3399FF",
                textColor: element.type === "lecture" ? "white" : "black",
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
            downloadCurrentFaculty.on("click", () => {
              downloadSpreadsheet(facultyCode.toUpperCase() + "-SCHEDULES" + ".xlsx", [result.data], "faculty");
            });
            downloadAllFaculty.on("click", () => {
              fetch(`/api/schedules/faculty/${sem}`)
                .then((response) => {
                  return response.json();
                })
                .then((result) => {
                  downloadSpreadsheet(
                    "FACULTY-SCHEDULES.xlsx",
                    result.data.map((e) => e.data),
                    "faculty"
                  );
                })
                .catch((error) => {
                  console.log(error);
                });
            });

            return fetch(`/api/schedules/faculty/grouped/${sem}/${facultyView.val()}`);
          })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            result.data.forEach((element) => {
              const facultyScheduleTable = $("#facultyScheduleTable");
              const tBody = facultyScheduleTable.find("tbody");
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
                          return `<li>${days[e.day]} ${e.startTime} - ${
                            e.endTime
                          } (${e.program.programCode.toUpperCase()}${e.level.display}-${e.sectionName})</li>`;
                        })
                        .join("") +
                      "</ul>"
                  )
                );
              tBody.append(tRow);
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
    // Rooms
    const downloadCurrentRoom = $("#downloadCurrentRoom");
    const downloadAllRoom = $("#downloadAllRoom");
    result.data.forEach((element) => {
      roomView.append(new Option(element.room.roomName.toUpperCase(), element._id));
    });
    if (result.data.length !== 0) {
      roomView.on("change", () => {
        fetch(`/api/schedules/room/${sem}/${roomView.val()}`)
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
                scheduleID: element._id,
                hourDuration: element.hour,
                daysOfWeek: [element.day],
                startTime: element.startTime,
                endTime: element.endTime,
                courseType: element.type,
                overlap: false,
                durationEditable: false,
                color: element.type === "lecture" ? "#007BFF" : "#3399FF",
                textColor: element.type === "lecture" ? "white" : "black",
                startEditable: false,
                course: element.course.courseCode,
                program: element.program.programCode,
                faculty: element.faculty ? element.faculty.userInformation.facultyCode : "",
                section: element.sectionName,
                room: element.room.roomName,
                level: element.level.display,
              });
            });
            downloadCurrentRoom.on("click", () => {
              downloadSpreadsheet(
                roomView.find("option").filter(":selected").text() + "-SCHEDULES" + ".xlsx",
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
                    "ROOMS-SCHEDULES.xlsx",
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
    // Sections
    result.data.forEach((element) => {
      programView.append(new Option(element.program.programCode.toUpperCase(), element._id));
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
              yearView.append(new Option(element.level.yearLevel.toUpperCase(), element._id));
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
                    sectionView.append(new Option(element.section.toUpperCase(), element._id));
                  });
                  sectionView.on("change", () => {
                    fetch(`/api/schedules/section/${sectionView.val()}`)
                      .then((response) => {
                        return response.json();
                      })
                      .then((result) => {
                        sectionCalendar.getEvents().forEach((element) => {
                          element.remove();
                        });
                        const downloadCurrentSection = $("#downloadCurrentSection");
                        const downloadAllSection = $("#downloadAllSection");
                        downloadCurrentSection.off("click");
                        downloadAllSection.off("click");
                        console.log(result.data);
                        result.data.forEach((element) => {
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
                              faculty: element.faculty ? element.faculty.userInformation.facultyCode : "",
                              section: element.sectionName,
                              room: schedule.room.roomName,
                              level: element.yearLevel.display,
                            });
                          });
                        });
                        downloadCurrentSection.on("click", () => {
                          const data = [];
                          result.data.forEach((element) => {
                            element.schedules.forEach((schedule) => {
                              data.push({
                                course: element.course,
                                faculty: element.faculty,
                                program: element.program,
                                level: element.yearLevel,
                                sectionName: element.sectionName,
                                ...schedule,
                              });
                            });
                          });
                          downloadSpreadsheet(
                            `${programView.find("option").filter(":selected").text()} ${yearView
                              .find("option")
                              .filter(":selected")
                              .text()}-${sectionView.find("option").filter(":selected").text()}.xlsx`,
                            [data],
                            "section"
                          );
                        });
                        downloadAllSection.on("click", () => {
                          fetch(`/api/schedules/section/${sem}/${programView.val()}`)
                            .then((response) => {
                              return response.json();
                            })
                            .then((result) => {
                              downloadSpreadsheet(
                                `${programView.find("option").filter(":selected").text()}-SCHEDULES.xlsx`,
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
    $("#unloadedSchedules").html(result.data.length);
    return fetch("/api/schedules/assignable-schedules/" + sem);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    $("#unassignedSchedule").html(result.data);
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
        if (type === "faculty") sheet = element.faculty.userInformation.facultyCode.toUpperCase();
        if (type === "room") sheet = element.room.roomName.toUpperCase();
        if (type === "section")
          sheet =
            element.program.programCode.toUpperCase() +
            "" +
            element.level.display.toUpperCase() +
            " - " +
            element.sectionName.toUpperCase();
        const eventTime = element.startTime;
        if (times[i].split("-")[0] === eventTime) {
          const course = element.course.courseCode.toUpperCase();
          const program = element.program.programCode.toUpperCase();
          const section = element.sectionName.toUpperCase();
          const room = element.room.roomName.toUpperCase();
          const level = element.level.display.toUpperCase();
          const initials = element.faculty ? element.faculty.userInformation.facultyCode.toUpperCase() : "";
          rowData[element.day * 2] = {
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
            s: { r: i + 1, c: element.day * 2 },
            e: {
              r: i + element.hour * 2,
              c: element.day * 2,
            },
          });
          const mergeCell = [];
          for (let j = i + 2; j <= i + 1 + element.hour * 2; j++) {
            let singleCell = `${cols[element.day * 2]}${j}`;
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
