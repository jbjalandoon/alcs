const schoolYear = document.querySelector("#school-year");
const semester = document.querySelector("#semester");
const room = document.querySelector("#room");
const faculty = $("#faculty");
const content = document.querySelector("#content");
const program = document.querySelector("#program");
const level = document.querySelector("#level");
const roomCalendarContainer = document.querySelector(
  "#room-calendar-container"
);
const facultyCalendarContainer = document.querySelector(
  "#faculty-calendar-container"
);
const sectionCalendarContainer = document.querySelector(
  "#section-calendar-container"
);
const pdfEl = document.querySelector("#pdf");

const calendarEl = document.getElementById("calendar");
const config = {
  allDaySlot: false,
  hiddenDays: [0],
  height: "auto",
  dayHeaderFormat: { weekday: "long" },
  initialView: "timeGridWeek",
  headerToolbar: {
    left: "",
    center: "title",
    right: "",
  },
  slotMinTime: "7:00:00",
  slotMaxTime: "22:00:00",
  validRange: {
    start: "7:00:00",
    end: "22:00:00",
  },
  eventDidMount: function (info) {
    console.log(info.event.extendedProps.room);
    const titleEl = info.el.querySelector(".fc-event-title");
    const timeEl = info.el.querySelector(".fc-event-time");
    info.el.style.textAlign = "center";

    const course = info.event.extendedProps.course;
    const program = info.event.extendedProps.program;
    const section = info.event.extendedProps.section;
    const room = info.event.extendedProps.room;
    const faculty = info.event.extendedProps.faculty
      ? info.event.extendedProps.faculty
      : "";

    titleEl.innerHTML = `${course} <br> ${program}-${section} <br> ${room} <br> ${faculty}`;
  },
};

fetch("/api/curriculums/school-year")
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    result.data.forEach((element) => {
      schoolYear.append(
        new Option(
          element.school_year.year.toUpperCase(),
          element.school_year._id
        )
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });

schoolYear.addEventListener("change", (event) => {
  fetch("/api/curriculums/semesters/" + schoolYear.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.forEach((element) => {
        semester.append(
          new Option(element.sem.toUpperCase() + " SEMESTER", element._id)
        );
      });
      semester.removeAttribute("disabled");
    })
    .catch((error) => {
      console.log(error);
    });
});

