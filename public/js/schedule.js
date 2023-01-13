// Finding Schedule Form
const scheduleSchoolYearForm = $("#schedule-form #school_year");
const scheduleSemesterForm = $("#schedule-form #semester");
const scheduleProgramForm = $("#schedule-form #program");
const scheduleYearLevelForm = $("#schedule-form #year_level");
const scheduleSectionForm = $("#schedule-form #section");

let semester;
let isLaboratorySelect;
let draggable;

// Buttons
const scheduleSubmitButton = $("#schedule-form #submit");
let assignSubmitButton;
let scheduleModal;

// Tables
const scheduleTable = $("#scheduleTable");

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (result.data.length === 0) {
      Toast.fire({
        title: "There is no current active semester",
        icon: "warning",
      });
      return Promise.reject();
    }
    semester = result.data[0].semesters._id;
    document.querySelector("#card-title").innerHTML = `${
      result.data[0].schoolYear[0].year
    } (${result.data[0].semesters.sem.toUpperCase()} SEMESTER )`;
    return fetch("/api/curriculums/programs/" + semester);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (result.data.length === 0)
      return Toast.fire({
        icon: "warning",
        title: "Academic Program is empty.",
      });
    result.data.forEach((element) => {
      scheduleProgramForm.append(
        new Option(element.program.programName.toUpperCase(), element._id)
      );
    });
    scheduleYearLevelForm.val("");
    scheduleYearLevelForm.attr("disabled", true);
    scheduleProgramForm.val("");
    scheduleProgramForm.attr("disabled", false);
    scheduleSubmitButton.addClass("d-none");
  })
  .catch((error) => {
    console.log(error);
  });

const calendarEl = document.getElementById("calendar");

const csrf = $("#csrf").val();

