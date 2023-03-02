// Finding Schedule Form
const scheduleProgramForm = $("#schedule-form #program");
const scheduleYearLevelForm = $("#schedule-form #year_level");
const scheduleSectionForm = $("#schedule-form #section");
const roomForm = $("#roomForm");
const content = $("#content");
const spinner = $("#spinner");
const csrf = $("#csrf").val();

const createSchedule = async (info) => {
  try {
    const event = info.event;
    const extendedProps = info.event.extendedProps;
    let confirmed = true;

    // check if room is not yet selected
    if (isEmptyRoom()) {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }

    // filter the current schedules to currently dragged day
    const sameDaySchedules = calendar.getEvents().filter((e) => e.start.getDay() === event.start.getDay());

    // sort the filtered schedule
    sameDaySchedules.sort(function (a, b) {
      return a.start - b.start;
    });

    // find the index of currently added schedule
    const currentIndex = sameDaySchedules.findIndex((e) => e.start.getHours() === event.start.getHours());
    // assigning the previous and next schedule
    const previousEvent = currentIndex > 0 ? sameDaySchedules[currentIndex - 1] : null;
    const nextEvent = currentIndex < sameDaySchedules.length - 1 ? sameDaySchedules[currentIndex + 1] : null;
    // getting the time gaps between schedules
    const previousTimeGap = previousEvent != null ? (event.start.getTime() - previousEvent.end.getTime()) / 1000 : null;
    const nextTimeGap = nextEvent != null ? (nextEvent.start.getTime() - event.end.getTime()) / 1000 : null;

    const isPreviousValid = isTimeGapValid(previousTimeGap);
    const isNextValid = isTimeGapValid(nextTimeGap);

    // check if the time gap is large or small
    if (!isPreviousValid || !isNextValid) {
      let previous = false;
      let text = "";

      if (!isPreviousValid) {
        text += `${previousTimeGap / 60 / 60} hour/s of gap from previous schedule`;
        previous = true;
      }

      if (!isNextValid) {
        if (previous) text += " & ";
        text += `${nextTimeGap / 60 / 60} hour/s of gap from next schedule`;
      }

      text += ", Do you still want to continue?";

      const alert = await Swal.fire({
        title: "Are you sure?",
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm",
      });
      confirmed = alert.isConfirmed;
    }

    if (!confirmed) return info.revert();

    const startMinutes = event.start.getMinutes() == 0 ? "00" : event.start.getMinutes().toString();
    const endMinutes = event.end.getMinutes() == 0 ? "00" : event.end.getMinutes().toString();
    const end = moment(event.endStr);
    const start = moment(event.startStr);
    const hour = moment.duration(end.diff(start)).asHours();

    const schedule = await postSchedule({
      courseType: extendedProps.courseType,
      course: extendedProps.courseId,
      day: event.start.getDay(),
      startTime: ("0" + event.start.getHours()).slice(-2) + ":" + startMinutes,
      endTime: ("0" + event.end.getHours()).slice(-2) + ":" + endMinutes,
      room: $("#roomForm").val(),
      hour: hour,
      event: event,
    });
    if (!schedule) {
      info.revert();
      return Toast.fire({
        icon: "warning",
        title: "Something Went Wrong",
      });
    }

    // setting the hours of schedule
    event.setExtendedProp("hourDuration", hour);

    // storing the hours for checking if the max hours already reached
    if (extendedProps.courseType === "lecture") {
      currentCourseHourCount[extendedProps.course].currentLecture =
        currentCourseHourCount[extendedProps.course].maxLecture;
    } else {
      currentCourseHourCount[extendedProps.course].currentLab = currentCourseHourCount[extendedProps.course].maxLab;
    }

    // changing the draggable element to non draggable
    $("#external-events")
      .find(`[course='${extendedProps.course}'][courseType='${extendedProps.courseType}']`)
      .removeClass(`${extendedProps.courseType}-event bg-primary text-light`)
      .addClass("bg-warning text-dark")
      .css("cursor", "")
      .attr("hour", "0:00");

    // setting the schedule id
    event.setExtendedProp("scheduleID", schedule.id);
    Toast.fire({
      icon: "success",
      title: "Schedule Successfully Created",
    });
  } catch (error) {
    console.error(error);
    info.revert();
    Toast.fire({ icon: "warning", title: "Something went wrong" });
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
  slotMinTime: "7:00:00",
  slotMaxTime: "22:00:00",
  validRange: {
    start: "7:00:00",
    end: "22:00:00",
  },
  droppable: true, // this allows things to be dropped onto the calendar
  // for adding schedule
  eventReceive: createSchedule,
  // for editing schedule
  eventDrop: function (info) {
    const id = info.event.extendedProps.scheduleID;
    const existingEvents = [];
    let previousTimeGap, nextTimeGap;

    // Dont accept if room is empty
    if ($("#roomForm").val() === "") {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }

    // Check if the selected room is right for each schedule
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

    // Reverting if the time is below 7 AM and above 9 PM
    if (info.event.start.getHours() <= 6 || info.event.end.getHours() >= 22) {
      Toast.fire({
        title: "Time Exceeds",
        icon: "warning",
      });
      return info.revert();
    }

    // Set the schedule as newly dragged schedule
    info.event.setExtendedProp("new", true);

    // Filter the schedule by currently set day
    calendar.getEvents().forEach((element) => {
      const sameDay = element.start.getDay() === info.event.start.getDay();
      if (sameDay && element.extendedProps.current) {
        existingEvents.push(element);
      }
    });

    // Sort the filtered schedule by time
    existingEvents.sort(function (a, b) {
      return a.start - b.start;
    });

    // Get the index of the dragged schedule
    const currentIndex = existingEvents.findIndex(function (event) {
      return event.extendedProps.new === true;
    });

    // Set the next and previous schedule
    previousEvent = currentIndex > 0 ? existingEvents[currentIndex - 1] : undefined;
    nextEvent = currentIndex < existingEvents.length - 1 ? existingEvents[currentIndex + 1] : undefined;

    // Set the time gap between schedules
    previousTimeGap = previousEvent ? (info.event.start.getTime() - previousEvent.end.getTime()) / 1000 : undefined;
    nextTimeGap = nextEvent ? (nextEvent.start.getTime() - info.event.end.getTime()) / 1000 : undefined;

    // Set the schedule as not new anymore
    info.event.setExtendedProp("new", false);

    // Check if there is a big and small time gap between schedules
    if (previousTimeGap >= 5400 || previousTimeGap < 1800 || nextTimeGap >= 5400 || nextTimeGap < 1800) {
      let previous = false;
      let text = "";
      if (previousTimeGap >= 5400 || previousTimeGap < 1800) {
        text += `${previousTimeGap / 60 / 60} hour/s of gap from previous schedule`;
        previous = true;
      }
      if (nextTimeGap >= 5400 || nextTimeGap < 1800) {
        if (previous) text += " & ";
        text += `${nextTimeGap / 60 / 60} hour/s of gap from next schedule`;
      }
      text += ". This will also remove the currently assigned faculty, Do you still want to continue?";

      Swal.fire({
        title: "Are you sure?",
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm",
        preConfirm: () => {
          const startMinutes = info.event.start.getMinutes() == 0 ? "00" : info.event.start.getMinutes().toString();
          const endMinutes = info.event.end.getMinutes() == 0 ? "00" : info.event.end.getMinutes().toString();

          fetch(`/api/schedules/reassign/${scheduleSectionForm.val()}/${id}`, {
            method: "PUT",
            headers: {
              "csrf-token": csrf,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              day: info.event.start.getDay(),
              startTime: ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
              endTime: ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
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
              info.revert();
              Toast.fire({ icon: "warning", title: "Something Went Wrong" });
              console.log(error);
            });
        },
      })
        .then((result) => {
          if (result.isConfirmed) {
            Toast.fire({
              icon: "success",
              title: "Successfully Adjusted",
            });
          } else {
            info.revert();
          }
        })
        .catch((error) => {
          info.revert();
          console.log(error);
        });
    } else {
      const startMinutes = info.event.start.getMinutes() == 0 ? "00" : info.event.start.getMinutes().toString();
      const endMinutes = info.event.end.getMinutes() == 0 ? "00" : info.event.end.getMinutes().toString();
      Swal.fire({
        title: "Are you sure?",
        text: "Assigned faculty will be remove, You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm",
        preConfirm: () => {
          fetch(`/api/schedules/reassign/${scheduleSectionForm.val()}/${id}`, {
            method: "PUT",
            headers: {
              "csrf-token": csrf,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              day: info.event.start.getDay(),
              startTime: ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
              endTime: ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
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
              info.revert();
              Toast.fire({ icon: "warning", title: "Something Went Wrong" });
              console.log(error);
            });
        },
      })
        .then((result) => {
          if (result.isConfirmed) {
            Toast.fire({
              icon: "success",
              title: "Successfully Edited",
            });
          } else {
            info.revert();
          }
        })
        .catch((error) => {
          info.revert();
          console.log(error);
          displayToast(error);
        });
    }
  },
  // for spliting the schedule
  eventResize: function (info) {
    const existingEvents = [];
    let previousTimeGap, nextTimeGap;
    const id = info.event.extendedProps.scheduleID;
    const end = moment(info.event.endStr);
    const start = moment(info.event.startStr);
    const course = info.event.extendedProps.course;
    const durationHours = moment.duration(end.diff(start)).asHours();
    const type = info.event.extendedProps.courseType;
    const maxHours =
      type === "lecture" ? currentCourseHourCount[course].maxLecture : currentCourseHourCount[course].maxLab;
    const currentHour =
      type === "lecture"
        ? Math.abs(
            currentCourseHourCount[course].currentLecture - info.event.extendedProps.hourDuration + durationHours
          )
        : Math.abs(currentCourseHourCount[course].currentLab - info.event.extendedProps.hourDuration + durationHours);

    const startMinutes = info.event.start.getMinutes() == 0 ? "00" : info.event.start.getMinutes().toString();
    const endMinutes = info.event.end.getMinutes() == 0 ? "00" : info.event.end.getMinutes().toString();

    if ($("#roomForm").val() === "") {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }

    if (currentHour > maxHours) {
      Toast.fire({ icon: "warning", title: "Max Hours Exceeds" });
      return info.revert();
    }

    // Set the schedule as newly dragged schedule
    info.event.setExtendedProp("new", true);

    // Filter the schedule by currently set day
    calendar.getEvents().forEach((element) => {
      const sameDay = element.start.getDay() === info.event.start.getDay();
      if (sameDay && element.extendedProps.current) {
        existingEvents.push(element);
      }
    });

    // Sort the filtered schedule by time
    existingEvents.sort(function (a, b) {
      return a.start - b.start;
    });

    // Get the index of the dragged schedule
    const currentIndex = existingEvents.findIndex(function (event) {
      return event.extendedProps.new === true;
    });

    // Set the next and previous schedule
    previousEvent = currentIndex > 0 ? existingEvents[currentIndex - 1] : undefined;
    nextEvent = currentIndex < existingEvents.length - 1 ? existingEvents[currentIndex + 1] : undefined;

    // Set the time gap between schedules
    previousTimeGap = previousEvent ? (info.event.start.getTime() - previousEvent.end.getTime()) / 1000 : undefined;
    nextTimeGap = nextEvent ? (nextEvent.start.getTime() - info.event.end.getTime()) / 1000 : undefined;

    // Set the schedule as not new anymore
    info.event.setExtendedProp("new", false);

    if (previousTimeGap >= 5400 || previousTimeGap < 1800 || nextTimeGap >= 5400 || nextTimeGap < 1800) {
      let previous = false;
      let text = "";
      if (previousTimeGap >= 5400 || previousTimeGap < 1800) {
        text += `${previousTimeGap / 60 / 60} hour/s of gap from previous schedule`;
        previous = true;
      }
      if (nextTimeGap >= 5400 || nextTimeGap < 1800) {
        if (previous) text += " & ";
        text += `${nextTimeGap / 60 / 60} hour/s of gap from next schedule`;
      }
      text += ". This will also remove the currently assigned faculty, Do you still want to continue?";
      Swal.fire({
        title: "Are you sure?",
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm",
        preConfirm: () => {
          return fetch(`/api/schedules/adjust/${semester}/${id}`, {
            method: "PUT",
            headers: { "csrf-token": csrf, "Content-Type": "application/json" },
            body: JSON.stringify({
              startTime: ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
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
              if (maxHours - currentHour === 0) {
                $("#external-events")
                  .find(`[course='${course}'][courseType='${type}']`)
                  .removeClass(`${type}-event bg-primary text-light`)
                  .addClass("bg-warning text-dark")
                  .css("cursor", "");
              } else {
                $("#external-events")
                  .find(`[course='${course}'][courseType='${type}']`)
                  .addClass(`${type}-event bg-primary text-light`)
                  .removeClass("bg-success bg-warning text-dark")
                  .css("cursor", "move");
              }
              $("#external-events")
                .find(`[course='${course}'][courseType='${type}']`)
                .attr(
                  "hour",
                  `${Math.trunc(maxHours - currentHour)}:${(maxHours - currentHour) % 1 === 0 ? "00" : "30"}`
                );
              Toast.fire({
                title: "Successfully Edited",
                icon: "success",
              });
            });
        },
      })
        .then((result) => {
          if (result.isConfirmed) {
            Toast.fire({
              icon: "success",
              title: "Successfully Adjusted",
            });
          } else {
            info.revert();
          }
        })
        .catch((error) => {
          info.revert();
          console.log(error);
          displayToast(error);
        });
    } else {
      Swal.fire({
        title: "Are you sure?",
        text: "Assigned faculty will be remove, You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Confirm",
        preConfirm: () => {
          return fetch(`/api/schedules/adjust/${semester}/${id}`, {
            method: "PUT",
            headers: { "csrf-token": csrf, "Content-Type": "application/json" },
            body: JSON.stringify({
              startTime: ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
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
              if (maxHours - currentHour === 0) {
                $("#external-events")
                  .find(`[course='${course}'][courseType='${type}']`)
                  .removeClass(`${type}-event bg-primary text-light`)
                  .addClass("bg-warning text-dark")
                  .css("cursor", "");
              } else {
                $("#external-events")
                  .find(`[course='${course}'][courseType='${type}']`)
                  .addClass(`${type}-event bg-primary text-light`)
                  .removeClass("bg-success bg-warning text-dark")
                  .css("cursor", "move");
              }
              $("#external-events")
                .find(`[course='${course}'][courseType='${type}']`)
                .attr(
                  "hour",
                  `${Math.trunc(maxHours - currentHour)}:${(maxHours - currentHour) % 1 === 0 ? "00" : "30"}`
                );
              Toast.fire({
                title: "Successfully Edited",
                icon: "success",
              });
            });
        },
      })
        .then((result) => {
          if (result.isConfirmed) {
            Toast.fire({
              icon: "success",
              title: "Successfully Adjusted",
            });
          } else {
            info.revert();
          }
        })
        .catch((error) => {
          info.revert();
          console.log(error);
          displayToast(error);
        });
    }
  },
  // for schedule information
  eventClick: function (info) {
    const id = info.event.extendedProps.scheduleID;
    fetch(`/api/schedules/single/${semester}/${id}`)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        Swal.fire({
          icon: "info",
          title: `${result.data.course.courseCode.toUpperCase()} (${result.data.program.programCode.toUpperCase()} ${
            result.data.level.display
          }-${result.data.sectionName})- ${result.data.type.toUpperCase()}`,
          text: `${days[result.data.day]} ${result.data.startTime} - ${
            result.data.endTime
          } (${result.data.room.roomName.toUpperCase()}${
            result.data.faculty ? "/" + result.data.faculty.userInformation.facultyCode.toUpperCase() : ""
          })`,
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
              text: "The assigned faculty will also remove, You won't be able to revert this!",
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
                const durationHours = moment.duration(end.diff(start)).asHours();
                let currentHour, maxHours;
                if (info.event.extendedProps.courseType === "lecture") {
                  currentCourseHourCount[course].currentLecture -= durationHours;
                  maxHours = currentCourseHourCount[course].maxLecture;
                  currentHour = currentCourseHourCount[course].currentLecture;
                } else {
                  currentCourseHourCount[course].currentLab -= durationHours;
                  maxHours = currentCourseHourCount[course].maxLab;
                  currentHour = currentCourseHourCount[course].currentLab;
                }

                if ($("#roomForm").val() === "") {
                  $("#external-events")
                    .find(`[course='${course}'][courseType='${info.event.extendedProps.courseType}']`)
                    .removeClass("bg-warning text-dark")
                    .addClass(`${info.event.extendedProps.courseType}-event bg-success text-light`);
                } else {
                  $("#external-events")
                    .find(`[course='${course}'][courseType='${info.event.extendedProps.courseType}']`)
                    .removeClass("bg-warning text-dark")
                    .addClass(`${info.event.extendedProps.courseType}-event bg-primary text-light`)
                    .css("cursor", "move");
                }

                $("#external-events")
                  .find(`[course='${course}'][courseType='${info.event.extendedProps.courseType}']`)
                  .attr(
                    "hour",
                    `${Math.trunc(maxHours - currentHour)}:${(maxHours - currentHour) % 1 === 0 ? "00" : "30"}`
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
  eventDidMount: function (info) {
    renderEvent(info);
  },
};

// const socket = io("http://localhost:3000");
//       socket.on("create", (data) => {
//         calendar.addEvent({
//           ...data.event,
//         });
//       });

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
const calendarEl = document.getElementById("calendar");
const calendar = new FullCalendar.Calendar(calendarEl, config);

(async () => {
  const semesterData = await getActiveSemester();
  if (semesterData === null) {
    return Toast.fire({
      icon: "warning",
      title: "No Active Semester",
    });
  }
  semester = semesterData.id;
  document.querySelector("#card-title").innerHTML = `S.Y. ${
    semesterData.year
  } (${semesterData.sem.toUpperCase()} SEMESTER)`;

  const programs = await getPrograms();
  if (programs.length === 0) {
    scheduleProgramForm.attr("disabled", true);
    scheduleYearLevelForm.attr("disabled", true);
    scheduleSectionForm.attr("disabled", true);
    return Toast.fire({
      icon: "warning",
      title: "Program is Empty",
    });
  }

  programs.forEach((element) => {
    scheduleProgramForm.append(new Option(element.program.programCode.toUpperCase(), element._id));
  });

  scheduleProgramForm.trigger("change");

  const rooms = await getRooms();
  if (rooms.length === 0) {
    roomForm.attr("disabled", true);
  }
  roomForm.select2({
    placeholder: "Select a Room",
    width: "100%",
  });

  rooms.forEach((element) => {
    if (element.laboratory) {
      roomForm.find("#optLab").append(new Option(element.roomName.toUpperCase(), element._id));
    } else {
      roomForm.find("#optLecture").append(new Option(element.roomName.toUpperCase(), element._id));
    }
  });

  content.removeClass("d-none");
  spinner.addClass("d-none");
  calendar.render();
})();

scheduleProgramForm.on("change", async (event) => {
  try {
    scheduleYearLevelForm.empty();
    scheduleSectionForm.empty();
    const levels = await getYearLevel($(event.currentTarget).val());
    if (levels.length === 0) {
      scheduleYearLevelForm.attr("disabled", true);
      scheduleSectionForm.attr("disabled", true);
      return Toast.fire({
        icon: "warning",
        title: "No Year Level Found",
      });
    }
    scheduleYearLevelForm.attr("disabled", false);
    scheduleSectionForm.attr("disabled", false);
    levels.forEach((element) => {
      scheduleYearLevelForm.append(new Option(element.level.display.toUpperCase(), element._id));
    });
    scheduleYearLevelForm.trigger("change");
  } catch (error) {
    console.error(error);
  }
});

scheduleYearLevelForm.on("change", async (event) => {
  try {
    const sections = await getSection($(event.currentTarget).val());
    scheduleSectionForm.empty();
    if (sections.length === 0) {
      scheduleSectionForm.attr("disabled", true);
      return Toast.fire({
        icon: "warning",
        title: "No Section Found",
      });
    }
    sections.forEach((element) => {
      scheduleSectionForm.append(new Option(element.section.toUpperCase(), element._id));
    });
    scheduleSectionForm.attr("disabled", false);
    scheduleSectionForm.trigger("change");
  } catch (error) {
    console.error(error);
  }
});

scheduleSectionForm.on("change", async (event) => {
  const current = $(event.currentTarget);

  for (const prop of Object.getOwnPropertyNames(currentCourseHourCount)) {
    delete currentCourseHourCount[prop];
  }

  const events = calendar.getEvents();
  events.forEach((element) => {
    element.remove();
  });

  roomForm.val("").trigger("change");

  const coursesRequest = await fetch(`/api/curriculums/course/${scheduleYearLevelForm.val()}`);
  const courses = await coursesRequest.json();
  const lectureList = $("#external-events #lectureList");
  const labList = $("#external-events #labList");
  lectureList.empty();
  labList.empty();

  if (courses.data.length === 0) {
    roomForm.attr("disabled", true);
    return Toast.fire({
      icon: "warning",
      title: "No Courses Found",
    });
  }
  roomForm.attr("disabled", false);
  courses.data.forEach((element) => {
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
      item.addClass("list-group-item bg-success text-light fc-event");
      item.attr({
        course: element.course.courseCode,
        program: scheduleProgramForm.children(":selected").text(),
        section: scheduleSectionForm.children(":selected").text(),
        new: true,
        level: scheduleYearLevelForm.children(":selected").text(),
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
        item.attr("color", "#007BFF");
        item.attr("textColor", "white");
        item.attr("hour", element.course.lecture);
        item.addClass("lecture-event");
        lectureList.append(card);
        currentCourseHourCount[element.course.courseCode].maxLecture = element.course.lecture;
        currentCourseHourCount[element.course.courseCode].currentLecture = 0;
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
        item.attr("color", "#5AA2E8");
        item.attr("textColor", "black");
        item.attr("hour", element.course.lab);
        item.addClass("lab-event");
        labList.append(card);
        currentCourseHourCount[element.course.courseCode].maxLab = element.course.lab;
        currentCourseHourCount[element.course.courseCode].currentLab = 0;
      }
    }
  });

  const schedules = await getSectionSchedule(current.val());

  schedules.data.forEach((element) => {
    element.schedules.forEach((schedule) => {
      let hour;
      if (schedule.type === "lecture") {
        currentCourseHourCount[element.course.courseCode].currentLecture += schedule.hour;
        hour = Math.abs(
          currentCourseHourCount[element.course.courseCode].currentLecture -
            currentCourseHourCount[element.course.courseCode].maxLecture
        );
      } else {
        currentCourseHourCount[element.course.courseCode].currentLab += schedule.hour;
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
        color: schedule.type === "lecture" ? "#007BFF" : "#3399FF",
        textColor: schedule.type === "lecture" ? "white" : "black",
        startEditable: true,
        course: element.course.courseCode,
        program: element.program.programCode,
        faculty: element.faculty != null ? element.faculty.userInformation.facultyCode : null,
        section: element.sectionName,
        room: schedule.room.roomName,
        level: element.yearLevel.display,
        current: true,
      });
      if (hour === 0) {
        $("#external-events")
          .find(`[course='${element.course.courseCode}'][coursetype='${schedule.type}']`)
          .removeClass(`${schedule.type}-event bg-success text-light`)
          .addClass(`bg-warning text-dark`)
          .css("curses", "");
      }
      $("#external-events")
        .find(`[course='${element.course.courseCode}'][coursetype='${schedule.type}']`)
        .attr("hour", hourStr);
    });
  });
});

roomForm.on("change", async (event) => {
  const current = $(event.currentTarget);
  if (current.val() === null) {
    return;
  }

  const roomDataRequest = await fetch(`/api/rooms/${current.val()}`);
  const roomData = await roomDataRequest.json();
  isLaboratorySelect = roomData.data.laboratory;

  const roomSchedulesRequest = await fetch(`/api/schedules/room/${semester}/${$("#roomForm").val()}`);
  const roomSchedules = await roomSchedulesRequest.json();

  const events = calendar.getEvents();
  events.forEach((element) => {
    if (!element.extendedProps.current) {
      element.remove();
    }
  });
  roomSchedules.data.forEach((element) => {
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
        startEditable: false,
        course: element.course.courseCode,
        program: element.program.programCode,
        section: element.sectionName,
        room: element.room.roomName,
        level: element.level.display,
        faculty: element.faculty ? element.faculty.userInformation.facultyCode : null,
        current: false,
        color: "#FFC107",
        textColor: "black",
      });
    }
  });

  if (draggable) {
    draggable.destroy();
  }

  let Draggable = FullCalendar.Draggable;
  $(".fc-event").removeClass("bg-primary bg-success text-light");
  $(".fc-event").css("cursor", "default");
  if (isLaboratorySelect) {
    selector = ".lab-event";
    $(".lab-event").addClass("bg-primary text-light");
    $(".lecture-event").addClass("bg-success text-light");
    $(".lab-event").css("cursor", "move");
  } else {
    selector = ".lecture-event";
    $(".lecture-event").addClass("bg-primary text-light");
    $(".lab-event").addClass("bg-success text-light");
    $(".lecture-event").css("cursor", "move");
  }
  draggable = new Draggable(document.getElementById("external-events"), {
    itemSelector: selector,
    eventData: function (info) {
      return {
        duration: "0" + info.getAttribute("hour") + ":00",
        durationEditable: true,
        startEditable: true,
        current: true,
        overlap: false,
        new: info.getAttribute("new") === "true" ? true : false,
        course: info.getAttribute("course"),
        color: info.getAttribute("color"),
        textColor: info.getAttribute("textColor"),
        courseId: info.getAttribute("course-id"),
        program: info.getAttribute("program"),
        section: info.getAttribute("section"),
        room: $("#roomForm").find(":selected").text(),
        level: info.getAttribute("level"),
        courseType: info.getAttribute("courseType"),
      };
    },
  });
});

const getPrograms = async () => {
  try {
    const programRequest = await fetch("/api/curriculums/programs/" + semester);
    const programs = await programRequest.json();

    return programs.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getYearLevel = async (program) => {
  try {
    const levelRequest = await fetch("/api/curriculums/levels/" + program);
    const levels = await levelRequest.json();

    return levels.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getSection = async (level) => {
  try {
    const sectionRequest = await fetch("/api/curriculums/sections/" + level);
    const sections = await sectionRequest.json();

    return sections.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getRooms = async () => {
  try {
    const request = await fetch("/api/rooms");
    const rooms = await request.json();

    return rooms.data;
  } catch (error) {
    console.error;
    return [];
  }
};

const isEmptyRoom = () => {
  if (roomForm.val() === null) {
    return true;
  }
  return false;
};

const getSectionSchedule = async (section) => {
  try {
    const schedulesRequest = await fetch(`/api/schedules/section/${section}`);
    const schedules = await schedulesRequest.json();

    return schedules;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const isTimeGapValid = (milliseconds) => {
  if (milliseconds === null) return true;
  if (milliseconds >= 5400 || milliseconds === 0) return false;
  return true;
};

const postSchedule = async (body) => {
  try {
    const postScheduleRequest = await fetch(`/api/schedules/assign/${scheduleSectionForm.val()}`, {
      method: "POST",
      headers: {
        "csrf-token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const postScheduleResponse = await postScheduleRequest.json();
    return postScheduleResponse;
  } catch (error) {
    console.error(error);
    Toast.fire({
      icon: "warning",
      title: "Something went wrong in creating schedule",
    });
    return false;
  }
};

function renderEvent(info) {
  const titleEl = info.el.querySelector(".fc-event-title");
  const timeEl = info.el.querySelector(".fc-event-time");
  info.el.style.textAlign = "center";
  const faculty = info.event.extendedProps.faculty ? info.event.extendedProps.faculty.toUpperCase() : "";
  const course = info.event.extendedProps.course.toUpperCase();
  const program = info.event.extendedProps.program.toUpperCase();
  const section = info.event.extendedProps.section.toUpperCase();
  const room = info.event.extendedProps.room.toUpperCase();
  const level = info.event.extendedProps.level.toUpperCase();
  const type = info.event.extendedProps.courseType.toUpperCase();

  titleEl.innerHTML = `${course}<br>${program}${level}-${section}<br>${room}<br>${faculty}`;
}

function findClosestTime(datetimes, targetDatetime) {
  let closestDatetimeIndex = 0;

  // Loop through the remaining datetimes and update the closestDatetimeIndex variable if a closer datetime is found
  for (let i = 1; i < datetimes.length; i++) {
    const closestTimeDiff = Math.abs(targetDatetime - datetimes[closestDatetimeIndex]);
    const currentTimeDiff = Math.abs(targetDatetime - datetimes[i]);

    if (currentTimeDiff < closestTimeDiff) {
      closestDatetimeIndex = i;
    }
  }

  return closestDatetimeIndex;
}