semester.addEventListener("change", () => {
  fetch(`/api/schedules/rooms/${semester.value}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $(room).find("option").not(":first").remove();
      result.data.forEach((element) => {
        room.append(
          new Option(element.room.room_name.toUpperCase(), element._id)
        );
      });
    })
    .catch((error) => {
      console.log(error);
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

  fetch("/api/curriculums/programs/" + semester.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      result.data.forEach((element) => {
        program.append(
          new Option(element.program.program_name.toUpperCase(), element._id)
        );
      });
      $("#program-offered-count").html(result.data.length);
    })
    .catch((error) => {
      console.log(error);
    });

  fetch("/api/schedules/faculties/" + semester.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $("#active-faculty-count").html(result.data.length);
    })
    .catch((error) => {
      console.log(error);
    });

  fetch("/api/schedules/unassigned-schedule/" + semester.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $("#unassigned-course-count").html(result.data.length);
    })
    .catch((error) => {
      console.log(error);
    });

  fetch("/api/schedules/unloaded-schedule/" + semester.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $("#unloaded-course-count").html(result.data.length);
      content.classList.remove("d-none");
    })
    .catch((error) => {
      console.log(error);
    });
});

program.addEventListener("change", () => {
  fetch("/api/curriculums/year-levels/" + program.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      $(level).find("option").not(":first").remove();
      result.data.forEach((element) => {
        level.append(
          new Option(element.level.level.toUpperCase(), element._id)
        );
      });
      level.removeAttribute("disabled");
    })
    .catch((error) => {
      console.log(error);
    });
});

level.addEventListener("change", () => {
  fetch("/api/schedules/year-level/" + level.value)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      console.log(result);
      sectionCalendarContainer.innerHTML = "";
      const days = ["m", "t", "w", "th", "f", "s"];

      result.data.forEach((element) => {
        const newCalendar = document.createElement("div");
        const title = document.createElement("span");
        title.innerHTML =
          element.schedules[0].program.program_code +
          " " +
          element.schedules[0].section_name;
        newCalendar.classList.add("schedule");
        sectionCalendarContainer.append(newCalendar);
        const calendar = new FullCalendar.Calendar(newCalendar, config);
        element.schedules.forEach((element) => {
          calendar.addEvent({
            id: element._id,
            section: element.section_name,
            program: element.program.program_code,
            course: element.course.course_description,
            faculty: element.faculty.userInformation.last_name,
            room: element.room.room_name,
            daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
            startTime: element.start_time,
            endTime: element.end_time,
            overlap: false,
            editabe: false,
          });
        });
        calendar.render();
        document.querySelector("#section-download").removeAttribute("disabled");
        newCalendar.querySelector(".fc-toolbar-title").innerHTML = "";
        newCalendar.querySelector(".fc-toolbar-title").append(title);
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

document.querySelector("#section-download").addEventListener("click", () => {
  const elements = sectionCalendarContainer.querySelectorAll(".schedule");
  const pdf = new jsPDF("l", "px", "a4");
  elements.forEach((element, index) => {
    html2canvas(element, {
      allowTaint: true,
      removeContainer: true,
      // backgroundColor: null,
      imageTimeout: 15000,
      logging: true,
      scale: 2,
      scrollY: window.scrollTo({
        top: 0,
        behavior: "smooth",
      }),
      useCORS: true,
    }).then((canvas) => {
      const image = canvas.toDataURL("image/jpeg", 1);
      pdf.addImage(
        image,
        "JPEG",
        25,
        35,
        canvas.width / 5.5,
        canvas.height / 4.5
      );
      pdf.addPage();
      if (index == elements.length - 1) {
        pdf.save("test");
      }
    });
  });
});

room.addEventListener("change", () => {
  fetch(`/api/schedules/room/${semester.value}/${room.value}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      roomCalendarContainer.innerHTML = "";
      const days = ["m", "t", "w", "th", "f", "s"];
      const newCalendar = document.createElement("div");
      newCalendar.classList.add("schedule");
      newCalendar.setAttribute("room", room.options[room.selectedIndex].text);
      roomCalendarContainer.append(newCalendar);
      const calendar = new FullCalendar.Calendar(newCalendar, config);
      result.data.forEach((element) => {
        calendar.addEvent({
          id: element._id,
          section: element.section_name,
          program: element.program.program_code,
          course: element.course.course_description,
          room: room.options[room.selectedIndex].text,
          daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
          startTime: element.start_time,
          endTime: element.end_time,
          overlap: false,
          editabe: false,
        });
      });
      document.querySelector("#download-room").removeAttribute("disabled");
      calendar.render();
    })
    .catch((error) => {
      console.log(error);
    });
});

