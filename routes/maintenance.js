const express = require("express");

const validateForm = require("../middleware/validate-form");
const validation = require("../validations/maintenance");

const user = require("../controllers/api/user");

const router = express.Router();

router.get("/users", user.get);
router.get("/users/:id", user.getOne);
router.post("/users", validation.user, validateForm, user.post);
router.put("/users/:id", validation.user, validateForm, user.edit);
router.delete("/users/:id", user.delete);

module.exports = router;
