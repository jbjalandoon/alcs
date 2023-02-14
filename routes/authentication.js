const express = require("express");

const authentication = require("../controllers/authentication");
const validation = require("../validations/maintenance");

const router = express.Router();

router.get("/login", authentication.login);
router.post("/login", authentication.login);

router.put(
  "/password",
  validation.changePassword,
  authentication.changePassword
);

router.post("/logout", authentication.logout);

module.exports = router;