document
  .querySelector("#download-all-room")
  .addEventListener("click", async () => {
    fetch(`/api/schedules/rooms/${semester.value}`)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        const pdf = new jsPDF({
          orientation: "l",
          unit: "px",
          format: "a4",
          userUnit: 300,
        });
        const days = ["m", "t", "w", "th", "f", "s"];
        result.data.forEach((element, index) => {
          const newCalendar = document.createElement("div");
          newCalendar.setAttribute("room", element.room.room_name);
          newCalendar.classList.add("schedules");
          roomCalendarContainer.append(newCalendar);
          var calendar = new FullCalendar.Calendar(newCalendar, config);
          calendar.render();
          element.schedules.forEach((schedule) => {
            calendar.addEvent({
              id: schedule._id,
              course: schedule.course.course_description,
              program: schedule.program.program_code,
              section: schedule.section_name,
              room: element.room.room_name,
              daysOfWeek: [(days.indexOf(schedule.day) + 1).toString()],
              startTime: schedule.start_time,
              endTime: schedule.end_time,
            });
          });
          html2canvas(newCalendar, {
            allowTaint: true,
            removeContainer: true,
            // backgroundColor: null,
            imageTimeout: 15000,
            logging: true,
            scale: 2,
            scrollY: window.scrollTo({
              top: 0,
              behavior: "smooth",
            }),
            useCORS: true,
          }).then((canvas) => {
            const image = canvas.toDataURL("image/jpeg", 1);
            pdf.setFontSize(20);
            pdf.text(
              `${element.room.room_name} Schedules`,
              315.7,
              35,
              "center"
            );
            pdf.addImage(
              image,
              "JPEG",
              25,
              35,
              canvas.width / 5.5,
              canvas.height / 4.5
            );
            pdf.addPage();
            if (index == result.data.length - 1) {
              room.value = "";
              roomCalendarContainer.innerHTML = "";
              document
                .querySelector("#download-room")
                .setAttribute("disabled", true);
              pdf.save(`Room Schedules`);
            }
          });
        });
      })
      .catch((error) => {
        console.log(error);
      });
  });

document.querySelector("#download-room").addEventListener("click", () => {
  window.scrollTo(0, 0);
  const pdf = new jsPDF({
    orientation: "l",
    unit: "px",
    format: "a4",
    userUnit: 300,
  });
  const element = roomCalendarContainer.querySelector(".schedule");
  html2canvas(element, {
    allowTaint: true,
    removeContainer: true,
    // backgroundColor: null,
    imageTimeout: 15000,
    logging: true,
    scale: 2,
    scrollY: window.scrollTo({
      top: 0,
      behavior: "smooth",
    }),
    useCORS: true,
  }).then((canvas) => {
    const image = canvas.toDataURL("image/jpeg", 1);
    pdf.setFontSize(20);
    pdf.text(`${element.getAttribute("room")} Schedules`, 315.7, 35, "center");
    pdf.addImage(
      image,
      "JPEG",
      25,
      35,
      canvas.width / 5.5,
      canvas.height / 4.5
    );
    pdf.save(`${element.getAttribute("room")} - Schedules`);
  });
});

faculty.on("change", () => {
  fetch(`/api/schedules/faculty/${semester.value}/${faculty.val()}`)
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      const days = ["m", "t", "w", "th", "f", "s", null];
      if (!result.ok) {
        return;
      }
      facultyCalendarContainer.innerHTML = "";
      const newCalendar = document.createElement("div");
      newCalendar.classList.add("schedule");
      facultyCalendarContainer.append(newCalendar);
      const calendar = new FullCalendar.Calendar(newCalendar, config);
      result.data.forEach((element) => {
        console.log(element.room.room_name);
        calendar.addEvent({
          id: element._id,
          section: element.section_name,
          program: element.program.program_code,
          course: element.course.course_description,
          room: element.room.room_name,
          daysOfWeek: [(days.indexOf(element.day) + 1).toString()],
          startTime: element.start_time,
          endTime: element.end_time,
          overlap: false,
          editabe: false,
        });
      });
      document.querySelector("#faculty-download").removeAttribute("disabled");
      calendar.render();
    })
    .catch((error) => {
      console.log(error);
    });
});

document.querySelector("#faculty-download").addEventListener("click", () => {
  html2canvas(facultyCalendarContainer.querySelector(".schedule"), {
    allowTaint: true,
    removeContainer: true,
    // backgroundColor: null,
    imageTimeout: 15000,
    logging: true,
    scale: 2,
    scrollY: window.scrollTo({
      top: 0,
      behavior: "smooth",
    }),
    useCORS: true,
  }).then((canvas) => {
    const pdf = new jsPDF("l", "px", "a4");
    const image = canvas.toDataURL("image/jpeg", 1);
    pdf.addImage(
      image,
      "JPEG",
      25,
      35,
      canvas.width / 5.5,
      canvas.height / 4.5
    );
    pdf.save("test");
  });
});
