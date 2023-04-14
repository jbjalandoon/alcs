// Finding Schedule Form
const scheduleProgramForm = $("#schedule-form #program");
const scheduleYearLevelForm = $("#schedule-form #year_level");
const scheduleSectionForm = $("#schedule-form #section");
const roomForm = $("#roomForm");
const content = $("#content");
const spinner = $("#spinner");
const csrf = $("#csrf").val();

const urlHost = window.location.hostname;
const socket = io(`http://${urlHost}:3000`, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 0,
  reconnectionDelayMax: 500,
  reconnectionAttempts: 99999,
});

let semester;
let isLaboratorySelect;
let draggable;
let previousRoom = "";
let previousSection = "";

// Buttons
const currentCourseHourCount = {};

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
    const sameDaySchedules = calendar
      .getEvents()
      .filter(
        (e) =>
          e.start.getDay() === event.start.getDay() && e.extendedProps.current
      );

    const sameDayHours = sameDaySchedules
      .map((e) =>
        moment.duration(moment(e.endStr).diff(moment(e.startStr))).asHours()
      )
      .reduce((a, b) => a + b);

    // sort the filtered schedule
    sameDaySchedules.sort(function (a, b) {
      return a.start - b.start;
    });

    // find the index of currently added schedule
    const currentIndex = sameDaySchedules.findIndex(
      (e) => e.start.getHours() === event.start.getHours()
    );
    // assigning the previous and next schedule
    const previousEvent =
      currentIndex > 0 ? sameDaySchedules[currentIndex - 1] : null;
    const nextEvent =
      currentIndex < sameDaySchedules.length - 1
        ? sameDaySchedules[currentIndex + 1]
        : null;
    // getting the time gaps between schedules
    const previousTimeGap =
      previousEvent != null
        ? (event.start.getTime() - previousEvent.end.getTime()) / 1000
        : null;
    const nextTimeGap =
      nextEvent != null
        ? (nextEvent.start.getTime() - event.end.getTime()) / 1000
        : null;

    const isPreviousValid = isTimeGapValid(previousTimeGap);
    const isNextValid = isTimeGapValid(nextTimeGap);
    const dayHoursExceeds = sameDayHours > 8;

    // check if the time gap is large or small
    if (!isPreviousValid || !isNextValid || dayHoursExceeds) {
      let previous = false;
      let text = "";

      if (!isPreviousValid) {
        text += `${
          previousTimeGap / 60 / 60
        } hour/s of gap from previous schedule. `;
        previous = true;
      }

      if (!isNextValid) {
        if (previous) text += " & ";
        text += `${nextTimeGap / 60 / 60} hour/s of gap from next schedule. `;
      }

      if (dayHoursExceeds) {
        text += `${days[event.start.getDay()]} already exceeds 8 hours. `;
      }

      text += "Do you still want to continue?";

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

    const startMinutes =
      event.start.getMinutes() == 0
        ? "00"
        : event.start.getMinutes().toString();
    const endMinutes =
      event.end.getMinutes() == 0 ? "00" : event.end.getMinutes().toString();
    const end = moment(event.endStr);
    const start = moment(event.startStr);
    const hour = moment.duration(end.diff(start)).asHours();
    // setting the hours of schedule
    event.setExtendedProp("hourDuration", hour);

    const { data, status } = await axios.post(
      `/api/schedules/sections/create/${scheduleSectionForm.val()}`,
      {
        courseType: extendedProps.type,
        course: extendedProps.courseId,
        day: event.start.getDay(),
        startTime:
          ("0" + event.start.getHours()).slice(-2) + ":" + startMinutes,
        endTime: ("0" + event.end.getHours()).slice(-2) + ":" + endMinutes,
        room: roomForm.val(),
        hour: hour,
        event: event,
      },
      { headers: { "csrf-token": csrf } }
    );
    // setting the schedule id
    event.setExtendedProp("scheduleID", data.id);
    info.revert();
    displayToast({ data, status });
  } catch (error) {
    console.log(error);
    info.revert();
    displayToast(error.response);
  }
};

