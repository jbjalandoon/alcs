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
const currentCourseHourCount = {};
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
                const course = info.event.extendedProps.course;
                const end = moment(info.event.endStr);
                const start = moment(info.event.startStr);
                const durationHours = moment
                  .duration(end.diff(start))
                  .asHours();
                let currentHour, maxHours;
                if (info.event.extendedProps.courseType === "lecture") {
                  currentCourseHourCount[course].currentLecture -=
                    durationHours;
                  maxHours = currentCourseHourCount[course].maxLecture;
                  currentHour = currentCourseHourCount[course].currentLecture;
                } else {
                  currentCourseHourCount[course].currentLab -= durationHours;
                  maxHours = currentCourseHourCount[course].maxLab;
                  currentHour = currentCourseHourCount[course].currentLab;
                }
             
                console.log(
                  $("#external-events").find(
                    `[course='${course}'][courseType='${info.event.extendedProps.courseType}']`
                  )
                );
                $("#external-events")
                  .find(
                    `[course='${course}'][courseType='${info.event.extendedProps.courseType}']`
                  )
                  .attr(
                    "hour",
                    `${Math.trunc(maxHours - currentHour)}:${
                      (maxHours - currentHour) % 1 === 0 ? "00" : "30"
                    }`
                  );

                info.event.remove();
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
  eventResize: function (info) {
    if ($("#roomForm").val() === "") {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }

    const id = info.event.extendedProps.scheduleID;
    const end = moment(info.event.endStr);
    const start = moment(info.event.startStr);
    const course = info.event.extendedProps.course;
    const durationHours = moment.duration(end.diff(start)).asHours();
    const type = info.event.extendedProps.courseType;
    const maxHours =
      type === "lecture"
        ? currentCourseHourCount[course].maxLecture
        : currentCourseHourCount[course].maxLab;

    const currentHour =
      type === "lecture"
        ? Math.abs(
            currentCourseHourCount[course].currentLecture -
              info.event.extendedProps.hourDuration +
              durationHours
          )
        : Math.abs(
            currentCourseHourCount[course].currentLab -
              info.event.extendedProps.hourDuration +
              durationHours
          );

    const startMinutes =
      info.event.start.getMinutes() == 0
        ? "00"
        : info.event.start.getMinutes().toString();
    const endMinutes =
      info.event.end.getMinutes() == 0
        ? "00"
        : info.event.end.getMinutes().toString();
    if (currentHour > maxHours) {
      Toast.fire({ icon: "warning", title: "Sobra na be" });
      return info.revert();
    }
    fetch(`/api/schedules/adjust/${semester}/${id}`, {
      method: "PUT",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
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
        if (type === "lecture") {
          currentCourseHourCount[course].currentLecture = currentHour;
        } else {
          currentCourseHourCount[course].currentLab = currentHour;
        }
        info.event.setExtendedProp("hourDuration", durationHours);
        $("#external-events")
          .find(`[course='${course}'][courseType='${type}']`)
          .attr(
            "hour",
            `${Math.trunc(maxHours - currentHour)}:${
              (maxHours - currentHour) % 1 === 0 ? "00" : "30"
            }`
          );
        Toast.fire({
          title: "Successfully Edited",
          icon: "success",
        });
      })
      .catch((error) => {
        info.revert();
        console.log(error);
        displayToast(error);
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
  for (const prop of Object.getOwnPropertyNames(currentCourseHourCount)) {
    delete currentCourseHourCount[prop];
  }
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
        currentCourseHourCount[element.course.courseCode] = {
          currentLecture: null,
          maxLecture: null,
          currentLab: null,
          maxLab: null,
        };
        for (let i = 0; i < 2; i++) {
          const card = $("<div></div>");
          card.addClass("card mb-1");
          const item = $("<li></li>");
          item.addClass("list-group-item fc-event");
          item.attr({
            course: element.course.courseCode,
            program: "BSIT",
            section: "1",
            level: "1",
            overlap: false,
            durationEditable: true,
            startEditable: true,
            "course-id": element.course._id,
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
            item.addClass("lecture-event");
            lectureList.append(card);
            currentCourseHourCount[element.course.courseCode].maxLecture =
              element.course.lecture;
            currentCourseHourCount[
              element.course.courseCode
            ].currentLecture = 0;
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
            currentCourseHourCount[element.course.courseCode].maxLab =
              element.course.lab;
            currentCourseHourCount[element.course.courseCode].currentLab = 0;
          }
        }
      });
      return fetch("/api/schedules/section/" + scheduleSectionForm.val());
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.forEach((element) => {
        element.schedules.forEach((schedule) => {
          let hour;
          if (schedule.type === "lecture") {
            currentCourseHourCount[element.course.courseCode].currentLecture +=
              schedule.hour;
            hour = Math.abs(
              currentCourseHourCount[element.course.courseCode].currentLecture -
                currentCourseHourCount[element.course.courseCode].maxLecture
            );
          } else {
            currentCourseHourCount[element.course.courseCode].currentLab +=
              schedule.hour;
            hour = Math.abs(
              currentCourseHourCount[element.course.courseCode].currentLab -
                currentCourseHourCount[element.course.courseCode].maxLab
            );
          }
          const hourStr = `${Math.trunc(hour)}:${hour % 1 === 0 ? "00" : "30"}`;
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
            current: true,
          });
          $("#external-events")
            .find(
              `[course='${element.course.courseCode}'][coursetype='${schedule.type}']`
            )
            .attr("hour", hourStr);
        });
      });
      calendar.render();
    })
    .catch((error) => {
      console.log(error);
    });
  $("#scheduleContent").removeClass("d-none");
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
      return fetch(`/api/schedules/room/${semester}/${$("#roomForm").val()}`);
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
        if (element.section != scheduleSectionForm.val()) {
          calendar.addEvent({
            scheduleID: element._id,
            hourDuration: element.hour,
            daysOfWeek: [element.day],
            startTime: element.startTime,
            endTime: element.endTime,
            courseType: element.type,
            overlap: false,
            durationEditable: false,
            startEditable: true,
            course: element.course.courseCode,
            program: element.program.programCode,
            section: element.sectionName,
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
