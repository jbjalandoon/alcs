let semester;
const csrf = $("#csrf").val();
const faculty = $("#faculty");
const sameDayHours = [0, 0, 0, 0, 0, 0, 0];
let totalUnit,
  unitsCount = 0,
  hoursCount = 0;
let maxUnits, maxHours;
let unavailableTime = [];

const courseSearch = $("#courseSearch");
const calendarContainer = document.querySelector("#calendarContainer");
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

  eventClick: (info) => {
    if (info.event.display === "background") {
      return;
    }
    Swal.showLoading();
    const deleteEvents = [];
    const eventInfo = info.event.extendedProps;
    fetch(`/api/schedules/sections/view/${semester}/${info.event.id}`)
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
          const sameProgram = element.extendedProps.program === eventInfo.program;
          const sameYear = element.extendedProps.year === eventInfo.year;
          const sameSection = element.extendedProps.section === eventInfo.section;
          const sameCourse = element.extendedProps.course === eventInfo.course;

          if (sameID && sameProgram && sameYear && sameSection && sameCourse) {
            deleteEvents.push(element);
          }
        });
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
              text: "You won't be able to revert this!",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, delete it!",
              preConfirm: () => {
                return fetch("/api/schedules/unassign/" + deleteEvents.map((e) => e.id), {
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
                faculty.trigger("change");
                // let notFound = true;
                // courseSearch.children().each((element) => {
                //   if (result.data.course._id === $(courseSearch.children()[element]).val()) {
                //     notFound = false;
                //   }
                // });
                // if (notFound) {
                //   courseSearch.append(
                //     new Option(
                //       `${result.data.course.courseCode.toUpperCase()} - ${result.data.course.courseDescription.toUpperCase()}`,
                //       result.data.course._id
                //     )
                //   );
                // }
                // if (result.data.course._id == courseSearch.val()) {
                //   courseSearch.trigger("change");
                // }
                // deleteEvents.forEach((element) => {
                //   hoursCount -= parseInt(element.extendedProps.hourDuration);
                //   sameDayHours[element.start.getDay() - 1] -= element.extendedProps.hourDuration;
                //   element.remove();
                // });

                // unitsCount -= parseInt(result.data.course.units);
                // $("#spanUnits").html(unitsCount);
                // $("#spanHours").html(hoursCount);
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

const facultyModal = new bootstrap.Modal($("#facultyModal"));

const calendar = new FullCalendar.Calendar(calendarContainer, config);

(async () => {
  const activeSemester = await getActiveSemester();
  semester = activeSemester.id;
  const semesterName = activeSemester.sem;
  const activeYear = activeSemester.year;
  $("#pageTitle").html(`Faculty Loading S.Y. ${activeYear.toUpperCase()} (${semesterName.toUpperCase()} SEMESTER)`);

  const facultyCounts = await getFacultyCounts();
  const facultyTypeLists = $("#facultyTypeLists");
  facultyCounts.map((e) =>
    facultyTypeLists.append(`<div class="card mb-4 text-white bg-primary flex-fill m-2">
        <div class="card-body pb-4 d-flex justify-content-between align-items-start">
          <div>
            <div class="fs-4 fw-semibold"><span id="${e.facultyType.facultyType}">${e.count}</span>
              <div><a class="text-white" role="button" href="#facultyModalToggle" data-bs-toggle="modal" data-bs-target="#facultyModal" data-bs-type="${
                e.facultyType.facultyType
              }">${e.facultyType.facultyType.toUpperCase()}</a></div>
            </div>
          </div>
        </div>
      </div>`)
  );

  const activeFaculty = await getActiveFaculty();
  faculty.select2({
    width: "100%",
  });
  activeFaculty.map((e) => {
    const firstName = e.userInformation.firstName.toUpperCase();
    const lastName = e.userInformation.lastName.toUpperCase();
    const middleName = e.userInformation.middleName ? e.userInformation.middleName.toUpperCase() : "";
    const name = firstName + " " + middleName + " " + lastName;
    faculty.append(new Option(name.toUpperCase(), e._id));
  });

  if (faculty.val() != null) {
    faculty.trigger("change");
  }

  $(document).on("select2:open", () => {
    document.querySelector(".select2-search__field").focus();
  });

  calendar.render();
})();

const getFacultyCounts = async () => {
  try {
    const request = await fetch(`/api/curriculums/faculty/counts/${semester}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getActiveFaculty = async () => {
  try {
    const request = await fetch(`/api/curriculums/faculty/${semester}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getFacultyInformation = async (faculty) => {
  try {
    const request = await fetch(`/api/faculty/${faculty}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getFacultySchedule = async (faculty) => {
  try {
    const request = await fetch(`/api/schedules/faculty/${semester}/${faculty}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getLoadableSchedules = async (faculty) => {
  try {
    const request = await fetch(`/api/schedules/loadable-schedules/${semester}/${faculty}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getFacultyUnits = async (faculty) => {
  try {
    const request = await fetch(`/api/schedules/faculty/units/${semester}/${faculty}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const getCourseSchedule = async (course) => {
  try {
    const request = await fetch(`/api/schedules?sem=${semester}&course=${course}`);
    const response = await request.json();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

$(facultyModal._element).on("show.bs.modal", async (event) => {
  $(event.currentTarget)
    .find("#modalLabel")
    .html($(event.relatedTarget).attr("data-bs-type").toUpperCase() + " FACULTY MEMBERS");
  const tbody = $(event.currentTarget).find("tbody");

  fetch(`/api/curriculums/faculty/type/${$(event.relatedTarget).attr("data-bs-type")}/${semester}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      tbody.empty();
      result.data.forEach(async (element) => {
        const unitsCount = await fetch(`/api/schedules/faculty/units/${semester}/${element._id}`);
        const units = await unitsCount.json();
        const tr = $("<tr></tr>");
        tbody.append(
          tr
            .append($("<td></td>").attr("id", element._id).html(element.facultyInformation.facultyCode.toUpperCase()))
            .append($("<td></td>").attr("id", element._id).html(element.facultyInformation.lastName.toUpperCase()))
            .append(
              $("<td></td>")
                .attr("id", element._id)
                .html(units.status === 200 ? units.data : 0)
            )
          // .append($("<td></td>").attr('id', element._id).html(element.facultyInformation.facultyCode))
        );
        tr.css("cursor", "pointer");
        tr.on("click", () => {
          faculty.val(element._id).trigger("change");
          facultyModal.hide();
        });
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

faculty.on("change", async (e) => {
  try {
    sameDayHours.fill(0);
    $("#courseList").empty();
    $("#contentRow").removeClass("d-none");
    unavailableTime.length = 0;
    const tags = [];
    const facultyInformation = await getFacultyInformation(e.currentTarget.value);
    const facultySchedules = await getFacultySchedule(e.currentTarget.value);
    const loadableSchedules = await getLoadableSchedules(e.currentTarget.value);
    const facultyUnits = await getFacultyUnits(e.currentTarget.value);

    unitsCount = facultyUnits;
    $("#spanUnits").html(unitsCount);
    console.log(facultyInformation);
    const information = facultyInformation.userInformation;
    $("#spanFacultyType").html(information.facultyType.facultyType.toUpperCase());
    calendar.getEvents().forEach((e) => e.remove());
    information.schedulePreference.map((e) =>
      calendar.addEvent({
        startTime: e.startTime,
        endTime: e.endTime,
        daysOfWeek: [e.day],
        overlap: false,
        durationEditable: false,
        startEditable: false,
        color: "#d9534f",
        display: "background",
      })
    );
    maxUnits = information.facultyType.unitsCap;
    $("#spanMaxUnits").html(maxUnits);
    facultySchedules.forEach((element) => {
      sameDayHours[element.day - 1] += element.hour;
      calendar.addEvent({
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
        color: element.type === "lecture" ? "#007BFF" : "#3399FF",
        textColor: element.type === "lecture" ? "white" : "black",
        program: element.program.programCode,
        section: element.sectionName,
        room: element.room.roomName,
        level: element.level.display,
        faculty: element.faculty,
      });
    });

    courseSearch.find("option").remove();
    loadableSchedules.forEach((e) => {
      courseSearch.append(
        new Option(`${e.course.courseCode.toUpperCase()} - ${e.course.courseDescription.toUpperCase()}`, e._id)
      );
    });
    courseSearch.select2({
      width: "100%",
    });
    if (courseSearch.has("option").length !== 0) {
      courseSearch.trigger("change");
    }
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Something Went Wrong" });
  }
});

courseSearch.on("change", async (e) => {
  try {
    const schedules = await getCourseSchedule(e.currentTarget.value);
    console.log(schedules);
    $("#courseList").empty();

    schedules.forEach((element) => {
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
                `${element.schedules[0].course.courseCode.toUpperCase()} ${element.schedules[0].program.programCode.toUpperCase()} ${element.schedules[0].level.display.toUpperCase()}-${
                  element.schedules[0].sectionName
                }`
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
          daysOfWeek: [element.day],
          startTime: element.startTime,
          endTime: element.endTime,
          type: element.type,
          overlap: false,
          durationEditable: false,
          units: element.course.units,
          startEditable: true,
          course: element.course.courseCode,
          program: element.program.programCode,
          section: element.sectionName,
          room: element.room.roomName,
          level: element.level.display,
          faculty: element.faculty,
          current: false,
        });
        scheduleListItem.html(
          `${days[element.day]} - [${element.startTime} - ${
            element.endTime
          } ${element.room.roomName.toUpperCase()}]  (${element.type.toUpperCase()})`
        );
        scheduleUl.append(scheduleListItem);
        currentTimeRange.push({
          day: element.day,
          range: moment.range(
            new Date(0, 0, 0, element.startTime.split(":")[0], element.startTime.split(":")[1]),
            new Date(0, 0, 0, element.endTime.split(":")[0], element.endTime.split(":")[1])
          ),
        });
      });
      calendar.getEvents().forEach((e) => {
        const eventDay = e.start.getDay();
        const eventRange = moment.range(
          new Date(0, 0, 0, e.start.getHours(), e.start.getMinutes()),
          new Date(0, 0, 0, e.end.getHours(), e.end.getMinutes())
        );
        let conflict = false;
        for (let i = 0; i < currentTimeRange.length; i++) {
          const overlaps = currentTimeRange[i].range.overlaps(eventRange);
          const sameDay = currentTimeRange[i].day === eventDay;
          if (overlaps && sameDay) {
            conflict = true;
            break;
          }
        }
        if (conflict) {
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
          .on("mouseenter", previewSchedule)
          .on("mouseleave", unPreviewSchedule)
          .append(
            $(document.createElement("span"))
              .addClass("badge rounded-pill " + buttonBg)
              .append($(document.createElement("i")).addClass("bi bi-plus-lg"))
          )
      );
      $("#courseList").append(listItem);
    });
  } catch (error) {
    console.error(error);
    Toast.fire({ icon: "warning", title: "Something went wrong" });
  }
});

const assignFaculty = (eventArgs) => {
  const schedules = [];
  let units = 0;
  const currentButton = $(eventArgs.currentTarget);
  const event = calendar.getEvents();
  let isUndesiredSchedule = false;
  const conflictSchedules = [];
  const currentTimeRange = [];
  const limits = [];
  const courseList = currentButton.parent().find("ul").children();
  courseList.each(function (i, obj) {
    const button = $(obj);
    schedules.push($(obj).attr("id"));
    currentTimeRange.push({
      day: parseInt(button.attr("daysofWeek")),
      range: moment.range(
        new Date(0, 0, 0, button.attr("startTime").split(":")[0], button.attr("startTime").split(":")[1]),
        new Date(0, 0, 0, button.attr("endTime").split(":")[0], button.attr("endTime").split(":")[1])
      ),
    });
    sameDayHours[parseInt(button.attr("daysofWeek")) - 1] += parseInt(button.attr("hourDuration"));
    sameDayHours.forEach((element, index) => {
      if (element > 8 && index === parseInt(button.attr("daysofWeek")) - 1) {
        limits.push(days[index + 1]);
      }
    });
  });
  event.forEach((element) => {
    if (!element.extendedProps.preview) {
      const eventDay = element.start.getDay();
      const eventRange = moment.range(
        new Date(0, 0, 0, element.start.getHours(), element.start.getMinutes()),
        new Date(0, 0, 0, element.end.getHours(), element.end.getMinutes())
      );
      let conflict = false;
      for (let i = 0; i < currentTimeRange.length; i++) {
        const overlaps = currentTimeRange[i].range.overlaps(eventRange);
        const sameDay = currentTimeRange[i].day === eventDay;
        if (overlaps && sameDay) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
        if (element.display === "background") {
          isUndesiredSchedule = true;
        } else {
          conflictSchedules.push(element);
        }
      }
    }
  });
  const aboveMax = parseInt(courseList.eq(0).attr("units")) + unitsCount > maxUnits;
  console.log(sameDayHours);

  if (conflictSchedules.length !== 0) {
    return Swal.fire({
      icon: "error",
      title: "Schedule Overlaps",
      html: '<div class="list-group" id="overlapList"></div>',
      willOpen: () => {
        const orderedList = $("<ol></ol>");
        orderedList.addClass("list-group list-group-numbered");
        conflictSchedules.forEach((element) => {
          const startTime = moment(new Date(0, 0, 0, element.start.getHours(), element.start.getMinutes()));
          const endTime = moment(new Date(0, 0, 0, element.end.getHours(), element.end.getMinutes()));
          const listItem = $("<li></li>");
          listItem.addClass("list-group-item d-flex justify-content-between align-items-start");
          const content = $("<div></div>");
          content.addClass("ms-2 me-auto");
          const header = $("<div></div>");
          header.addClass("fw-bold");
          header.html(
            element.extendedProps.course.toUpperCase() +
              ` ${days[element.start.getDay()].toUpperCase()} [${startTime.format("hh:mm A")} - ${endTime.format(
                "hh:mm A"
              )}]`
          );
          content.append(header);
          listItem.append(content);
          orderedList.append(listItem);
        });
        $("#overlapList").empty().append(orderedList);
      },
    });
  }
  if (isUndesiredSchedule || limits.length !== 0 || aboveMax) {
    const textDay = [...new Set(limits)];
    let text = "";
    if (limits.length !== 0) {
      text += `The ${textDay.join(", ")} already exceed 8 hours. `;
    }
    if (isUndesiredSchedule) {
      text += "This schedule is marked as unwanted schedule of the faculty member. ";
    }
    if (aboveMax) {
      text += `The faculty already reached ${parseInt(courseList.eq(0).attr("units")) + unitsCount} units. `;
    }
    text += "Do you still want to continue?";
    return Swal.fire({
      icon: "warning",
      title: "Warning",
      text: text,
      confirmButtonText: "Confirm",
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        return fetch(`/api/schedules/load/${schedules}`, {
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
                color: button.attr("type") === "lecture" ? "#007BFF" : "#3399FF",
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
              units = parseInt(button.attr("units"));
            });
            unitsCount += units;

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
  return fetch(`/api/schedules/load/${schedules}`, {
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
          color: button.attr("type") === "lecture" ? "#007BFF" : "#3399FF",
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
        units = parseInt(button.attr("units"));
      });
      unitsCount += units;

      $("#spanUnits").html(unitsCount);
      calendar.getEvents().forEach((element) => {
        if (element.extendedProps.preview) {
          element.remove();
        }
      });
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

const previewSchedule = (event) => {
  const courseList = $(event.currentTarget).parent().find("ul").children();
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
      preview: true,
      color: "#FFC107",
      durationEditable: false,
      startEditable: false,
      course: button.attr("course"),
      program: button.attr("program"),
      section: button.attr("section"),
      room: button.attr("room"),
      level: button.attr("level"),
    });
    // hoursCount += parseInt(button.attr("hourDuration"));
    // units = parseInt(button.attr("units"));
  });
};

const unPreviewSchedule = (event) => {
  calendar.getEvents().forEach((element) => {
    if (element.extendedProps.preview) {
      element.remove();
    }
  });
};