const editSchedule = async (info) => {
  try {
    const event = info.event;
    const id = event.extendedProps.scheduleID;
    const existingEvents = [];
    let text = "";
    let confirmed = true;
    // Dont accept if room is empty
    if (isEmptyRoom()) {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }

    // Check if the selected room is right for each schedule
    if (isLaboratorySelect) {
      if (event.extendedProps.courseType === "lecture") {
        Toast.fire({ icon: "warning", title: "Please select Lecture Room" });
        return info.revert();
      }
    } else {
      if (event.extendedProps.courseType === "lab") {
        Toast.fire({ icon: "warning", title: "Please select Laboratory Room" });
        return info.revert();
      }
    }

    // Reverting if the time is below 7 AM and above 9 PM
    if (event.start.getHours() <= 6 || event.end.getHours() >= 22) {
      Toast.fire({
        title: "Time Exceeds",
        icon: "warning",
      });
      return info.revert();
    }

    // Filter the schedule by currently set day
    const sameDaySchedules = calendar
      .getEvents()
      .filter(
        (e) =>
          e.start.getDay() === event.start.getDay() && e.extendedProps.current
      );

    const sameDayHours = sameDaySchedules
      .map((e) =>
        moment.duration(moment(e.endStr).diff(moment(e.startStr))).asHours()
      )
      .reduce((a, b) => a + b);

    // sorting the schedules
    sameDaySchedules.sort(function (a, b) {
      return a.start - b.start;
    });

    // find the index of currently added schedule
    const currentIndex = sameDaySchedules.findIndex(
      (e) => e.start.getHours() === event.start.getHours()
    );
    // assigning the previous and next schedule
    const previousEvent =
      currentIndex > 0 ? sameDaySchedules[currentIndex - 1] : null;
    const nextEvent =
      currentIndex < sameDaySchedules.length - 1
        ? sameDaySchedules[currentIndex + 1]
        : null;
    // getting the time gaps between schedules
    const previousTimeGap =
      previousEvent != null
        ? (event.start.getTime() - previousEvent.end.getTime()) / 1000
        : null;
    const nextTimeGap =
      nextEvent != null
        ? (nextEvent.start.getTime() - event.end.getTime()) / 1000
        : null;

    const isPreviousValid = isTimeGapValid(previousTimeGap);
    const isNextValid = isTimeGapValid(nextTimeGap);
    const dayHoursExceeds = sameDayHours > 8;
    // Check if there is a big and small time gap between schedules
    if (!isPreviousValid || !isNextValid || dayHoursExceeds) {
      let previous = false;

      if (!isPreviousValid) {
        text += `${
          previousTimeGap / 60 / 60
        } hour/s of gap from previous schedule. `;
        previous = true;
      }
      if (!isNextValid) {
        text += `${nextTimeGap / 60 / 60} hour/s of gap from next schedule. `;
      }

      if (dayHoursExceeds) {
        text += `${days[event.start.getDay()]} already exceeds 8 hours. `;
      }

      text +=
        "This will also remove the currently assigned faculty, Do you still want to continue?";
    } else {
      text +=
        "This will remove the currently assigned faculty, Do you still want to continue?";
    }

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

    if (!confirmed) {
      return info.revert();
    }

    const startMinutes =
      event.start.getMinutes() == 0
        ? "00"
        : event.start.getMinutes().toString();
    const endMinutes =
      event.end.getMinutes() == 0 ? "00" : event.end.getMinutes().toString();

    const { data, status } = await axios.put(
      `/api/schedules/sections/edit/${scheduleSectionForm.val()}/${id}`,
      {
        day: event.start.getDay(),
        startTime:
          ("0" + event.start.getHours()).slice(-2) + ":" + startMinutes,
        endTime: ("0" + event.end.getHours()).slice(-2) + ":" + endMinutes,
        room: $("#roomForm").find(":selected").text(),
        event: event,
      },
      { headers: { "csrf-token": csrf } }
    );
    info.event.remove();
    displayToast({ data, status });
  } catch (error) {
    console.error(error);
    displayToast(error.response);
  }
};

