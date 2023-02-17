const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");
require("dotenv").config();
const path = require("path");
const bcrypt = require("bcrypt");
const Crypto = require("crypto");
const app = express();
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const User = require("./models/user");
const FacultyType = require("./models/faculty-type");
const Level = require("./models/level");

const error = require("./controllers/error");
const db_uri = process.env.DB;

const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const authenticationRoutes = require("./routes/authentication");
const store = new mongoDBStore({
  uri: db_uri,
  collection: "session",
});

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "uploads"));
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
//   },
// });
app.use(helmet());
app.use(compression());
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
let randomString;
mongoose
  .connect(db_uri)
  .then((result) => {
    return User.findOne({
      email: "sticaschedula@gmail.com",
    });
  })
  .then((result) => {
    if (result == null) {
      randomString = Crypto.randomBytes(8).toString("base64").slice(0, 9);
      return bcrypt.hash(randomString, 12).then((password) => {
        return new User({
          email: "sticaschedula@gmail.com",
          password: password,
          role: "superadmin",
        }).save();
      });
    }
    return Promise.resolve();
  })
  .then((result) => {
    if (result) {
      const emailDetails = {
        from: "sticaschedula@gmail.com",
        to: result.email,
        subject: "No Reply - Password Generated",
        text: randomString,
      };
      return mailTransporter.sendMail(emailDetails);
    }
    return Promise.resolve();
  })
  .then((result) => {
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
    ]);
  })
  .then((result) => {
    return Level.bulkWrite([
      {
        updateOne: {
          filter: { yearLevel: "first year", display: 1 },
          update: {
            yearLevel: "first year",
            display: 1,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { yearLevel: "second year", display: 2 },
          update: {
            yearLevel: "second year",
            display: 2,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { yearLevel: "third year", display: 3 },
          update: {
            yearLevel: "third year",
            display: 3,
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { yearLevel: "fourth year", display: 4 },
          update: {
            yearLevel: "fourth year",
            display: 4,
          },
          upsert: true,
        },
      },
    ]);
  })
  .then((result) => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((error) => {
    throw new Error(error);
  });
