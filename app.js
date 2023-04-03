const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
require("dotenv").config();
const path = require("path");
const app = express();
const multer = require("multer");
const compression = require("compression");
const { get404 } = require("./controllers/error");
const db_uri = process.env.DB;
const apiRoutes = require("./routes/api");
const curriculumRoutes = require("./routes/curriculum");
const dashboardRoutes = require("./routes/dashboard");

const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const scheduleRoutes = require("./routes/schedule");
const authenticationRoutes = require("./routes/authentication");
const {
  validateAdminAuthorization,
  validateAuthentication,
  validateFacultyAuthorization,
} = require("./middleware/validation");

const port = process.env.PORT || 3000;

/* MIDDLEWARE CONFIGURATION */
app.use(compression());
app.use(multer({ storage: multer.memoryStorage() }).single("spreadsheet"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const store = new mongoDBStore({
  uri: db_uri,
  collection: "session",
});
app.use(
  session({
    secret: process.env.SESSION_SECRET,
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
  res.locals.email = req.session.user?.email;
  res.locals.userId = req.session.user?.userId;
  res.locals.role = req.session.user?.role;
  res.locals.errorMessage = req.flash("errorMessage")[0];
  next();
});

/* ROUTER CONFIGURATION */
app.use("/authentication", authenticationRoutes);
app.use(
  "/admin",
  validateAuthentication,
  validateAdminAuthorization,
  adminRoutes
);
app.use(
  "/user",
  validateAuthentication,
  validateFacultyAuthorization,
  userRoutes
);
app.use("/api", apiRoutes);
app.use("/api/curriculums", curriculumRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/", get404);

mongoose.set("strictQuery", false);
/* SERVER INITIALIZATION */
app.listen(port, async (server) => {
  try {
    await mongoose.connect(process.env.DB);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      socket.on("joinRoom", (room) => {
        console.log(`joined room - ${room} `);
        socket.join(room);
      });
      socket.on("leaveRoom", (room) => {
        if (room) {
          console.log(`leaved room - ${room} `);
          socket.leave(room);
        }
      });
      socket.on("joinSection", (section) => {
        console.log(`joined section - ${section} `);
        socket.join(section);
      });
      socket.on("leaveSection", (section) => {
        if (section) {
          console.log(`leaved section - ${section} `);
          socket.leave(section);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
});