const splitSchedule = async (info) => {
  try {
    if (isEmptyRoom()) {
      Toast.fire({ icon: "warning", title: "Please select room first" });
      return info.revert();
    }

    const event = info.event;
    const extendedProps = event.extendedProps;
    let text = "";
    const id = extendedProps.scheduleID;

    const end = moment(event.endStr);
    const start = moment(event.startStr);

    const course = extendedProps.course;
    const durationHours = moment.duration(end.diff(start)).asHours();
    const type = extendedProps.courseType;

    const maxHours =
      type === "lecture"
        ? currentCourseHourCount[course].maxLecture
        : currentCourseHourCount[course].maxLab;
    const currentHour =
      type === "lecture"
        ? Math.abs(
            currentCourseHourCount[course].currentLecture -
              extendedProps.hourDuration +
              durationHours
          )
        : Math.abs(
            currentCourseHourCount[course].currentLab -
              extendedProps.hourDuration +
              durationHours
          );

    const startMinutes =
      event.start.getMinutes() == 0
        ? "00"
        : event.start.getMinutes().toString();
    const endMinutes =
      event.end.getMinutes() == 0 ? "00" : event.end.getMinutes().toString();

    if (currentHour > maxHours) {
      Toast.fire({ icon: "warning", title: "Max Hours Exceeds" });
      return info.revert();
    }

    const sameDaySchedules = calendar
      .getEvents()
      .filter(
        (e) =>
          e.start.getDay() === event.start.getDay() && e.extendedProps.current
      );

    const sameDayHours = sameDaySchedules
      .map((e) =>
        moment.duration(moment(e.endStr).diff(moment(e.startStr))).asHours()
      )
      .reduce((a, b) => a + b);

    // sort the filtered schedule
    sameDaySchedules.sort(function (a, b) {
      return a.start - b.start;
    });

    // find the index of currently added schedule
    const currentIndex = sameDaySchedules.findIndex(
      (e) => e.start.getHours() === event.start.getHours()
    );
    // assigning the previous and next schedule
    const previousEvent =
      currentIndex > 0 ? sameDaySchedules[currentIndex - 1] : null;
    const nextEvent =
      currentIndex < sameDaySchedules.length - 1
        ? sameDaySchedules[currentIndex + 1]
        : null;
    // getting the time gaps between schedules
    const previousTimeGap =
      previousEvent != null
        ? (event.start.getTime() - previousEvent.end.getTime()) / 1000
        : null;
    const nextTimeGap =
      nextEvent != null
        ? (nextEvent.start.getTime() - event.end.getTime()) / 1000
        : null;

    const isPreviousValid = isTimeGapValid(previousTimeGap);
    const isNextValid = isTimeGapValid(nextTimeGap);
    const dayHoursExceeds = sameDayHours > 8;

    if (!isPreviousValid || !isNextValid || dayHoursExceeds) {
      let previous = false;

      if (!isPreviousValid) {
        text += `${
          previousTimeGap / 60 / 60
        } hour/s of gap from previous schedule. `;
        previous = true;
      }
      if (!isNextValid) {
        text += `${nextTimeGap / 60 / 60} hour/s of gap from next schedule . `;
      }

      if (dayHoursExceeds) {
        text += `${days[event.start.getDay()]} already exceeds 8 hours. `;
      }

      text +=
        "This will also remove the currently assigned faculty, Do you still want to continue?";
    }

    text +=
      "This will remove the currently assigned faculty, Do you still want to continue?";

    const alert = await Swal.fire({
      title: "Are you sure?",
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirm",
    });

    if (!alert.isConfirmed) {
      return info.revert();
    }

    info.event.setExtendedProp("hourDuration", durationHours);
    const { data, status } = await axios.put(
      `/api/schedules/sections/split/${semester}/${id}`,
      {
        startTime:
          ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
        endTime: ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        room: $("#roomForm").find(":selected").text(),
        hour: moment.duration(end.diff(start)).asHours(),
        section: scheduleSectionForm.val(),
        currentHour: currentHour,
        maxHour: maxHours,
        event: info.event,
      },
      { headers: { "csrf-token": csrf } }
    );

    info.event.remove();
    displayToast({ data, status });
  } catch (error) {
    console.error(error);
    info.revert();
    displayToast(error.response);
  }
};

