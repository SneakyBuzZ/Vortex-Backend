import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDb connected! Db host : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("DB | INDEX.JS | FAILED TO CONNECT TO DB : ", error);
        process.exit(1)
    }
}

export default connectDb;