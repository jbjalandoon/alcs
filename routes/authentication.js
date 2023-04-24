const express = require("express");

const authentication = require("../controllers/authentication");
const validation = require("../validations/authentication");

const router = express.Router();

router.get("/login", authentication.login);
router.post("/login", validation.login, authentication.login);

router.get("/forgot", authentication.getForgotPassword);
router.post("/forgot", authentication.postForgotPassword);
router.get("/reset/:token", authentication.reset);
router.post("/reset", authentication.postReset);

router.put("/password", authentication.changePassword);

router.post("/logout", authentication.logout);

module.exports = router;