const viewSchedule = async (info) => {
  try {
    const id = info.event.extendedProps.scheduleID;
    const { data } = await axios.get(
      `/api/schedules/sections/view/${semester}/${id}`
    );
    const { schedule } = data;
    console.log(schedule);
    const { isDenied } = await Swal.fire({
      icon: "info",
      title: `${schedule.course.courseCode.toUpperCase()} (${schedule.program.programCode.toUpperCase()} ${
        schedule.level.display
      }-${schedule.sectionName})- ${schedule.type.toUpperCase()}`,
      text: `${days[schedule.day]} ${schedule.startTime} - ${
        schedule.endTime
      } (${schedule.room.toUpperCase()}${
        schedule.faculty
          ? "/" + schedule.faculty.userInformation.facultyCode.toUpperCase()
          : ""
      })`,
      width: "50%",
      showCancelButton: true,
      showDenyButton: info.event.extendedProps.current,
      showConfirmButton: false,
      denyButtonText: `Remove`,
      cancelButtonText: `Close`,
    });

    if (isDenied) {
      const { isConfirmed } = await confirmDelete();
      if (isConfirmed) {
        const course = info.event.extendedProps.course;
        const end = moment(info.event.endStr);
        const start = moment(info.event.startStr);
        const type = info.event.extendedProps.type;
        const durationHours = moment.duration(end.diff(start)).asHours();

        const { data, status } = await axios.delete(
          `/api/schedules/sections/delete/${semester}/${id}`,
          {
            headers: {
              "csrf-token": csrf,
              room: roomForm.val(),
              section: scheduleSectionForm.val(),
              hours: durationHours,
              course: course,
              type: type,
            },
          }
        );
        displayToast({ data, status });
      }
    }
  } catch (error) {
    console.error(error);
    displayToast(error.response);
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
  eventDrop: editSchedule,
  // for spliting the schedule
  eventResize: splitSchedule,
  // for schedule information
  eventClick: viewSchedule,
  // eventDidMount: function (info) {
  //   renderEvent(info);
  // },
  eventContent: (info) => {
    const { course, program, section, room, level, type } =
      info.event.extendedProps;
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.justifyContent = "center";
    div.style.alignItems = "center";

    // const faculty = info.event.extendedProps.faculty
    //   ? info.event.extendedProps.faculty.toUpperCase()
    //   : "";
    const courseEl = document.createElement("span");
    courseEl.innerHTML = course.toUpperCase();
    const programEl = document.createElement("span");
    programEl.innerHTML = `${program.toUpperCase()} ${level} - ${section}`;
    const roomEl = document.createElement("span");
    roomEl.innerHTML = room.toUpperCase();
    const typeEl = document.createElement("span");
    typeEl.innerHTML = type.toUpperCase();
    div.append(courseEl, programEl, roomEl, typeEl);

    let arrayOfDomNodes = [div];
    return { domNodes: arrayOfDomNodes };
  },
};

// Tables
const scheduleTable = $("#scheduleTable");
const calendarEl = document.getElementById("calendar");
const calendar = new FullCalendar.Calendar(calendarEl, config);

(async () => {
  try {
    const { data, status } = await axios.get(
      `/api/curriculums/semesters/active`
    );
    semester = data.semester._id;
    $("#cardLabel").html(
      `S.Y. ${data.year.year.toUpperCase()} (${data.semester.sem.toUpperCase()} SEMESTER)`
    );

    const { data: programData } = await axios.get(
      `/api/curriculums/programs/${semester}`
    );

    programData.programs.forEach((element) => {
      scheduleProgramForm.append(
        new Option(element.program.programCode.toUpperCase(), element._id)
      );
    });

    content.removeClass("d-none");
    spinner.addClass("d-none");
    scheduleProgramForm.trigger("change");
  } catch (error) {
    scheduleProgramForm.attr("disabled", true);
    scheduleYearLevelForm.attr("disabled", true);
    scheduleSectionForm.attr("disabled", true);
    roomForm.attr("disabled", true);
    console.log(error);
    displayToast(error.response);
  } finally {
    content.removeClass("d-none");
    spinner.addClass("d-none");
    calendar.render();
  }
})();

scheduleProgramForm.on("change", async (event) => {
  try {
    socket.disconnect();
    scheduleYearLevelForm.empty();
    scheduleSectionForm.empty();
    const programValue = $(event.currentTarget).val();
    const { data: levelData } = await axios.get(
      `/api/curriculums/levels/${programValue}`
    );
    scheduleYearLevelForm.attr("disabled", false);
    scheduleSectionForm.attr("disabled", false);
    levelData.levels.forEach((element) => {
      scheduleYearLevelForm.append(
        new Option(element.level.display.toUpperCase(), element._id)
      );
    });
    scheduleYearLevelForm.trigger("change");
  } catch (error) {
    scheduleYearLevelForm.attr("disabled", true);
    scheduleSectionForm.attr("disabled", true);
    displayToast(error.response);
  }
});

scheduleYearLevelForm.on("change", async (event) => {
  try {
    const level = $(event.currentTarget).val();
    const { data: sectionData } = await axios.get(
      `/api/curriculums/sections/${level}`
    );

    scheduleSectionForm.empty();
    sectionData.sections.forEach((element) => {
      scheduleSectionForm.append(
        new Option(element.section.toUpperCase(), element._id)
      );
    });
    scheduleSectionForm.attr("disabled", false);
    scheduleSectionForm.trigger("change");
  } catch (error) {
    console.log(error);
    scheduleSectionForm.attr("disabled", true);
    displayToast(error.response);
  }
});

scheduleSectionForm.on("change", async (event) => {
  try {
    socket.connect();
    const current = $(event.currentTarget);
    const section = current.val();
    for (const prop of Object.getOwnPropertyNames(currentCourseHourCount)) {
      delete currentCourseHourCount[prop];
    }

    const events = calendar.getEvents();
    events.forEach((element) => {
      element.remove();
    });

    const schoolYear = scheduleYearLevelForm.val();
    const { data: coursesData } = await axios.get(
      `/api/curriculums/course/${schoolYear}`
    );
    const lectureList = $("#external-events #lectureList");
    const labList = $("#external-events #labList");
    lectureList.empty();
    labList.empty();

    roomForm.attr("disabled", false);
    coursesData.courses.forEach((element) => {
      renderCourses(element, labList, lectureList);
    });

    const { data: roomData } = await axios.get(`/api/rooms`);

    roomForm.select2({
      placeholder: "Select a Room",
      width: "100%",
    });

    roomData.room.forEach((element) => {
      if (element.isLaboratory) {
        roomForm
          .find("#optLab")
          .append(new Option(element.roomName.toUpperCase(), element._id));
      } else {
        roomForm
          .find("#optLecture")
          .append(new Option(element.roomName.toUpperCase(), element._id));
      }
    });

    roomForm.trigger("change");

    const { data: scheduleData } = await axios.get(
      `/api/schedules/sections/${section}`
    );
    scheduleData.schedules.forEach((element) => {
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
          color: schedule.type === "lecture" ? "#007BFF" : "#3399FF",
          textColor: schedule.type === "lecture" ? "white" : "black",
          startEditable: true,
          course: element.course.courseCode,
          program: element.program.programCode,
          type: schedule.type,
          faculty:
            element.faculty != null
              ? element.faculty.userInformation.facultyCode
              : null,
          section: element.sectionName,
          room: schedule.room,
          level: element.yearLevel.display,
          current: true,
        });
        if (hour === 0) {
          $("#external-events")
            .find(
              `[course='${element.course.courseCode}'][coursetype='${schedule.type}']`
            )
            .removeClass(`${schedule.type}-event bg-success text-light`)
            .addClass(`bg-warning text-dark`)
            .css("curses", "");
        }
        $("#external-events")
          .find(
            `[course='${element.course.courseCode}'][coursetype='${schedule.type}']`
          )
          .attr("hour", hourStr);
      });
    });

    socket.emit("leaveSection", previousSection);
    socket.emit("joinSection", current.val());

    previousSection = current.val();
  } catch (error) {
    console.error(error);
  }

  // socket.on("create", (data) => {
  //   calendar.addEvent({
  //     ...data.event,
  //   });
  // });
});

