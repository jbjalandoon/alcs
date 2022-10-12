// import select2 from 'select2';

// Finding Schedule Form
const scheduleSchoolYearForm = $("#schedule-form #school_year");
const scheduleSemesterForm = $("#schedule-form #semester");
const scheduleProgramForm = $("#schedule-form #program");
const scheduleYearLevelForm = $("#schedule-form #year_level");
const scheduleSectionForm = $("#schedule-form #section");

const calendarEl = document.getElementById("calendar");

const csrf = $("#csrf").val();

var calendar = new FullCalendar.Calendar(calendarEl, {
  allDaySlot: false,
  hiddenDays: [0],
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
    if ($("#roomForm").val() == null) {
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
        console.log(response);
        return response.json();
      })
      .then((result) => {
        info.draggedEl.parentNode.removeChild(info.draggedEl);
        if (!result.ok) {
          return;
        }
      })
      .catch((error) => {
        console.log(error);
      });
  },
  eventDrop: function (info) {
    if ($("#roomForm").val() == null) {
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
        console.log(response);
        return response.json();
      })
      .then((result) => {
        if (!result.ok) {
          return;
        }
      })
      .catch((error) => {
        console.log(error);
      });
  },
  eventClick: function (info) {
    Swal.showLoading();
    const eventInfo = info.event.extendedProps;
    fetch("/api/schedules/" + info.event.id)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result.data);
        if (!result.ok) {
          return;
        }
        Swal.fire({
          icon: "info",
          title: `${result.data.course.course_description} - ${
            result.data.type === "lab" ? "Lab" : "Lecture"
          }`,
          text: `${result.data.day.toUpperCase()} ${result.data.start_time} - ${
            result.data.end_time
          } (${result.data.room.room_name})`,
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
                return fetch("/api/schedules/" + info.event.id, {
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
                if (!clicked.value.ok) {
                  alert("not ok ");
                }
                info.event.remove();
                if (result.data.type == "lab") {
                  $("#external-events #labList").append(
                    `<li class="list-group-item fc-event" hour="${result.data.hour}" id="${result.data._id}">${result.data.course.course_description}</li>`
                  );
                }
                if (result.data.type == "lecture") {
                  $("#external-events #lectureList").append(
                    `<li class="list-group-item fc-event" hour="${result.data.hour}" id="${result.data._id}">${result.data.course.course_description}</li>`
                  );
                }
                alert("ok");
              }
            });
          }
        });
      })
      .then((error) => {
        console.log(error);
      });
  },
});

// Assigning Schedule
let scheduleCourseForm;
let scheduleRoomForm;
let scheduleFromForm;
let scheduleToForm;
let scheduleDayForm;
// Buttons
const scheduleSubmitButton = $("#schedule-form #submit");
let assignSubmitButton;

let scheduleModal;

// Tables
const scheduleTable = $("#scheduleTable");

scheduleSchoolYearForm.on("change", () => {
  fetch("/api/curriculums/semesters/" + scheduleSchoolYearForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        return;
      }
      result.data.forEach((element) => {
        scheduleSemesterForm.append(
          new Option(element.sem.toUpperCase() + " SEMESTER", element._id)
        );
      });
      scheduleSemesterForm.attr("disabled", false);
      scheduleSubmitButton.addClass("d-none");
    });
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-semester-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
    },
    dataType: "JSON",
    success: (response) => {
      response.semesters.forEach((semester) => {});
    },
  });
});

