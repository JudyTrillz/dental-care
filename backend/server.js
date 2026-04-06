require("dotenv").config();
const dentistRoutes = require("./routes/dentistRoutes");

const express = require("express");
const cors = require("cors");
const routes = require("./routes/index");
const serviceRoutes = require("./routes/serviceRoutes");
const seedServices = require("./utils/seedServices");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api", routes);
app.use("/api/services", serviceRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/bookings", bookingRoutes);

const startServer = async () => {
  try {
    await seedServices();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
  }
};

startServer();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