roomForm.on("change", async (event) => {
  try {
    const current = $(event.currentTarget);
    const roomValue = current.val();
    if (current.val() === null) {
      return;
    }

    const { data: roomData } = await axios.get(`/api/rooms/${current.val()}`);
    isLaboratorySelect = roomData.room.isLaboratory;
    const { data: roomScheduleData } = await axios.get(
      `/api/schedules/rooms/${semester}/${roomValue}`
    );

    const events = calendar.getEvents();
    events.forEach((element) => {
      if (!element.extendedProps.current) {
        element.remove();
      }
    });
    roomScheduleData.schedules.forEach((element) => {
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
          faculty: element.faculty
            ? element.faculty.userInformation.facultyCode
            : null,
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
          type: info.getAttribute("courseType"),
        };
      },
    });
    socket.emit("leaveRoom", previousRoom);
    socket.emit("joinRoom", current.val());
    previousRoom = current.val();
  } catch (error) {
    console.log(error);
    displayToast(error.response);
  }
});

const isEmptyRoom = () => {
  if (roomForm.val() === null) {
    return true;
  }
  return false;
};

const isTimeGapValid = (milliseconds) => {
  if (milliseconds === null) return true;
  if (milliseconds >= 5400 || milliseconds === 0) return false;
  return true;
};