scheduleSemesterForm.on("change", () => {
  fetch("/api/curriculums/programs/" + scheduleSemesterForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        return;
      }
      result.data.forEach((element) => {
        scheduleProgramForm.append(
          new Option(element.program.program_name.toUpperCase(), element._id)
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
});

scheduleProgramForm.on("change", () => {
  fetch("/api/curriculums/year-levels/" + scheduleProgramForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return;
      }
      result.data.forEach((element) => {
        scheduleYearLevelForm.append(
          new Option(element.level.level.toUpperCase(), element._id)
        );
      });
      scheduleYearLevelForm.attr("disabled", false);
    })
    .catch((error) => {
      console.log(error);
    });
  // $.ajax({
  //   url: "http://localhost:3000/admin/schedules/get-level-list",
  //   type: "GET",
  //   data: {
  //     school_year: scheduleSchoolYearForm.val(),
  //     semester: scheduleSemesterForm.val(),
  //     program: scheduleProgramForm.val(),
  //   },
  //   dataType: "json",
  //   success: (response) => {
  //     scheduleYearLevelForm.find("option:not(:first)").remove();
  //     response.years.forEach((year) => {
  //       scheduleYearLevelForm.append(
  //         new Option(year.year_level.level.toUpperCase(), year.year_level._id)
  //       );
  //       scheduleYearLevelForm.attr("disabled", false);
  //     });
  //   },
  // });
});

scheduleYearLevelForm.on("change", () => {
  fetch("/api/curriculums/sections/" + scheduleYearLevelForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return;
      }
      result.data.forEach((element) => {
        scheduleSectionForm.append(
          new Option(element.section.toUpperCase(), element._id)
        );
      });
      scheduleSectionForm.attr("disabled", false);
    })
    .catch((error) => {
      console.log(error);
    });
});

scheduleSectionForm.on("change", () => {
  scheduleSubmitButton.removeClass("d-none");
});

fetch("/api/rooms")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      return;
    }
    result.data.forEach((element) => {
      $("#roomForm").append(
        new Option(element.room_name.toUpperCase(), element._id)
      );
    });
  });

scheduleSubmitButton.on("click", () => {
  const events = calendar.getEvents();
  events.forEach((element) => {
    element.remove();
  });

  if ($("#roomForm").val() != null) {
    fetch("/api/schedules/room/" + $("#roomForm").val())
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (!result.ok) {
          return;
        }
        result.data.forEach((element) => {
          const days = ["m", "t", "w", "th", "f", "s"];

          if (element.section != scheduleSectionForm.val()) {
            calendar.addEvent({
              id: element._id,
              title: element.course.course_description,
              daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
              startTime: element.start_time,
              endTime: element.end_time,
              overlap: false,
              editabe: false,
              color: "#800000",
            });
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  fetch("/api/curriculums/schedules/" + scheduleSectionForm.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return;
      }
      $("#external-events #lectureList").empty();
      $("#external-events #labList").empty();
      result.data.forEach((element) => {
        if (element.type == "lab" && element.day == null) {
          $("#external-events #labList").append(
            `<li class="list-group-item fc-event" hour="${element.hour}" id="${element._id}">${element.course.course_description}</li>`
          );
        }
        if (element.type == "lecture" && element.day == null) {
          $("#external-events #lectureList").append(
            `<li class="list-group-item fc-event" hour="${element.hour}" id="${element._id}">${element.course.course_description}</li>`
          );
        }
        if (element.day != null) {
          const days = ["m", "t", "w", "th", "f", "s"];
          calendar.addEvent({
            id: element._id,
            title: element.course.course_description,
            daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
            startTime: element.start_time,
            endTime: element.end_time,
            overlap: false,
            editable: true,
            current: true,
          });
        }
      });
      $("#scheduleContent").removeClass("d-none");
      calendar.render();
    });
});

$("#roomForm").on("change", () => {
  fetch("/api/schedules/room/" + $("#roomForm").val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      if (!result.ok) {
        return;
      }
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
            title: element.course.course_description,
            daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
            startTime: element.start_time,
            endTime: element.end_time,
            overlap: false,
            editabe: false,
            color: "#800000",
          });
        }
      });
      var Draggable = FullCalendar.Draggable;
      draggable = new Draggable(document.getElementById("external-events"), {
        itemSelector: ".fc-event",
        eventData: function (info) {
          return {
            title: info.innerText,
            duration: "0" + info.getAttribute("hour") + ":00",
            editable: true,
            overlap: false,
            id: info.getAttribute("id"),
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