const calendar = new FullCalendar.Calendar(calendarEl, {
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
  droppable: true, // this allows things to be dropped onto the calendar
  eventReceive: function (info) {
    console.log(scheduleSectionForm.val());
    const end = moment(info.event.endStr);
    const start = moment(info.event.startStr);
    if ($("#roomForm").val() === "") {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }
    const startMinutes =
      info.event.start.getMinutes() == 0
        ? "00"
        : info.event.start.getMinutes().toString();
    const endMinutes =
      info.event.end.getMinutes() == 0
        ? "00"
        : info.event.end.getMinutes().toString();
    fetch("/api/schedules/assign/" + scheduleSectionForm.val(), {
      method: "POST",
      headers: {
        "csrf-token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseType: info.event.extendedProps.courseType,
        course: info.event.extendedProps.courseId,
        day: info.event.start.getDay(),
        startTime:
          ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
        endTime: ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        room: $("#roomForm").val(),
        hour: moment.duration(end.diff(start)).asHours(),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result);
        info.event.setExtendedProp("scheduleID", result.id);
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
        displayToast(error);
      });
  },
  eventDrop: function (info) {
    if ($("#roomForm").val() === "") {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }
    if (isLaboratorySelect) {
      if (info.event.extendedProps.courseType === "lecture") {
        Toast.fire({ icon: "warning", title: "Please select Lecture Room" });
        return info.revert();
      }
    } else {
      if (info.event.extendedProps.courseType === "lab") {
        Toast.fire({ icon: "warning", title: "Please select Laboratory Room" });
        return info.revert();
      }
    }
    const startMinutes =
      info.event.start.getMinutes() == 0
        ? "00"
        : info.event.start.getMinutes().toString();
    const endMinutes =
      info.event.end.getMinutes() == 0
        ? "00"
        : info.event.end.getMinutes().toString();

    fetch("/api/schedules/set/" + info.event.id, {
      method: "PUT",
      headers: {
        "csrf-token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        day: info.event.start.getDay(),
        start_time:
          ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
        end_time:
          ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        room: $("#roomForm").val(),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        Toast.fire({ icon: "success", title: "Successfully Edited" });
      })
      .catch((error) => {
        Toast.fire({ icon: "warning", title: "Something Went Wrong" });
        console.log(error);
      });
  },
  eventClick: function (info) {
    const id = info.event.extendedProps.scheduleID;
    fetch(`/api/schedules/single/${semester}/${id}`)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        Swal.fire({
          icon: "info",
          title: `${result.data.course.courseDescription.toUpperCase()} - ${result.data.type.toUpperCase()}`,
          text: `${days[result.data.day - 1]} ${result.data.startTime} - ${
            result.data.endTime
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
                return fetch(`/api/schedules/single/${semester}/${id}`, {
                  method: "DELETE",
                  headers: {
                    "csrf-token": csrf,
                  },
                })
                  .then((response) => {
                    return response.json();
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              },
            }).then((clicked) => {
              if (clicked.isConfirmed) {
                info.event.remove();
                console.log(scheduleSectionForm.val());
                console.log(result.data.section);
                if (scheduleSectionForm.val() !== result.data.section)
                  return Toast.fire({
                    icon: "success",
                    title: "Successfully removed",
                  });
                const card = $("<div></div>");
                card.addClass("card mb-1");
                const item = $("<li></li>");
                item.addClass("list-group-item fc-event");
                item.attr({
                  id: result.data._id,
                  hour: result.data.hour,
                  course: result.data.course.courseCode,
                  program: result.data.program.programCode,
                  section: result.data.section_name,
                  courseType: result.data.type,
                  courseType: result.data.type,
                  level: result.data.level.display,
                  overlap: false,
                  durationEditable: false,
                  startEditable: true,
                  current: true,
                });
                item.html(
                  `${result.data.course.courseCode.toUpperCase()} - ${result.data.course.courseDescription.toUpperCase()}`
                );
                card.append(item);
                if (result.data.type == "lab" && result.data.day == null) {
                  item.addClass("lab-event");
                  $("#external-events #labList").append(card);
                }
                if (result.data.type == "lab") {
                  item.addClass("lab-event");

                  $("#external-events #labList").append(card);
                }
                if (result.data.type == "lecture") {
                  item.addClass("lecture-event");

                  $("#external-events #lectureList").append(card);
                }
                if ($("#roomForm").val() !== "") {
                  if (draggable) {
                    draggable.destroy();
                  }
                  let Draggable = FullCalendar.Draggable;
                  $(".fc-event").removeClass("bg-primary text-light");
                  $(".fc-event").css("cursor", "default");
                  if (isLaboratorySelect) {
                    selector = ".lab-event";
                    $(".lab-event").addClass("bg-primary text-light");
                    $(".lab-event").css("cursor", "move");
                  } else {
                    selector = ".lecture-event";
                    $(".lecture-event").addClass("bg-primary text-light");
                    $(".lecture-event").css("cursor", "move");
                  }
                  draggable = new Draggable(
                    document.getElementById("external-events"),
                    {
                      itemSelector: selector,
                      eventData: function (info) {
                        return {
                          duration: "0" + info.getAttribute("hour") + ":00",
                          durationEditable: false,
                          startEditable: true,
                          current: true,
                          overlap: false,
                          course: info.getAttribute("course"),
                          program: info.getAttribute("program"),
                          section: info.getAttribute("section"),
                          room: $("#roomForm").find(":selected").text(),
                          level: info.getAttribute("level"),
                          courseType: info.getAttribute("courseType"),
                          id: info.getAttribute("id"),
                        };
                      },
                    }
                  );
                }
                Toast.fire({ icon: "success", title: "Successfully removed" });
              }
            });
          }
        });
      })
      .catch((error) => {
        Toast.fire({ icon: "error", title: "Something went wrong" });
        console.log(error);
      });
  },
  eventDidMount: function (info) {
    renderEvent(info);
  },
});

scheduleProgramForm.on("change", () => {
  scheduleYearLevelForm.attr("disabled", true).val("");
  scheduleSectionForm.attr("disabled", true).val("");
  scheduleYearLevelForm.find("option").not(":first").remove();
  scheduleSectionForm.find("option").not(":first").remove();
  fetch("/api/curriculums/year-levels/" + scheduleProgramForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $("#scheduleContent").addClass("d-none");
      result.data.forEach((element) => {
        scheduleYearLevelForm.append(
          new Option(element.level.yearLevel.toUpperCase(), element._id)
        );
      });
      scheduleYearLevelForm.attr("disabled", false);
    })
    .catch((error) => {
      console.log(error);
    });
});

scheduleYearLevelForm.on("change", () => {
  scheduleSubmitButton.addClass("d-none");
  scheduleSectionForm.val("");
  scheduleSectionForm.attr("disabled", true);
  scheduleSectionForm.find("option").not(":first").remove();
  fetch("/api/curriculums/sections/" + scheduleYearLevelForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $("#scheduleContent").addClass("d-none");
      if (result.data.length !== 0) {
        result.data.forEach((element) => {
          scheduleSectionForm.append(
            new Option(element.section.toUpperCase(), element._id)
          );
        });
        return scheduleSectionForm.attr("disabled", false);
      }
      Toast.fire({
        title: "No Section Found!",
        icon: "warning",
      });
    })
    .catch((error) => {
      console.log(error);
      displayToast(error);
    });
});

scheduleSectionForm.on("change", () => {
  const events = calendar.getEvents();
  events.forEach((element) => {
    element.remove();
  });
  $("#roomForm").val("").trigger("change");
  fetch("/api/curriculums/course/" + scheduleYearLevelForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const lectureList = $("#external-events #lectureList");
      const labList = $("#external-events #labList");
      lectureList.empty();
      labList.empty();
      result.data.forEach((element) => {
        for (let i = 0; i < 2; i++) {
          const card = $("<div></div>");
          card.addClass("card mb-1");
          const item = $("<li></li>");
          item.addClass("list-group-item fc-event");
          item.attr({
            // id: element._id,
            // hour: element.hour,
            course: element.course.courseCode,
            program: "BSIT",
            // program: element.program.programCode,
            section: "1",
            // courseType: element.type,
            // level: element.level.display,
            level: "1",
            overlap: false,
            durationEditable: true,
            startEditable: true,
            // current: true,
          });

          card.append(item);
          if (element.course.lecture !== 0 && i === 0) {
            item.html(
              element.course.courseCode.toUpperCase() +
                " - " +
                element.course.courseDescription.toUpperCase() +
                " - " +
                element.course.lecture +
                " HOURS"
            );
            item.attr("courseType", "lecture");
            item.attr("hour", element.course.lecture);
            item.attr("course-id", element.course._id);
            item.addClass("lecture-event");
            lectureList.append(card);
          }
          if (element.course.lab !== 0 && i === 1) {
            item.html(
              element.course.courseCode.toUpperCase() +
                " - " +
                element.course.courseDescription.toUpperCase() +
                " - " +
                element.course.lab +
                " HOURS"
            );
            item.attr("courseType", "lab");
            item.attr("hour", element.course.lab);
            item.addClass("lab-event");
            labList.append(card);
          }
        }
      });
      return fetch("/api/schedules/section/" + scheduleSectionForm.val()).then(
        (response) => response.json()
      );
    })
    .then((result) => {
      result.data.forEach((element) => {
        element.schedules.forEach((schedule) => {
          calendar.addEvent({
            scheduleID: schedule._id,
            hourDuration: schedule.hour,
            daysOfWeek: [schedule.day],
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            courseType: schedule.type,
            overlap: false,
            durationEditable: true,
            startEditable: true,
            course: element.course.courseCode,
            program: element.program.programCode,
            section: element.sectionName,
            room: schedule.room.roomName,
            level: element.yearLevel.display,
            // faculty: element.faculty,
            current: true,
          });
        });
      });
    })
    .catch((error) => {
      console.log(error);
    });
  $("#scheduleContent").removeClass("d-none");
  calendar.render();
});

fetch("/api/rooms")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      const roomName = element.roomName.toUpperCase();
      $("#roomForm").select2({
        placeholder: "Select a Room",
        width: "100%", // need to override the changed default
      });
      if (element.laboratory) {
        $("#optLab").append(new Option(roomName, element._id));
      } else {
        $("#optLecture").append(new Option(roomName, element._id));
      }
    });
  });

$("#roomForm").on("change", () => {
  if ($("#roomForm").val() === "") {
    return;
  }

  fetch("/api/rooms/" + $("#roomForm").val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      isLaboratorySelect = result.data.laboratory;
      return fetch(
        "/api/schedules/room/" + semester + "/" + $("#roomForm").val()
      );
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const events = calendar.getEvents();
      events.forEach((element) => {
        if (!element.extendedProps.current) {
          element.remove();
        }
      });
      result.data.forEach((element) => {
        const days = ["m", "t", "w", "th", "f", "s"];
        if (element.section != scheduleSectionForm.val()) {
          calendar.addEvent({
            id: element._id,
            hourDuration: element.hour,
            daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
            startTime: element.start_time,
            endTime: element.end_time,
            courseType: element.type,
            overlap: false,
            durationEditable: false,
            startEditable: true,
            course: element.course.courseCode,
            program: element.program.programCode,
            section: element.section_name,
            room: element.room.roomName,
            level: element.level.display,
            faculty: element.faculty,
            current: false,
            color: "#880000",
          });
        }
      });
      if (draggable) {
        draggable.destroy();
      }
      let Draggable = FullCalendar.Draggable;
      $(".fc-event").removeClass("bg-primary text-light");
      $(".fc-event").css("cursor", "default");
      if (isLaboratorySelect) {
        selector = ".lab-event";
        $(".lab-event").addClass("bg-primary text-light");
        $(".lab-event").css("cursor", "move");
      } else {
        selector = ".lecture-event";
        $(".lecture-event").addClass("bg-primary text-light");
        $(".lecture-event").css("cursor", "move");
      }
      draggable = new Draggable(document.getElementById("external-events"), {
        itemSelector: selector,
        eventData: function (info) {
          return {
            duration: "0" + info.getAttribute("hour") + ":00",
            durationEditable: true,
            startEditable: true,
            hourDuration: info.getAttribute("hour"),
            current: true,
            overlap: false,
            course: info.getAttribute("course"),
            courseId: info.getAttribute("course-id"),
            program: info.getAttribute("program"),
            section: info.getAttribute("section"),
            room: $("#roomForm").find(":selected").text(),
            level: info.getAttribute("level"),
            courseType: info.getAttribute("courseType"),
          };
        },
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

function renderSchedule() {
  var roomForm = $("#roomForm");
  calendar.render();
}

function renderEvent(info) {
  console.log(info.event);
  const titleEl = info.el.querySelector(".fc-event-title");
  const timeEl = info.el.querySelector(".fc-event-time");
  info.el.style.textAlign = "center";

  const course = info.event.extendedProps.course.toUpperCase();
  const program = info.event.extendedProps.program.toUpperCase();
  const section = info.event.extendedProps.section.toUpperCase();
  const room = info.event.extendedProps.room.toUpperCase();
  const level = info.event.extendedProps.level.toUpperCase();
  const type = info.event.extendedProps.courseType.toUpperCase();

  timeEl.innerHTML = "";
  titleEl.innerHTML = `${course} (${type})<br>${program}${level}-${section}<br>${room}<br>`;
}
