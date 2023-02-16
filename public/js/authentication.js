const searchParams = new URLSearchParams(window.location.search);
if (searchParams.has("valid")) {
  document.querySelector("#alert").classList.remove("d-none");
  // $("#alert").removeClass("d-none");
}
// if (searchParams.has("forgot")) {
//   if (searchParams.get("forgot") !== "true") {
//     $("#alert").removeClass("d-none").html("No Email Found");
//   } else {
//     $("#alert").removeClass("d-none").html("Reset link has sent to your email");
//   }
// }
// if (searchParams.has("reset")) {
//   if (searchParams.get("reset") !== "true") {
//     $("#alert").removeClass("d-none").html("Something went wrong");
//   } else {
//     $("#alert").removeClass("d-none").html("Password successfully changed");
//   }
// }
// if (searchParams.has("email")) {
//   $("#email").val(searchParams.get("email"));
// }
