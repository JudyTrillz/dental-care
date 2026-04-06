const db = require("../config/firebase");

const getDentists = async (req, res) => {
  try {
    const snapshot = await db.collection("dentists").get();
    const dentists = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(dentists);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dentists" });
  }
};

const createDentist = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const { FieldValue } = require("firebase-admin").firestore;

    const ref = await db.collection("dentists").add({
      name,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ id: ref.id, name });
  } catch (error) {
    res.status(500).json({ error: "Failed to create dentist" });
  }
};

module.exports = { getDentists, createDentist };
