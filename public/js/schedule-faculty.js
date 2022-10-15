const sem = $("#sem").val();
const csrf = $("#csrf").val();
const faculty = $("#faculty");

const courseSearch = $("#courseSearch");
const calendarEl = document.getElementById("calendar");
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
  eventClick: (info) => {
    Swal.showLoading();
    const eventInfo = info.event.extendedProps;
    fetch("/api/schedules/" + info.event.id)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
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
                return fetch("/api/schedules/unassign/" + info.event.id, {
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
                  return alert("not ok ");
                }
                info.event.remove();
                console.log(result);
                // console.log(result.data.course._id)
                if (result.data.course._id == courseSearch.val()) {
                  if (result.data.type == "lecture") {
                    $("#lectureList").append(`
                      <li class="list-group-item d-flex justify-content-between align-items-start fc-event">
                        <div class="ms-2 me-auto">
                        <div class="fw-bold">${result.data.day.toUpperCase()} ${
                      result.data.start_time
                    } - ${result.data.end_time} (${
                      result.data.room.room_name
                    })</div>
                        <div day="${result.data.day}" start="${
                      result.data.start_time
                    }" end="${result.data.end_time}" class="drag" id="${
                      result.data._id
                    }"> ${result.data.course.course_code} (${
                      result.data.program.program_code
                    } - ${result.data.section_name}) </div>
                      </div>
                        <button class="btn btn-link btn-sm shadow-none add-button" day="${
                          result.data.day
                        }" start="${result.data.start_time}" end="${
                      result.data.end_time
                    }" id="${result.data._id}" onClick="assignFaculty(this)">
                          <span class="badge bg-primary rounded-pill">
                            <i class="fa-solid fa-plus"></i>
                          </span>
                        </button>
                      </li>
                    `);
                  }
                  if (result.data.type == "lab") {
                    $("#labList").append(`
                      <li class="list-group-item d-flex justify-content-between align-items-start fc-event">
                        <div class="ms-2 me-auto">
                        <div class="fw-bold">${result.data.day.toUpperCase()} ${
                      result.data.start_time
                    } - ${result.data.end_time} (${
                      result.data.room.room_name
                    })</div>
                          <div day="${result.data.day}" start="${
                      result.data.start_time
                    }" end="${result.data.end_time}" class="drag" id="${
                      result.data._id
                    }"> ${result.data.course.course_code} (${
                      result.data.program.program_code
                    } - ${result.data.section_name}) </div>
                      </div>
                        <button class="btn btn-link btn-sm shadow-none add-button" day="${
                          result.data.day
                        }" start="${result.data.start_time}" end="${
                      result.data.end_time
                    }" id="${result.data._id}" onClick="assignFaculty(this)">
                          <span class="badge bg-primary rounded-pill">
                            <i class="fa-solid fa-plus"></i>
                          </span>
                        </button>
                      </li>
                    `);
                  }
                }
                Toast.fire({
                  icon: "success",
                  title: "Successfully removed a load",
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
});

fetch("/api/faculty")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    if (!result.ok) {
      return;
    }
    result.data.forEach((element) => {
      faculty.append(
        new Option(
          (
            element.userInformation.first_name +
            " " +
            element.userInformation.middle_name +
            " " +
            element.userInformation.last_name
          ).toUpperCase(),
          element._id
        )
      );
    });
    faculty.select2({
      width: "100%",
    });
    $("#firstLoading").addClass("d-none");
    $("#facultySelect").removeClass("d-none");
  })
  .catch((error) => {
    Toast.fire({ icon: "error", title: "Something went wrong" });
    console.log(error);
  });

