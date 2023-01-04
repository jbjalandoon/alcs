const csrf = $("#csrf").val();

const config = {
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
  droppable: true,
  eventClick: function (info) {
    console.log(info.event.extendedProps);
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      preConfirm: () => {
        return fetch(
          "/api/faculty/schedule-preference/" +
            userId +
            "/" +
            info.event.extendedProps.dbId,
          {
            method: "DELETE",
            headers: {
              "csrf-token": csrf,
              "Content-Type": "application/json",
            },
          }
        )
          .then((response) => {
            return response.json();
          })
          .then((result) => {
            info.event.remove();
            Toast.fire({
              icon: "success",
              title: "Successfully Removed",
            });
          })
          .catch((error) => {
            console.log(error);
          });
      },
    });
  },
  eventReceive: function (info) {
    const day = info.event.start.getDay();
    const startMinutes =
      info.event.start.getMinutes() == 0
        ? "00"
        : info.event.start.getMinutes().toString();
    const endMinutes =
      info.event.end.getMinutes() == 0
        ? "00"
        : info.event.end.getMinutes().toString();
    fetch("/api/faculty/schedule-preference/" + userId, {
      method: "POST",
      headers: { "csrf-token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({
        day: day,
        startTime:
          ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
        endTime: ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        info.event.setExtendedProp(
          "dbId",
          result.data.userInformation.schedulePreference[
            result.data.userInformation.schedulePreference.length - 1
          ]._id
        );
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
      });
  },
  eventResize: function (info) {
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
    fetch(
      "/api/faculty/schedule-preference/" +
        userId +
        "/" +
        info.event.extendedProps.dbId,
      {
        method: "PUT",
        headers: { "csrf-token": csrf, "Content-Type": "application/json" },
        body: JSON.stringify({
          day: day,
          startTime:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          endTime:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        }),
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
      });
  },
  eventDrop: function (info) {
    const day = info.event.start.getDay();
    const startMinutes =
      info.event.start.getMinutes() == 0
        ? "00"
        : info.event.start.getMinutes().toString();
    const endMinutes =
      info.event.end.getMinutes() == 0
        ? "00"
        : info.event.end.getMinutes().toString();
    fetch(
      "/api/faculty/schedule-preference/" +
        userId +
        "/" +
        info.event.extendedProps.dbId,
      {
        method: "PUT",
        headers: { "csrf-token": csrf, "Content-Type": "application/json" },
        body: JSON.stringify({
          day: day,
          startTime:
            ("0" + info.event.start.getHours()).slice(-2) + ":" + startMinutes,
          endTime:
            ("0" + info.event.end.getHours()).slice(-2) + ":" + endMinutes,
        }),
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        displayToast(result);
      })
      .catch((error) => {
        console.log(error);
      });
  },
};

fetch("/api/faculty/" + userId)
  .then((response) => {
    return response.json();
  })
  .then((result) => {
    const calendar = new FullCalendar.Calendar(calendarContainer, config);
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
          // display: "background",
        };
      },
    });
    result.data.userInformation.schedulePreference.forEach((element) => {
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
  });

const getFullDay = (day) => {
  let fullDay = null;
  switch (day) {
    case "m":
      fullDay = "monday";
      break;
    case "t":
      fullDay = "tuesday";
      break;
    case "w":
      fullDay = "wednesday";
      break;
    case "th":
      fullDay = "thursday";
      break;
    case "f":
      fullDay = "friday";
      break;
    case "s":
      fullDay = "saturday";
      break;
  }
  return fullDay;
};
