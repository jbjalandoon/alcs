let sem;
const csrf = $("#csrf").val();
const faculty = $("#faculty");

let totalUnit,
  preferredSchedule,
  tags = [],
  unitsCount = 0,
  hoursCount = 0;

let unavailableTime = [];

const courseSearch = $("#courseSearch");
const calendarContainer = document.querySelector("#calendarContainer");
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
  eventClick: (info) => {
    if (info.event.display === "background") {
      return;
    }
    Swal.showLoading();
    const deleteEvents = [];
    const days = ["m", "t", "w", "th", "f", "s", null];
    const eventInfo = info.event.extendedProps;
    fetch("/api/schedules/" + info.event.id)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        if (!result.ok) {
          return;
        }
        deleteEvents.push(info.event);
        calendar.getEvents().forEach((element) => {
          const sameID = element.id !== info.event.id;
          const sameProgram =
            element.extendedProps.program === eventInfo.program;
          const sameYear = element.extendedProps.year === eventInfo.year;
          const sameSection =
            element.extendedProps.section === eventInfo.section;
          const sameCourse = element.extendedProps.course === eventInfo.course;

          if (sameID && sameProgram && sameYear && sameSection && sameCourse) {
            deleteEvents.push(element);
          }
        });
        Swal.fire({
          icon: "info",
          title: `${result.data.course.courseDescription.toUpperCase()} - ${
            result.data.type === "lab" ? "LAB" : "LECTURE"
          }`,
          text: `${result.data.day.toUpperCase()} ${result.data.start_time} - ${
            result.data.end_time
          } (${result.data.room.roomName.toUpperCase()})`,
          width: "50%",
          showCancelButton: true,
          showDenyButton: true,
          showConfirmButton: false,
          denyButtonText: `Remove`,
          cancelButtonText: `Close`,
        }).then((clicked) => {
          if (clicked.isDenied) {
            Swal.fire({
              title: "Are you sure?",
              text: "You won't be able to revert this!",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, delete it!",
              preConfirm: () => {
                return fetch(
                  "/api/schedules/unassign/" + deleteEvents.map((e) => e.id),
                  {
                    method: "DELETE",
                    headers: {
                      "csrf-token": csrf,
                    },
                  }
                )
                  .then((response) => {
                    return response.json();
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              },
            }).then((clicked) => {
              if (clicked.isConfirmed) {
                let notFound = true;
                courseSearch.children().each((element) => {
                  console.log(
                    $(courseSearch.children()[element]).val() +
                      "===" +
                      result.data.course._id
                  );
                  if (
                    result.data.course._id ===
                    $(courseSearch.children()[element]).val()
                  ) {
                    notFound = false;
                  }
                });
                if (notFound) {
                  courseSearch.append(
                    new Option(
                      `${result.data.course.courseCode.toUpperCase()} - ${result.data.course.courseDescription.toUpperCase()}`,
                      result.data.course._id
                    )
                  );
                }
                if (result.data.course._id == courseSearch.val()) {
                  courseSearch.trigger("change");
                }
                deleteEvents.forEach((element) => {
                  hoursCount -= parseInt(element.extendedProps.hourDuration);
                  element.remove();
                });
                // console.log(result.data.course.units);
                unitsCount -= parseInt(result.data.course.units);
                $("#spanUnits").html(unitsCount);
                $("#spanHours").html(hoursCount);
                Toast.fire({
                  icon: "success",
                  title: "Successfully Removed",
                });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log(error);
        Toast.fire({
          icon: "error",
          title: "Something went wrong",
        });
      });
  },
  eventDidMount: (info) => {
    if (info.event.display === "background") {
      return;
    }
    const titleEl = info.el.querySelector(".fc-event-title");
    const timeEl = info.el.querySelector(".fc-event-time");
    info.el.style.textAlign = "center";

    const course = info.event.extendedProps.course.toUpperCase();
    const program = info.event.extendedProps.program.toUpperCase();
    const section = info.event.extendedProps.section.toUpperCase();
    const room = info.event.extendedProps.room.toUpperCase();
    const level = info.event.extendedProps.level.toUpperCase();

    timeEl.innerHTML = "";
    titleEl.innerHTML = `${course}<br>${program}${level}-${section}<br>${room}<br>`;
  },
};

const calendar = new FullCalendar.Calendar(calendarContainer, config);
fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (result.data.length === 0) {
      return Toast.fire({
        icon: "warning",
        title: "There is no current active semester",
      });
    }

    sem = result.data[0].semesters._id;
    return fetch("/api/faculty");
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      const firstName = element.userInformation.firstName.toUpperCase();
      const lastName = element.userInformation.lastName.toUpperCase();
      const middleName = element.userInformation.middleName
        ? element.userInformation.middleName.toUpperCase()
        : "";
      const name = firstName + " " + middleName + " " + lastName;
      faculty.append(new Option(name.toUpperCase(), element._id));
    });
    faculty.select2({
      width: "100%",
    });
    $("#firstLoading").addClass("d-none");
    $("#facultySelect").removeClass("d-none");
  })
  .catch((error) => {
    // Toast.fire({ icon: "error", title: "Something went wrong" });
    console.log(error);
  });

faculty.on("change", () => {
  $("#lectureList").empty();
  $("#labList").empty();
  $("#lecture-tab").html(`Lecture (0)`);
  $("#lab-tab").html(`Lab (0)`);
  $("#contentRow").removeClass("d-none");
  totalUnit = 0;
  unavailableTime.length = 0;
  fetch("/api/faculty/" + faculty.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      tags = [];
      preferredSchedule = result.data.userInformation.schedulePreference;
      $("#spanFacultyType").html(
        result.data.userInformation.facultyType.facultyType
      );
      unitsCount = 0;
      hoursCount = 0;
      calendar.getEvents().forEach((element) => {
        console.log(element);
        element.remove();
      });
      result.data.userInformation.schedulePreference.forEach((element) => {
        calendar.addEvent({
          startTime: element.startTime,
          endTime: element.endTime,
          daysOfWeek: [element.day],
          overlap: false,
          durationEditable: false,
          startEditable: false,
          color: "#d9534f",
          display: "background",
        });
      });
      $("#spanMaxUnits").html(result.data.userInformation.facultyType.unitsCap);
      $("#spanMaxHours").html(result.data.userInformation.facultyType.hoursCap);
      return fetch(`/api/schedules/faculty/${sem}/${faculty.val()}`);
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const days = ["m", "t", "w", "th", "f", "s", null];

      result.data.forEach((element) => {
        console.log(element.course);
        if (element.type !== "lab") {
          unitsCount += parseInt(element.course.units);
        }
        hoursCount += parseInt(element.hour);
        calendar.addEvent({
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
      $("#spanUnits").html(unitsCount);
      $("#spanHours").html(hoursCount);
      $("#loadingCalendar").addClass("d-none");
      $("#calendar").removeClass("d-none");
      calendar.render();

      return fetch(`/api/schedules/assignable-course/${sem}/${faculty.val()}`);
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
     
      courseSearch.find("option").not(":first").remove();
      result.data.forEach((element) => {
        courseSearch.append(
          new Option(
            `${element.course.courseCode.toUpperCase()} - ${element.course.courseDescription.toUpperCase()}`,
            element._id
          )
        );
      });
      $("#loadingCourse").addClass("d-none");
      $("#courses").removeClass("d-none");
      courseSearch.select2({
        width: "100%",
        placeholder: "Select Course",
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

courseSearch.on("change", () => {
  $("#loadingList").removeClass("d-none");
  $("#list").addClass("d-none");
  fetch(`/api/schedules?sem=${sem}&course=${courseSearch.val()}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const days = ["m", "t", "w", "th", "f", "s", null];
      $("#courseList").empty();
      result.data.forEach((element) => {
        const currentTimeRange = [];
        let buttonBg = "bg-primary";
        const listItem = $(document.createElement("div")).addClass(
          "list-group-item d-flex justify-content-between align-items-start fc-event"
        );
        const container = $("<div></div>").addClass("container-fluid");
        container.append(
          $("<div></div>")
            .addClass("row")
            .append(
              $("<div></div>")
                .addClass("col-12 fw-bold")
                .html(
                  `${element.schedules[0].course.courseCode.toUpperCase()} ${element.schedules[0].program.programCode.toUpperCase()} ${
                    element.schedules[0].section_name
                  }-${element.schedules[0].level.display}`
                )
            )
        );
        const scheduleRow = $("<div></div>");
        scheduleRow.addClass("row");
        const scheduleCol = $("<div></div>");
        scheduleCol.addClass("col-12 ");
        const scheduleUl = $("<ul></ul>");
        scheduleUl.css({
          "list-style": "none",
          "padding-left": 0,
        });

        scheduleCol.append(scheduleUl);
        scheduleRow.append(scheduleCol);
        element.schedules.forEach((element) => {
          const scheduleListItem = $("<li></li>");
          scheduleListItem.attr({
            id: element._id,
            hourDuration: element.hour,
            daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
            startTime: element.start_time,
            endTime: element.end_time,
            type: element.type,
            overlap: false,
            durationEditable: false,
            units: element.course.units,
            startEditable: true,
            course: element.course.courseCode,
            program: element.program.programCode,
            section: element.section_name,
            room: element.room.roomName,
            level: element.level.display,
            faculty: element.faculty,
            current: false,
          });
          scheduleListItem.html(
            `${days[days.indexOf(element.day)].toUpperCase()} - [${
              element.start_time
            } - ${
              element.end_time
            } ${element.room.roomName.toUpperCase()}]  (${element.type.toUpperCase()})`
          );
          scheduleUl.append(scheduleListItem);
          currentTimeRange.push({
            day: days.indexOf(element.day) + 1,
            range: moment.range(
              new Date(
                0,
                0,
                0,
                element.start_time.split(":")[0],
                element.start_time.split(":")[1]
              ),
              new Date(
                0,
                0,
                0,
                element.end_time.split(":")[0],
                element.end_time.split(":")[1]
              )
            ),
          });
        });
        calendar.getEvents().forEach((e) => {
          const eventDay = e.start.getDay();
          const eventRange = moment.range(
            new Date(0, 0, 0, e.start.getHours(), e.start.getMinutes()),
            new Date(0, 0, 0, e.end.getHours(), e.end.getMinutes())
          );
          const bool1 =
            currentTimeRange[0].range.overlaps(eventRange) &&
            currentTimeRange[0].day === eventDay;
          const bool2 =
            currentTimeRange[1].range.overlaps(eventRange) &&
            currentTimeRange[1].day === eventDay;
          if (bool1 || bool2) {
            if (e.display === "background") {
              buttonBg = "bg-warning";
            } else {
              buttonBg = "bg-danger";
            }
          }
        });
        container.append(scheduleRow);
        listItem.append(container);
        listItem.append(
          $(document.createElement("button"))
            .addClass("btn btn-link btn-sm shadow-none add-button btn-assign")
            .on("click", assignFaculty)
            .append(
              $(document.createElement("span"))
                .addClass("badge rounded-pill " + buttonBg)
                .append(
                  $(document.createElement("i")).addClass("fa-solid fa-plus")
                )
            )
        );
        $("#courseList").append(listItem);
      });
      $("#list").removeClass("d-none");
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something went wrong" });
    });
});

const assignFaculty = (element) => {
  const schedules = [];
  const days = ["m", "t", "w", "th", "f", "s", null];
  const currentButton = $(element.currentTarget);
  const event = calendar.getEvents();
  let isUndesiredSchedule = false;
  const conflictSchedules = [];
  const currentTimeRange = [];
  let continueOperation = true;
  const courseList = currentButton.parent().find("ul").children();
  courseList.each(function (i, obj) {
    const button = $(obj);
    schedules.push($(obj).attr("id"));
    currentTimeRange.push({
      day: parseInt(button.attr("daysofWeek")),
      range: moment.range(
        new Date(
          0,
          0,
          0,
          button.attr("startTime").split(":")[0],
          button.attr("startTime").split(":")[1]
        ),
        new Date(
          0,
          0,
          0,
          button.attr("endTime").split(":")[0],
          button.attr("endTime").split(":")[1]
        )
      ),
    });
    console.log(parseInt(button.attr("hourDuration")));
  });
  event.forEach((element) => {
    const eventDay = element.start.getDay();
    const eventRange = moment.range(
      new Date(0, 0, 0, element.start.getHours(), element.start.getMinutes()),
      new Date(0, 0, 0, element.end.getHours(), element.end.getMinutes())
    );
    const bool1 =
      currentTimeRange[0].range.overlaps(eventRange) &&
      currentTimeRange[0].day === eventDay;
    const bool2 =
      currentTimeRange[1].range.overlaps(eventRange) &&
      currentTimeRange[1].day === eventDay;
    if (bool1 || bool2) {
      if (element.display === "background") {
        isUndesiredSchedule = true;
      } else {
        conflictSchedules.push(element);
      }
    }
  });
  if (conflictSchedules.length !== 0) {
    return Swal.fire({
      icon: "error",
      title: "Schedule Overlaps",
      html: '<div class="list-group" id="overlapList"></div>',
      willOpen: () => {
        const orderedList = $("<ol></ol>");
        orderedList.addClass("list-group list-group-numbered");
        conflictSchedules.forEach((element) => {
          console.log(element);
          const startTime = moment(
            new Date(
              0,
              0,
              0,
              element.start.getHours(),
              element.start.getMinutes()
            )
          );
          const endTime = moment(
            new Date(0, 0, 0, element.end.getHours(), element.end.getMinutes())
          );
          const listItem = $("<li></li>");
          listItem.addClass(
            "list-group-item d-flex justify-content-between align-items-start"
          );
          const content = $("<div></div>");
          content.addClass("ms-2 me-auto");
          const header = $("<div></div>");
          header.addClass("fw-bold");
          header.html(
            element.extendedProps.course.toUpperCase() +
              ` ${days[
                element.start.getDay() - 1
              ].toUpperCase()} [${startTime.format(
                "hh:mm A"
              )} - ${endTime.format("hh:mm A")}]`
          );
          content.append(header);
          listItem.append(content);
          orderedList.append(listItem);
        });
        $("#overlapList").empty().append(orderedList);
      },
    });
  }
  if (isUndesiredSchedule) {
    return Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "This schedule is marked as unwanted schedule of the faculty member, you want to continue?",
      confirmButtonText: "Confirm",
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        return fetch(`/api/schedules/assign/${schedules}`, {
          method: "PUT",
          headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ faculty: faculty.val() }),
        })
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            courseList.each(function (i, obj) {
              const button = $(obj);
              calendar.addEvent({
                id: button.attr("id"),
                hourDuration: button.attr("hourDuration"),
                daysOfWeek: [button.attr("daysOfWeek")],
                startTime: button.attr("startTime"),
                endTime: button.attr("endTime"),
                type: button.attr("type"),
                overlap: false,
                durationEditable: false,
                startEditable: false,
                course: button.attr("course"),
                program: button.attr("program"),
                section: button.attr("section"),
                room: button.attr("room"),
                level: button.attr("level"),
                faculty: button.attr("faculty"),
                current: false,
              });
              hoursCount += parseInt(button.attr("hourDuration"));
            });
            unitsCount += parseInt(currentButton.attr("units"));

            $("#spanUnits").html(unitsCount);
            $("#spanHours").html(hoursCount);
            courseSearch.trigger("change");
            Toast.fire({
              icon: "success",
              title: "Successfully Assigned",
            });
          })
          .catch((error) => {
            console.log(error);
            Toast.fire({ icon: "error", title: "Something went wrong" });
          });
      }
    });
  }
  return fetch(`/api/schedules/assign/${schedules}`, {
    method: "PUT",
    headers: {
      "csrf-token": csrf,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ faculty: faculty.val() }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      courseList.each(function (i, obj) {
        const button = $(obj);
        calendar.addEvent({
          id: button.attr("id"),
          hourDuration: button.attr("hourDuration"),
          daysOfWeek: [button.attr("daysOfWeek")],
          startTime: button.attr("startTime"),
          endTime: button.attr("endTime"),
          type: button.attr("type"),
          overlap: false,
          durationEditable: false,
          startEditable: false,
          course: button.attr("course"),
          program: button.attr("program"),
          section: button.attr("section"),
          room: button.attr("room"),
          level: button.attr("level"),
          faculty: button.attr("faculty"),
          current: false,
        });
        hoursCount += parseInt(button.attr("hourDuration"));
      });
      unitsCount += parseInt(currentButton.attr("units"));

      $("#spanUnits").html(unitsCount);
      $("#spanHours").html(hoursCount);
      courseSearch.trigger("change");
      Toast.fire({
        icon: "success",
        title: "Successfully Assigned",
      });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something went wrong" });
    });
};
