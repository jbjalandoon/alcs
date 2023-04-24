const form = document.querySelector("#loginForm");
const submit = document.querySelector("#submit");
const alert = document.querySelector("#alert");
const alertList = document.querySelector("#alertList");
const csrf = document.querySelector("#csrf");
form.addEventListener("submit", async (e) => {
  try {
    e.preventDefault();
    const email = document.querySelector("#email");
    const password = document.querySelector("#password");

    const { data, status } = await axios.post(
      `/authentication/login`,
      {
        email: email.value,
        password: password.value,
      },
      {
        headers: { "csrf-token": csrf.value },
      }
    );

    if (data.role === "superadmin") {
      window.location.replace('/admin/dashboard')
    }
    if (data.role === "user") {
      window.location.replace('/user/schedule')
    } else {
      window.location.replace('/admin/dashboard')
    }
  } catch (error) {
    alert.classList.add("d-none");
    alertList.innerHTML = "";
    console.log(error.response);
    if (error.response.status === 400) {
      error.response.data.errors.forEach((e) => {
        const p = document.createElement("li");
        p.append(e);
        alertList.append(p);
      });
    }
    alert.classList.remove("d-none");
  }
});
