import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
    subscribers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    channel: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, { timestamps: true })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)