const getSectionSchedule = async (section) => {
  try {
    const schedulesRequest = await fetch(`/api/schedules/sections/${section}`);
    const schedules = await schedulesRequest.json();

    return schedules;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const postSchedule = async (body) => {
  try {
    const postScheduleRequest = await fetch(
      `/api/schedules/sections/create/${scheduleSectionForm.val()}`,
      {
        method: "POST",
        headers: {
          "csrf-token": csrf,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
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

const putSchedule = async (id, body, split) => {
  try {
    url = split
      ? `/api/schedules/sections/split/${semester}/${id}`
      : `/api/schedules/sections/edit/${scheduleSectionForm.val()}/${id}`;
    const putScheduleRequest = await fetch(url, {
      method: "PUT",
      headers: {
        "csrf-token": csrf,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const putScheduleResponse = await putScheduleRequest.json();

    return putScheduleResponse;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const renderCourses = (data, labList, lectureList) => {
  const { course, _id: id } = data;
  currentCourseHourCount[course.courseCode] = {
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
      course: course.courseCode,
      program: scheduleProgramForm.children(":selected").text(),
      section: scheduleSectionForm.children(":selected").text(),
      new: true,
      level: scheduleYearLevelForm.children(":selected").text(),
      overlap: false,
      durationEditable: true,
      startEditable: true,
      "course-id": course._id,
    });

    card.append(item);
    if (course.lecture !== 0 && i === 0) {
      item.html(
        course.courseCode.toUpperCase() +
          " - " +
          course.courseDescription.toUpperCase() +
          " - " +
          course.lecture +
          " HOURS"
      );
      item.attr("courseType", "lecture");
      item.attr("color", "#007BFF");
      item.attr("textColor", "white");
      item.attr("hour", course.lecture);
      item.addClass("lecture-event");
      lectureList.append(card);
      currentCourseHourCount[course.courseCode].maxLecture = course.lecture;
      currentCourseHourCount[course.courseCode].currentLecture = 0;
    }
    if (course.lab !== 0 && i === 1) {
      item.html(
        course.courseCode.toUpperCase() +
          " - " +
          course.courseDescription.toUpperCase() +
          " - " +
          course.lab +
          " HOURS"
      );
      item.attr("courseType", "lab");
      item.attr("color", "#5AA2E8");
      item.attr("textColor", "black");
      item.attr("hour", course.lab);
      item.addClass("lab-event");
      labList.append(card);
      currentCourseHourCount[course.courseCode].maxLab = course.lab;
      currentCourseHourCount[course.courseCode].currentLab = 0;
    }
  }
};

socket.on("createSectionSchedule", (data) => {
  if (data.section === scheduleSectionForm.val()) {
    const extendedProps = data.event.extendedProps;
    if (extendedProps.type === "lecture") {
      currentCourseHourCount[extendedProps.course].currentLecture =
        currentCourseHourCount[extendedProps.course].maxLecture;
    } else {
      currentCourseHourCount[extendedProps.course].currentLab =
        currentCourseHourCount[extendedProps.course].maxLab;
    }
    $("#external-events")
      .find(
        `[course='${extendedProps.course}'][courseType='${extendedProps.type}']`
      )
      .removeClass(`${extendedProps.type}-event bg-primary text-light`)
      .addClass("bg-warning text-dark")
      .css("cursor", "")
      .attr("hour", "0:00");
    data.event.durationEditable = true;
    data.event.startEditable = true;
  } else {
    data.event.extendedProps.current = false;
    data.event.durationEditable = false;
    data.event.startEditable = false;
    data.event.backgroundColor = "#FFC107";
    data.event.textColor = "black";
  }
  data.event.overlap = false;

  calendar.addEvent(data.event);
});

socket.on("editSectionSchedule", (data) => {
  calendar.getEvents().forEach((e) => {
    if (e.extendedProps.scheduleID === data.event.extendedProps.scheduleID)
      e.remove();
  });
  if (data.section !== scheduleSectionForm.val()) {
    data.event.extendedProps.current = false;
    data.event.durationEditable = false;
    data.event.startEditable = false;
    data.event.backgroundColor = "#FFC107";
    data.event.textColor = "black";
  } else {
    data.event.durationEditable = true;
    data.event.startEditable = true;
  }
  data.event.overlap = false;
  calendar.addEvent(data.event);
});

socket.on("deleteSectionSchedule", (data) => {
  if (data.section === scheduleSectionForm.val()) {
    let currentHour, maxHours;
    console.log(data.type);
    if (data.type === "lecture") {
      currentCourseHourCount[data.course].currentLecture -= data.hours;
      maxHours = currentCourseHourCount[data.course].maxLecture;
      currentHour = currentCourseHourCount[data.course].currentLecture;
    } else {
      currentCourseHourCount[data.course].currentLab -= data.hours;
      maxHours = currentCourseHourCount[data.course].maxLab;
      currentHour = currentCourseHourCount[data.course].currentLab;
    }

    if ($("#roomForm").val() === "") {
      $("#external-events")
        .find(`[course='${data.course}'][courseType='${data.type}']`)
        .removeClass("bg-warning text-dark")
        .addClass(`${data.type}-event bg-success text-light`);
    } else {
      $("#external-events")
        .find(`[course='${data.course}'][courseType='${data.type}']`)
        .removeClass("bg-warning text-dark")
        .addClass(`${data.type}-event bg-primary text-light`)
        .css("cursor", "move");
    }

    $("#external-events")
      .find(`[course='${data.course}'][courseType='${data.type}']`)
      .attr(
        "hour",
        `${Math.trunc(maxHours - currentHour)}:${
          (maxHours - currentHour) % 1 === 0 ? "00" : "30"
        }`
      );
  }

  calendar.getEvents().forEach((e) => {
    if (e.extendedProps.scheduleID === data.id) e.remove();
  });
});

socket.on("splitSectionSchedule", (data) => {
  calendar.getEvents().forEach((e) => {
    if (e.extendedProps.scheduleID === data.event.extendedProps.scheduleID)
      e.remove();
  });
  if (data.section === scheduleSectionForm.val()) {
    const event = data.event;
    const extendedProps = event.extendedProps;
    calendar.getEvents().forEach((e) => {
      if (e.extendedProps.scheduleID === data.event.extendedProps.scheduleID)
        e.remove();
    });
    if (extendedProps.type === "lecture") {
      currentCourseHourCount[extendedProps.course].currentLecture =
        data.currentHour;
    } else {
      currentCourseHourCount[extendedProps.course].currentLab =
        data.currentHour;
    }
    if (data.maxHour - data.currentHour === 0) {
      $("#external-events")
        .find(
          `[course='${extendedProps.course}'][courseType='${extendedProps.courseType}']`
        )
        .removeClass(`${extendedProps.courseType}-event bg-primary text-light`)
        .addClass("bg-warning text-dark")
        .css("cursor", "");
    } else {
      $("#external-events")
        .find(
          `[course='${extendedProps.course}'][courseType='${extendedProps.courseType}']`
        )
        .addClass(`${extendedProps.courseType}-event bg-primary text-light`)
        .removeClass("bg-success bg-warning text-dark")
        .css("cursor", "move");
    }
    $("#external-events")
      .find(
        `[course='${extendedProps.course}'][courseType='${extendedProps.courseType}']`
      )
      .attr(
        "hour",
        `${Math.trunc(data.maxHour - data.currentHour)}:${
          (data.maxHour - data.currentHour) % 1 === 0 ? "00" : "30"
        }`
      );
    data.event.durationEditable = true;
    data.event.startEditable = true;
  } else {
    data.event.extendedProps.current = false;
    data.event.backgroundColor = "#FFC107";
    data.event.textColor = "black";
    data.event.durationEditable = false;
    data.event.startEditable = false;
  }
  data.event.overlap = false;

  calendar.addEvent(data.event);
});
