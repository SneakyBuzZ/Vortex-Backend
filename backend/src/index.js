import dotenv from 'dotenv';
import connectDb from "./db/index.js"

dotenv.config({
    path: "./env"
})

connectDb();










//================================================== ANOTHER APPROACH=============================================

/*
import express from "express";

const app = express();

; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        app.on("error", (error) => {
            console.log(error)
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on PORT : ${process.env.PORT}`)
        })


    } catch (error) {
        console.log("SRC | INDEX.JS | FAILED TO CONNECT TO DB : ", error)
    }
})()
*/