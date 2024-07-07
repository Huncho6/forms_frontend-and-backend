const { MongoClient } = require("mongodb");

const connectionString = "mongodb://localhost:27017/form;"

let db;

const connectDB = async () => {
    try {
        const client = new MongoClient(connectionString);
        await client.connect();
        console.log("MongoDB connected");
        db = client.db();
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
};

connectDB();

module.exports = {
    getDb: () => db
};