faculty.on("change", () => {
  $("#loadingCourse").removeClass("d-none");
  $("#loadingCalendar").removeClass("d-none");
  $("#courses").addClass("d-none");
  $("#calendar").addClass("d-none");

  fetch("/api/schedules/faculty/" + faculty.val())
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const days = ["m", "t", "w", "th", "f", "s", null];
      if (!result.ok) {
        return;
      }
      calendar.getEvents().forEach((element) => {
        element.remove();
      });
      result.data.forEach((element) => {
        calendar.addEvent({
          id: element._id,
          title: element.course.course_description,
          daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
          startTime: element.start_time,
          endTime: element.end_time,
          overlap: false,
          editabe: false,
        });
      });
      $("#loadingCalendar").addClass("d-none");
      $("#calendar").removeClass("d-none");
      calendar.render();
    })
    .catch((error) => {
      console.log(error);
    });

  fetch(`/api/schedules/assignable-course/${sem}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      if (!result.ok) {
        return;
      }
      $(".MyDripdowns").each(function (i, obj) {
        if (!$(obj).data("select2")) {
          $("#courseSearch").select2("destroy");
        }
      });
      courseSearch.val("").find("option").not(":first").remove();
      result.data.forEach((element) => {
        courseSearch.append(
          new Option(
            element.course.course_description.toUpperCase() +
              " - " +
              element.count,
            element._id
          )
        );
      });
      $("#loadingCourse").addClass("d-none");
      $("#courses").removeClass("d-none");
      courseSearch.select2({
        width: "100%",
      });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something went wrong" });
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
      if (!result.ok) {
        return;
      }
      $("#lectureList").empty();
      $("#labList").empty();
      let lectureCount = 0;
      let labCount = 0;
      result.data.forEach((element) => {
        if (element.type == "lecture") {
          lectureCount++;
          $("#lectureList").append(`
            <li class="list-group-item d-flex justify-content-between align-items-start fc-event">
              <div class="ms-2 me-auto">
              <div class="fw-bold">${element.day.toUpperCase()} ${
            element.start_time
          } - ${element.end_time} (${element.room.room_name})</div>
              <div day="${element.day}" start="${element.start_time}" end="${
            element.end_time
          }" class="drag" id="${element._id}"> ${element.course.course_code} (${
            element.program.program_code
          } - ${element.section_name}) </div>
            </div>
              <button class="btn btn-link btn-sm shadow-none add-button" day="${
                element.day
              }" start="${element.start_time}" end="${element.end_time}" id="${
            element._id
          }" onClick="assignFaculty(this)">
                <span class="badge bg-primary rounded-pill">
                  <i class="fa-solid fa-plus"></i>
                </span>
              </button>
            </li>
          `);
        }
        if (element.type == "lab") {
          labCount++;
          $("#labList").append(`
          <li class="list-group-item d-flex justify-content-between align-items-start fc-event">
            <div class="ms-2 me-auto">
            <div class="fw-bold">${element.day.toUpperCase()} ${
            element.start_time
          } - ${element.end_time} (${element.room.room_name})</div>
              <div day="${element.day}" start="${element.start_time}" end="${
            element.end_time
          }" class="drag" id="${element._id}"> ${element.course.course_code} (${
            element.program.program_code
          } - ${element.section_name_name}) </div>
          </div>
            <button class="btn btn-link btn-sm shadow-none add-button" day="${
              element.day
            }" start="${element.start_time}" end="${element.end_time}" id="${
            element._id
          }" onClick="assignFaculty(this)">
              <span class="badge bg-primary rounded-pill">
                <i class="fa-solid fa-plus"></i>
              </span>
            </button>
          </li>
          `);
        }
      });
      if (lectureCount == 0) {
        $("#lectureList").append(`<h5>Nothing to work here</h5>`);
      }
      if (labCount == 0) {
        $("#labList").append(`<h5>Nothing to work here</h5>`);
      }
      $("#lecture-tab").html(`Lecture (${lectureCount})`);
      $("#lab-tab").html(`Lab (${labCount})`);
      $("#loadingList").addClass("d-none");
      $("#list").removeClass("d-none");
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something went wrong" });
    });
});

const assignFaculty = (element) => {
  const days = ["m", "t", "w", "th", "f", "s", null];
  const button = $(element);

  const [startHour, startMin] = button.attr("start").split(":");
  const [endHour, endMin] = button.attr("end").split(":");
  const day = days.indexOf(button.attr("day")) + 1;
  const overlaps = [];
  let isOverlap = false;

  const range1 = moment.range(
    new Date(0, 0, 0, startHour, startMin),
    new Date(0, 0, 0, endHour, endMin)
  );
  calendar.getEvents().forEach((element) => {
    const range2 = moment.range(
      new Date(0, 0, 0, element.start.getHours(), element.start.getMinutes()),
      new Date(0, 0, 0, element.end.getHours(), element.end.getMinutes())
    );
    if (day === element.start.getDay()) {
      console.log(element);
      if (range1.overlaps(range2)) {
        overlaps.push(element);
        isOverlap = true;
      }
    }
  });
  if (isOverlap) {
    return Swal.fire({
      icon: "error",
      title: "Schedule Overlaps",
      html: `
        <div class="list-group" id="overlapList">
        </div>
      `,
      willOpen: () => {
        overlaps.forEach((element) => {
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
          $("#overlapList")
            .empty()
            .append(
              `
                <a href="#" class="list-group-item list-group-item-action">
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${element.title}</h5>
                  </div>
                    <p class="mb-1 float-start">${startTime.format(
                      "hh:mm A"
                    )} - ${endTime.format("hh:mm A")}<p>
                </a>
              `
            );
        });
      },
    });
  }
  fetch(`/api/schedules/assign/${button.attr("id")}`, {
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
      if (!result.ok) {
        return;
      }
      calendar.addEvent({
        id: button.attr("id"),
        title: "test",
        daysOfWeek: [(days.indexOf(button.attr("day")) + 1).toString()],
        startTime: button.attr("start"),
        endTime: button.attr("end"),
        overlap: false,
        editabe: false,
      });
      const count = button.parent().siblings().length;
      if (count == 0) {
        button.parent().parent().append(`<h5>Nothing to work here</h5>`);
      }
      if (button.parent().parent().parent().attr("id") == "lecture-tab-pane") {
        $("#lecture-tab").html(`Lecture (${count})`);
      } else {
        $("#lab-tab").html(`Lab (${count})`);
      }
      button.parent().remove();
      Toast.fire({ icon: "success", title: "Successfully Assigned" });
    })
    .catch((error) => {
      console.log(error);
      Toast.fire({ icon: "error", title: "Something went wrong" });
    });
};
