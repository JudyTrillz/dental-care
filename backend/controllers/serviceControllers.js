const db = require("../config/firebase");

const getServices = async (req, res) => {
  try {
    const snapshot = await db.collection("services").get();
    const services = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

const createService = async (req, res) => {
  try {
    const { name, duration } = req.body;

    if (!name || !duration || typeof duration !== "number") {
      return res.status(400).json({ error: "Valid name and duration are required" });
    }

    const ref = await db.collection("services").add({
      name,
      duration,
      createdAt: new Date(),
    });

    res.status(201).json({
      id: ref.id,
      name,
      duration,
      createdAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create service" });
  }
};
module.exports = { getServices, createService };
