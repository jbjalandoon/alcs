const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrf());
app.use(flash());
app.set("view engine", "ejs");
app.set("views", "views");

app.use((req, res, next) => {
  res.locals.csrf = req.csrfToken();
  res.locals.isActive = req.session.user ? true : false;
  // console.log(req.flash('error_message'))
  // console.log(req.flash('success_message'))
  next();
});

mongoose
  .connect(
    "mongodb+srv://jerome:CasDIQRBZRbNSwA1@cluster0.dswk4w8.mongodb.net/?retryWrites=true&w=majority"
  )
  .then((result) => {
    console.log(result);
    app.listen(3000);
  })
  .catch((error) => {
    throw new Error(error);
  });
