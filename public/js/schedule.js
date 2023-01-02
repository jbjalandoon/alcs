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
console.log(semester);
let scheduleModal;

// Tables
const scheduleTable = $("#scheduleTable");

fetch("/api/curriculums/active")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result) {
    }
    if (result.data.length === 0) {
      return Toast.fire({
        title: "There is no current active semester",
        icon: "warning",
      });
    }
    semester = result.data[0].semesters._id;
    document.querySelector("#card-title").innerHTML = `${
      result.data[0].school_year[0].year
    } (${result.data[0].semesters.sem.toUpperCase()} SEMESTER )`;
    return fetch("/api/curriculums/programs/" + semester);
  })
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      return;
    }
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
    console.log(info.event.id);
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
        $(info.draggedEl.parentNode).remove();
        if (!result.ok) {
          info.revert();

          return Toast.fire({ icon: "error", title: "Something went wrong" });
        }
        // const titleEl = info.draggedEl.querySelector(".fc-event-title");
        // const timeEl = info.draggedEl.querySelector(".fc-event-time");
        // info.draggedEl.style.textAlign = "center";

        // const course = info.event.extendedProps.course;
        // const program = info.event.extendedProps.program;
        // const courseType = info.event.extendedProps.courseType;
        // const section = info.event.extendedProps.section;
        // const room = info.event.extendedProps.room;
        // const level = info.event.extendedProps.level;
        // const faculty = info.event.extendedProps.faculty
        //   ? info.event.extendedProps.faculty
        //   : "";

        // titleEl.innerHTML = `${course} (${courseType.toUpperCase()}) <br> ${program} (${level} - ${section}) <br> ${room} <br> ${faculty}`;
        Toast.fire({ icon: "success", title: "Successfully added" });
      })
      .catch((error) => {
        console.log(error);
        Toast.fire({ icon: "error", title: "Something went wrong" });
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
        if (!result.ok) {
          return;
        }
        const titleEl = info.el.querySelector(".fc-event-title");
        const timeEl = info.el.querySelector(".fc-event-time");
        info.el.style.textAlign = "center";

        const course = info.event.extendedProps.course;
        const program = info.event.extendedProps.program;
        const courseType = info.event.extendedProps.courseType;
        const section = info.event.extendedProps.section;
        const room = info.event.extendedProps.room;
        const level = info.event.extendedProps.level;
        const faculty = info.event.extendedProps.faculty
          ? info.event.extendedProps.faculty
          : "";

        titleEl.innerHTML = `${course} (${courseType.toUpperCase()}) <br> ${program} (${level} - ${section}) <br> ${room} <br> ${faculty}`;
        Toast.fire({ icon: "success", title: "Successfully Edited" });
      })
      .catch((error) => {
        Toast.fire({ icon: "warning", title: "Something Went Wrong" });
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
                  return Toast.fire({
                    icon: "error",
                    title: "Something went wrong",
                  });
                }
                info.event.remove();
                console.log(result.data);
                const card = $("<div></div>");
                card.addClass("card mb-1");
                const item = $("<li></li>");
                item.addClass("list-group-item fc-event");
                item.attr({
                  id: result.data._id,
                  hour: result.data.hour,
                  course: result.data.course.course_code,
                  program: result.data.program.program_code,
                  section: result.data.section_name,
                  // room: element.room.room_name,
                  courseType: result.data.type,
                  level: result.data.level.level,
                });
                item.html(result.data.course.course_description);
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
                  item.addClass("lab-event");

                  $("#external-events #labList").append(card);
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
    const titleEl = info.el.querySelector(".fc-event-title");
    const timeEl = info.el.querySelector(".fc-event-time");
    info.el.style.textAlign = "center";

    const course = info.event.extendedProps.course.toUpperCase();
    const program = info.event.extendedProps.program.toUpperCase();
    const section = info.event.extendedProps.section.toUpperCase();
    const room = info.event.extendedProps.room.toUpperCase();
    const level = info.event.extendedProps.level.toUpperCase();
    let firstName = "",
      middleName = "",
      lastName = "";
    if (info.event.extendedProps.faculty) {
      firstName = info.event.extendedProps.faculty.userInformation.firstName;
      middleName = info.event.extendedProps.faculty.userInformation.middleName;
      lastName = info.event.extendedProps.faculty.userInformation.lastName;
    }

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
});

scheduleProgramForm.on("change", () => {
  scheduleSubmitButton.addClass("d-none");

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
      if (!result.ok) {
        return;
      }
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
      if (!result.ok) {
        return;
      }
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
    });
});

scheduleSectionForm.on("change", () => {
  const events = calendar.getEvents();
  events.forEach((element) => {
    element.remove();
  });
  $("#roomForm").val("").trigger("change");
  $("#facultyLink").attr("href", `/admin/schedules/faculty/${semester}`);
  if ($("#roomForm").val() != "") {
    fetch("/api/schedules/room/" + semester + "/" + $("#roomForm").val())
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        result.data.forEach((element) => {
          const days = ["m", "t", "w", "th", "f", "s"];
          if (element.section != scheduleSectionForm.val()) {
            calendar.addEvent({
              id: element._id,
              course: element.course.courseCode,
              program: element.program.programCode,
              section: element.section_name,
              room: element.room.roomName,
              level: element.level.yearLevel,
              courseType: element.type,
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
      $("#external-events #lectureList").empty();
      $("#external-events #labList").empty();

      result.data.forEach((element) => {
        console.log(element);
        const card = $("<div></div>");
        card.addClass("card mb-1");
        const item = $("<li></li>");
        item.addClass("list-group-item fc-event");
        item.attr({
          id: element._id,
          hour: element.hour,
          course: element.course.courseCode,
          program: element.program.programCode,
          section: element.section_name,
          // room: element.room.room_name,
          courseType: element.type,
          level: element.level.yearLevel,
        });
        item.html(
          element.course.courseCode.toUpperCase() +
            " - " +
            element.course.courseDescription.toUpperCase()
        );
        card.append(item);
        if (element.type == "lab" && element.day == null) {
          item.addClass("lab-event");
          $("#external-events #labList").append(card);
        }
        if (element.type == "lecture" && element.day == null) {
          item.addClass("lecture-event");
          $("#external-events #lectureList").append(card);
        }
        if (element.day != null) {
          const days = ["m", "t", "w", "th", "f", "s"];
          calendar.addEvent({
            id: element._id,
            hourDuration: element.hour,
            daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
            startTime: element.start_time,
            endTime: element.end_time,
            overlap: false,
            editabe: false,
            course: element.course.courseCode,
            program: element.program.programCode,
            section: element.section_name,
            room: element.room.roomName,
            level: element.level.display,
            faculty: element.faculty,
            current: true,
          });
        }
      });

      $("#scheduleContent").removeClass("d-none");
      calendar.render();
    });
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

  console.log($("#roomForm").val());
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
      console.log(result);
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
            overlap: false,
            editabe: false,
            color: "#880000",
            course: element.course.courseCode,
            program: element.program.programCode,
            section: element.section_name,
            room: element.room.roomName,
            level: element.level.display,
            faculty: element.faculty,
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
            title: `${info.innerText} (${$(
              "#roomForm option:selected"
            ).text()})`,
            duration: "0" + info.getAttribute("hour") + ":00",
            editable: true,
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
