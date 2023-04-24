const form = document.querySelector("#resetForm");
const submit = document.querySelector("#submit");
const alert = document.querySelector("#alert");
const successAlert = document.querySelector("#successAlert");
const alertList = document.querySelector("#alertList");
const csrf = document.querySelector("#csrf");

form.addEventListener("submit", async (e) => {
  try {
    e.preventDefault();
    submit.innerHTML = "Submitting...";
    submit.classList.add("disabled");
    alert.classList.add("d-none");
    successAlert.classList.add("d-none");
    const newPassword = document.querySelector("#newPassword");
    const retypePassword = document.querySelector("#retypePassword");
    const id = document.querySelector("#id");
    const { data, status } = await axios.post(
      `/authentication/reset`,
      {
        newPassword: newPassword.value,
        retypePassword: retypePassword.value,
        id: id.value,
      },
      { headers: { "csrf-token": csrf.value } }
    );

    window.location.replace('/authentication/login')
  } catch (error) {
    console.log(error);
    alertList.innerHTML = "";
    if (error.response.status === 400) {
      error.response.data.errors.forEach((e) => {
        const p = document.createElement("li");
        p.append(e);
        alertList.append(p);
      });
    }
    alert.classList.remove("d-none");
  } finally {
    submit.innerHTML = "Submit";
    submit.classList.remove("disabled");
  }
});
