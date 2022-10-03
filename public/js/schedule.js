// import select2 from 'select2';

// Finding Schedule Form
const scheduleSchoolYearForm = $("#schedule-form #school_year");
const scheduleSemesterForm = $("#schedule-form #semester");
const scheduleProgramForm = $("#schedule-form #program");
const scheduleYearLevelForm = $("#schedule-form #year_level");
const scheduleSectionForm = $("#schedule-form #section");

const course_schedule = [];
const room_schedule = [];

// Assigning Schedule
let scheduleCourseForm;
let scheduleRoomForm;
let scheduleFromForm;
let scheduleToForm;
let scheduleDayForm;
let csrf;
// Buttons
const scheduleSubmitButton = $("#schedule-form #submit");
let assignSubmitButton;

let scheduleModal;

// Tables
const scheduleTable = $("#scheduleTable");

scheduleSchoolYearForm.on("change", () => {
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-semester-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
    },
    dataType: "JSON",
    success: (response) => {
      response.semesters.forEach((semester) => {
        scheduleSemesterForm.append(
          new Option(semester.sem.toUpperCase() + " SEMESTER", semester.sem)
        );
        scheduleSemesterForm.attr("disabled", false);
        scheduleSubmitButton.addClass("d-none");
      });
    },
  });
});

scheduleSemesterForm.on("change", () => {
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-program-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
      semester: scheduleSemesterForm.val(),
    },
    dataType: "json",
    success: (response) => {
      scheduleProgramForm.find("option:not(:first)").remove();
      response.programs.forEach((program) => {
        scheduleProgramForm.append(
          new Option(
            program.program.program_name.toUpperCase(),
            program.program._id
          )
        );
        scheduleYearLevelForm.val("");
        scheduleYearLevelForm.attr("disabled", true);
        scheduleProgramForm.val("");
        scheduleProgramForm.attr("disabled", false);
        scheduleSubmitButton.addClass("d-none");
      });
    },
  });
});

scheduleProgramForm.on("change", () => {
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-level-list",
    type: "GET",
    data: {
      school_year: scheduleSchoolYearForm.val(),
      semester: scheduleSemesterForm.val(),
      program: scheduleProgramForm.val(),
    },
    dataType: "json",
    success: (response) => {
      scheduleYearLevelForm.find("option:not(:first)").remove();
      response.years.forEach((year) => {
        scheduleYearLevelForm.append(
          new Option(year.year_level.level.toUpperCase(), year.year_level._id)
        );
        scheduleYearLevelForm.attr("disabled", false);
      });
    },
  });
});

scheduleYearLevelForm.on("change", () => {
  const school_year = scheduleSchoolYearForm.val();
  const semester = scheduleSemesterForm.val();
  const program = scheduleProgramForm.val();
  const year_level = scheduleYearLevelForm.val();
  $.ajax({
    url: "http://localhost:3000/admin/schedules/get-sections-list",
    type: "GET",
    data: {
      school_year: school_year,
      semester: semester,
      program: program,
      year_level: year_level,
    },
    dataType: "json",
    success: (response) => {
      scheduleSectionForm.find("option:not(:first)").remove();
      response.sections.forEach((section) => {
        scheduleSectionForm.append(
          new Option(section.section.toUpperCase(), section.section)
        );
      });
      scheduleSectionForm.attr("disabled", false);
    },
  });
});

scheduleSectionForm.on("change", () => {
  scheduleSubmitButton.removeClass("d-none");
});

scheduleSubmitButton.on("click", () => {
  const school_year = scheduleSchoolYearForm.val();
  const semester = scheduleSemesterForm.val();
  const program = scheduleProgramForm.val();
  const year_level = scheduleYearLevelForm.val();
  const section = scheduleSectionForm.val();

  $.ajax({
    url: "http://localhost:3000/admin/schedules/courses",
    type: "GET",
    dataType: "html",
    data: {
      school_year: school_year,
      semester: semester,
      program: program,
      year_level: year_level,
      section: section,
    },
    success: (response) => {
      $("#courses").html(response);
      renderSchedule();
    },
  });
});

