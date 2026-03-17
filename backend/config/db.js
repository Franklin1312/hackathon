const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ⚠️ REPLACE: Set your MongoDB URI in the .env file as MONGO_URI
    // Example: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/civicconnect
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
