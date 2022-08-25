const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const path = require("path");
const app = express();

const error = require("./controllers/error");

const adminRoutes = require("./routes/admin");
const store = new mongoDBStore({
  uri: "mongodb+srv://jerome:CasDIQRBZRbNSwA1@cluster0.dswk4w8.mongodb.net/shop",
  collection: "session",
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "node_modules")));
app.use(express.static(path.join(__dirname, "public")));
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
  res.locals.input_success_message = req.flash("input_success_message")[0];
  next();
});

app.use("/admin", adminRoutes);

app.use("/", error.get404);

mongoose
  .connect(
    "mongodb+srv://jerome:CasDIQRBZRbNSwA1@cluster0.dswk4w8.mongodb.net/?retryWrites=true&w=majority"
  )
  .then((result) => {
    // console.log(result);
    app.listen(3000);
  })
  .catch((error) => {
    throw new Error(error);
  });
