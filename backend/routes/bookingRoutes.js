const express = require("express");
const router = express.Router();

const { createBooking, getBookings } = require("../controllers/bookingControllers");

router.post("/", createBooking);
router.get("/", getBookings);

module.exports = router;
