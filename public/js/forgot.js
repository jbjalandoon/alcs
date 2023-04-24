const form = document.querySelector("#forgotForm");
const submit = document.querySelector("#submit");
const alert = document.querySelector("#alert");
const successAlert = document.querySelector("#successAlert");
const alertList = document.querySelector("#alertList");
const csrf = document.querySelector("#csrf");
console.log(form)
form.addEventListener("submit", async (e) => {
  try {
    e.preventDefault();
    alert.classList.add("d-none");
    successAlert.classList.add("d-none");
    submit.innerHTML = "Sending...";
    submit.classList.add("disabled");

    const email = document.querySelector("#email");

    const { data, status } = await axios.post(
      `/authentication/forgot`,
      {
        email: email.value,
      },
      { headers: { "csrf-token": csrf.value } }
    );

    successAlert.classList.remove("d-none");
  } catch (error) {
    alertList.innerHTML = "";
    console.log(error);
    if (error.response.status === 400) {
      error.response.data.errors.forEach((e) => {
        const p = document.createElement("li");
        p.append(e);
        alertList.append(p);
      });
    }
    alert.classList.remove("d-none");
  } finally {
    submit.innerHTML = "Send";
    submit.classList.remove("disabled");
  }
});
