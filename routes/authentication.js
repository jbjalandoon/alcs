const express = require("express");

const authentication = require("../controllers/authentication");
const validation = require("../validations/maintenance");

const router = express.Router();

router.get("/login", authentication.login);
router.post("/login", authentication.login);
router.get("/forgot", authentication.getForgotPassword);
router.post("/forgot", authentication.postForgotPassword);
router.get("/reset/:token", authentication.reset);
router.post("/reset", authentication.postReset);

router.put(
  "/password",
  validation.changePassword,
  authentication.changePassword
);

router.post("/logout", authentication.logout);

module.exports = router;