function renderSchedule() {
  var roomForm = $("#roomForm");
  var Calendar = FullCalendar.Calendar;
  var Draggable = FullCalendar.Draggable;
  const calendarEl = document.getElementById("asd");
  var draggable;
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
    events: {
      url: "/admin/schedules/unavailable",
      method: "GET",
      extraParams: {
        school_year: scheduleSchoolYearForm.val(),
        semester: scheduleSemesterForm.val(),
        program: scheduleProgramForm.val(),
        year_level: scheduleYearLevelForm.val(),
        section: scheduleSectionForm.val(),
      },
      editable: false,
      failure: function () {
        alert("there was an error while fetching events!");
      },
    },
    droppable: true, // this allows things to be dropped onto the calendar
    eventReceive: function (info) {
      const startMinutes =
        info.event.start.getMinutes() == 0
          ? "00"
          : info.event.start.getMinutes().toString();
      const endMinutes =
        info.event.end.getMinutes() == 0
          ? "00"
          : info.event.end.getMinutes().toString();
      $.ajax({
        url: "/admin/schedules/set",
        type: "POST",
        data: {
          course: info.event.id,
          day: info.event.start.getDay(),
          start_time:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          end_time:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
          room: $("#roomForm").val(),
          school_year: scheduleSchoolYearForm.val(),
          semester: scheduleSemesterForm.val(),
          program: scheduleProgramForm.val(),
          year_level: scheduleYearLevelForm.val(),
          section: scheduleSectionForm.val(),
          _csrf: $("#csrf").val(),
        },
        dataType: "json",
        success: (response) => {
          Swal.fire({
            toast: true,
            position: "top-right",
            icon: "success",
            title: "Success",
            customClass: {
              popup: "bg-success",
            },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });
        },
        error: (error) => {
          Swal.fire({
            toast: true,
            position: "top-right",
            icon: "error",
            title: "Error",
            customClass: {
              popup: "bg-danger",
            },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });
        },
      });
      info.draggedEl.parentNode.removeChild(info.draggedEl);
    },
    eventDrop: function (info) {
      const startMinutes =
        info.event.start.getMinutes() == 0
          ? "00"
          : info.event.start.getMinutes().toString();
      const endMinutes =
        info.event.end.getMinutes() == 0
          ? "00"
          : info.event.end.getMinutes().toString();
      $.ajax({
        url: "/admin/schedules/set",
        type: "POST",
        data: {
          course: info.event.id,
          day: info.event.start.getDay(),
          start_time:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          end_time:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
          room: roomForm.val(),
          school_year: scheduleSchoolYearForm.val(),
          semester: scheduleSemesterForm.val(),
          program: scheduleProgramForm.val(),
          year_level: scheduleYearLevelForm.val(),
          section: scheduleSectionForm.val(),
          _csrf: $("#csrf").val(),
        },
        dataType: "json",
        success: (response) => {
          Swal.fire({
            toast: true,
            position: "top-right",
            icon: "success",
            title: "Success",
            customClass: {
              popup: "bg-success",
            },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });
        },
        error: (error) => {
          Swal.fire({
            toast: true,
            position: "top-right",
            icon: "error",
            title: "Error",
            customClass: {
              popup: "bg-danger",
            },
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });
        },
      });
    },
    eventClick: async function (info) {
      const eventInfo = info.event.extendedProps;
      Swal.fire({
        icon: "info",
        title: eventInfo.header,
        html: eventInfo.text,
        width: "35%",
        input: "select",
        inputPlaceholder: eventInfo.assigned
          ? "Re-assign Faculty"
          : "Assign Faculty",
        customClass: {
          popup: "p-3",
          input: 'd-none',
        },
        showCancelButton: true,
        confirmButtonText: "Save",
        showConfirmButton: eventInfo.assignable ? true : false,
        showDenyButton: eventInfo.assignable ? true : false,
        denyButtonText: `Remove`,
        cancelButtonText: `Close`,
        inputValidator: (value) => {
          return new Promise((resolve) => {
            if (value !== "") {
              resolve();
            } else {
              resolve("You need to select something :)");
            }
          });
        },
        didOpen: () => {
          const element = $(".swal2-select");
          element
            .select2({
              selectionCssClass: eventInfo.assignable ? '' : 'd-none',
              width: "100%",
              ajax: {
                url: "/admin/api/faculty",
                dataType: "json",
                processResults: function (data, params) {
                  const results = data.map((e) => {
                    return {
                      id: e._id,
                      text: e.first_name,
                    };
                  });
                  console.log(results);
                  return {
                    results: results,
                    pagination: {
                      more: false,
                    },
                  };
                },
                // Additional AJAX parameters go here; see the end of this chapter for the full code of this example
              },
            })
            .on("select2:open", function () {
              $(".select2-dropdown--above").attr("id", "fix");
              $("#fix").removeClass("select2-dropdown--above");
              $("#fix").addClass("select2-dropdown--below");
            });
        },
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            url: "/admin/schedules/assign",
            type: "POST",
            data: {
              school_year: scheduleSchoolYearForm.val(),
              semester: scheduleSemesterForm.val(),
              program: scheduleProgramForm.val(),
              year_level: scheduleYearLevelForm.val(),
              section: scheduleSectionForm.val(),
              course: info.event._def.extendedProps.course,
              faculty: result.value,
              _csrf: $("#csrf").val(),
            },
            dataType: "json",
            success: (response) => {
              Swal.fire("success");
            },
            error: (response) => {
              console.log(response.responseText);
            },
          });
        }

        if (result.isDenied) {
          Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
          }).then((result) => {
            if (result.isConfirmed) {
              $.ajax({
                url: "/admin/schedules/set",
                type: "POST",
                dataType: "json",
                data: {
                  school_year: scheduleSchoolYearForm.val(),
                  semester: scheduleSemesterForm.val(),
                  program: scheduleProgramForm.val(),
                  year_level: scheduleYearLevelForm.val(),
                  section: scheduleSectionForm.val(),
                  course: info.event._def.publicId,
                  day: null,
                  from: null,
                  to: null,
                  room: null,
                  _csrf: $("#csrf").val(),
                },
                success: (response) => {
                  Swal.fire({
                    toast: true,
                    position: "top-right",
                    icon: "success",
                    title: "Success",
                    customClass: {
                      popup: "bg-success",
                    },
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                  });
                  $.ajax({
                    url: "http://localhost:3000/admin/schedules/courses",
                    type: "GET",
                    dataType: "html",
                    data: {
                      school_year: scheduleSchoolYearForm.val(),
                      semester: scheduleSemesterForm.val(),
                      program: scheduleProgramForm.val(),
                      year_level: scheduleYearLevelForm.val(),
                      section: scheduleSectionForm.val(),
                    },
                    success: (response) => {
                      info.event.remove();
                      $("#courses").html(response);
                      $("#roomForm").on("change", () => {
                        $.ajax({
                          url: "/admin/schedules/room-section",
                          type: "get",
                          data: {
                            room: $("#roomForm").val(),
                            school_year: scheduleSchoolYearForm.val(),
                            semester: scheduleSemesterForm.val(),
                            program: scheduleProgramForm.val(),
                            year_level: scheduleYearLevelForm.val(),
                            section: scheduleSectionForm.val(),
                          },
                          dataType: "json",
                          success: (response) => {
                            calendar.getEvents().forEach((e) => {
                              e.remove();
                            });
                            response.room.forEach((e) => {
                              calendar.addEvent(e);
                            });
                            response.section.forEach((e) => {
                              calendar.addEvent(e);
                            });
                            var containerEl =
                              document.getElementById("external-events");
                            if (draggable) {
                              draggable.destroy();
                            }
                            draggable = new Draggable(containerEl, {
                              itemSelector: ".fc-event",
                              eventData: function (info) {
                                return {
                                  title: info.innerText,
                                  duration:
                                    "0" + info.getAttribute("units") + ":00",
                                  editable: true,
                                  overlap: false,
                                  id: info.getAttribute("course"),
                                };
                              },
                            });
                          },
                          error: (error) => {
                            // console.log(error.responseText);
                          },
                        });
                      });
                    },
                  });
                },
                error: (error) => {
                  console.log(error.responseText);
                },
              });
            }
          });
        }
      });
    },
  });

  roomForm.on("change", () => {
    $.ajax({
      url: "/admin/schedules/room-section",
      type: "get",
      data: {
        school_year: scheduleSchoolYearForm.val(),
        semester: scheduleSemesterForm.val(),
        room: roomForm.val(),
        program: scheduleProgramForm.val(),
        year_level: scheduleYearLevelForm.val(),
        section: scheduleSectionForm.val(),
      },
      dataType: "json",
      success: (response) => {
        console.log(response);
        calendar.getEvents().forEach((e) => {
          e.remove();
        });
        response.room.forEach((e) => {
          calendar.addEvent(e);
        });
        response.section.forEach((e) => {
          calendar.addEvent(e);
        });
        var containerEl = document.getElementById("external-events");
        if (draggable) {
          draggable.destroy();
        }
        draggable = new Draggable(containerEl, {
          itemSelector: ".fc-event",
          eventData: function (info) {
            console.log(info);
            return {
              title: info.innerText,
              duration: "0" + info.getAttribute("units") + ":00",
              editable: true,
              overlap: false,
              id: info.getAttribute("course"),
            };
          },
        });
      },
      error: (error) => {
        console.log(error.responseText);
      },
    });
  });
  calendar.render();
}
