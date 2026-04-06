require("dotenv").config();
const express = require("express");
const cors = require("cors");

const routes = require("./routes/index");
const dentistRoutes = require("./routes/dentistRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const seedServices = require("./utils/seedServices");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: allow only your frontend
app.use(
  cors({
    origin: [
      "https://dentalcare-app.netlify.app", // frontend
      "https://dental-clinic-backend-gilt.vercel.app", // allow same-domain requests if needed
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use("/api", routes);
app.use("/api/services", serviceRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/bookings", bookingRoutes);

// Seed services and start server
const startServer = async () => {
  try {
    await seedServices();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    // Start server anyway if seeding fails
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (seeding failed)`);
    });
  }
};

startServer();
