const csrf = $("#csrf").val();

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
  droppable: true,
  eventClick: async function (info) {
    try {
      const { isConfirmed } = await confirmDelete();
      const eventId = info.event.extendedProps.dbId;

      if (isConfirmed) {
        const { data, status } = await axios.delete(
          `/api/faculty/schedule-preference/${userId}/${eventId}`,
          { headers: { "csrf-token": csrf } }
        );
        info.event.remove();
        displayToast({ data, status });
      }
    } catch (error) {
      displayToast(error.response);
    }
  },
  eventReceive: async function (info) {
    try {
      const day = info.event.start.getDay();
      const startMinutes =
        info.event.start.getMinutes() == 0
          ? "00"
          : info.event.start.getMinutes().toString();
      const endMinutes =
        info.event.end.getMinutes() == 0
          ? "00"
          : info.event.end.getMinutes().toString();

      const { data, status } = await axios.post(
        `/api/faculty/schedule-preference/${userId}`,
        {
          day: day,
          startTime:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          endTime:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        },
        { headers: { "csrf-token": csrf } }
      );
      const { schedulePreference } = data.faculty.facultyInformation;
      info.event.setExtendedProp(
        "dbId",
        schedulePreference[schedulePreference.length - 1]._id
      );
      displayToast({ data, status });
    } catch (error) {
      displayToast(error.response);
    }
  },
  eventResize: async function (info) {
    try {
      const eventId = info.event.extendedProps.dbId;
      if (info.event.start.getDay() !== info.event.end.getDay()) {
        info.revert();
        return Toast.fire({
          icon: "warning",
          title: "Something went wrong",
        });
      }

      const day = info.event.start.getDay();
      const startMinutes =
        info.event.start.getMinutes() == 0
          ? "00"
          : info.event.start.getMinutes().toString();
      const endMinutes =
        info.event.end.getMinutes() == 0
          ? "00"
          : info.event.end.getMinutes().toString();

      const { data, status } = await axios.put(
        `/api/faculty/schedule-preference/${userId}/${eventId}`,
        {
          day: day,
          startTime:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          endTime:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        },
        { headers: { "csrf-token": csrf } }
      );
      displayToast({ data, status });
    } catch (error) {
      displayToast(error.response);
    }
  },
  eventDrop: async function (info) {
    try {
      const eventId = info.event.extendedProps.dbId;
      const day = info.event.start.getDay();
      const startMinutes =
        info.event.start.getMinutes() == 0
          ? "00"
          : info.event.start.getMinutes().toString();
      const endMinutes =
        info.event.end.getMinutes() == 0
          ? "00"
          : info.event.end.getMinutes().toString();

      const { data, status } = await axios.put(
        `/api/faculty/schedule-preference/${userId}/${eventId}`,
        {
          day: day,
          startTime:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          endTime:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        },
        { headers: { "csrf-token": csrf } }
      );
      displayToast({ data, status });
    } catch (error) {
      displayToast(error.response);
    }
  },
};
const calendar = new FullCalendar.Calendar(calendarContainer, config);

(async () => {
  try {
    const { data } = await axios.get(`/api/faculty/${userId}`);

    let Draggable = FullCalendar.Draggable;
    const draggable = new Draggable(document.getElementById("externalEvents"), {
      itemSelector: ".fc-event",
      eventData: function (info) {
        return {
          duration: "03:00",
          durationEditable: true,
          startEditable: true,
          overlap: false,
          color: "#d9534f",
        };
      },
    });

    data.faculty.facultyInformation.schedulePreference.forEach((element) => {
      calendar.addEvent({
        startTime: element.startTime,
        endTime: element.endTime,
        daysOfWeek: [element.day],
        dbId: element._id,
        overlap: false,
        durationEditable: true,
        startEditable: true,
        color: "#d9534f",
      });
    });

    calendar.render();
  } catch (error) {
    displayToast(error.response);
  }
})();
