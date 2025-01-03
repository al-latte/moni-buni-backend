import mongoose from "mongoose";

const connectToMongoDB = async () => {
    try {
        if (!process.env.MONGO_DB_URI) {
            throw new Error('MONGO_DB_URI environment variable is not defined');
        }
        await mongoose.connect(process.env.MONGO_DB_URI)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Error connecting to MongoDB", (error as Error).message)
    }
}

export default connectToMongoDB