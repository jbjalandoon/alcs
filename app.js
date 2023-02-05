const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
require("dotenv").config();
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
const multer = require("multer");

const User = require("./models/user");
const FacultyType = require("./models/faculty-type");

const error = require("./controllers/error");
const db_uri = "mongodb://localhost:27017/alcs";

const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const authenticationRoutes = require("./routes/authentication");
const store = new mongoDBStore({
  uri: db_uri,
  collection: "session",
});

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "uploads"));
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
//   },
// });

app.use(multer({ storage: multer.memoryStorage() }).single("spreadsheet"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({}));

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
  res.locals.email = req.session.user ? req.session.user.email : null;
  res.locals.userId = req.session.user ? req.session.user._id : null;
  res.locals.role = req.session.user ? req.session.user.role : null;
  res.locals.input_success_message = req.flash("input_success_message")[0];
  next();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use("/authentication", authenticationRoutes);
app.use((req, res, next) => {
  if (res.locals.isActive) {
    next();
  } else {
    res.redirect("/authentication/login?landing=" + req.path);
  }
});
app.use(
  "/admin",
  (req, res, next) => {
    if (req.session.user.role === "admin") {
      return next();
    }
    if (req.session.user.role === "superadmin") {
      return next();
    }
    return res.render("error/404", {
      title: "ALCS | 404 Page Not Found",
    });
  },
  adminRoutes
);
app.use(
  "/user",
  (req, res, next) => {
    if (req.session.user.role !== "user") {
      return res.render("error/404", {
        title: "ALCS | 404 Page Not Found",
      });
    }
    next();
  },
  userRoutes
);
app.use("/api", apiRoutes);
app.use("/", error.get404);
mongoose.set("strictQuery", false);
mongoose
  .connect(db_uri)
  .then((result) => {
    return User.findOne({
      email: "jerome.jalandoon@gmail.com",
    });
  })
  .then((result) => {
    if (result == null) {
      return bcrypt
        .hash("adminpassword", 12)
        .then((password) => {
          return User.insertMany([
            {
              email: "superadmin",
              password: password,
              role: "superadmin",
            },
            {
              email: "jerome.jalandoon@gmail.com",
              password: password,
              role: "admin",
            },
          ]);
        })
        .then((result) => {
          app.listen(3000);
        });
    }
    return FacultyType.bulkWrite([
      {
        updateOne: {
          filter: { facultyType: "regular" },
          update: {
            facultyType: "regular",
            unitsCap: 15,
            hoursCap: 35,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { facultyType: "full-time" },
          update: {
            facultyType: "full-time",
            unitsCap: 15,
            hoursCap: 35,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { facultyType: "part-time" },
          update: {
            facultyType: "part-time",
            unitsCap: 15,
            hoursCap: 35,
          },
          upsert: true,
        },
      },
    ]).then((result) => {
      console.log(result);
      app.listen(3000);
    });
  })
  .catch((error) => {
    throw new Error(error);
  });
