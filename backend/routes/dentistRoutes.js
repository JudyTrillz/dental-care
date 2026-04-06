const express = require("express");
const router = express.Router();

const { getDentists, createDentist } = require("../controllers/dentistControllers");

router.get("/", getDentists);
router.post("/", createDentist);

module.exports = router;
