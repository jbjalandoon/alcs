const express = require("express");

const authentication = require("../controllers/authentication");

const router = express.Router();

router.get("/login", authentication.login);
router.post("/login", authentication.login);

router.post("/logout", authentication.logout);

module.exports = router;
