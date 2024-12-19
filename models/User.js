// models/User.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customListSchema = new Schema(
    {
        name: { type: String, required: true },
        trips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
    },
    { _id: true }
);

const paymentHistorySchema = new Schema({
    productId: { type: String, required: true },
    purchaseToken: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    transactionType: { type: String, enum: ['Subscription', 'CreditPurchase'], required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Cancelled', 'Refunded'], default: 'Pending' },
});

const userSchema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false },
        friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        isVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        profilePicture: {
            url: { type: String },
            public_id: { type: String },
        },
        bio: { type: String },
        paymentHistory: [paymentHistorySchema],
        favorites: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
        role: {
            type: String,
            enum: ['admin', 'premium', 'pro', 'vip', 'free'],
            default: 'free',
            required: true,
        },
        subscriptionExpiry: { type: Date },
        credits: { type: Number, default: 0 },
        customLists: [customListSchema],
        trips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
        travelPreferences: {
            travelDates: {
                startDate: { type: Date },
                endDate: { type: Date },
            },
            destinationPreferences: {
                type: { type: String },
                region: { type: String },
                climate: { type: String },
            },
            budget: {
                total: { type: Number },
                allocation: { type: String },
            },
            interests: [{ type: String }],
            accommodationPreferences: {
                type: { type: String },
                stars: { type: String },
                location: { type: String },
                amenities: [{ type: String }],
            },
            transportPreferences: {
                preferredMode: { type: String },
                mobility: { type: String },
                specialNeeds: { type: String },
            },
            foodPreferences: {
                cuisine: [{ type: String }],
                dietaryRestrictions: { type: String },
                culinaryExperiences: [{ type: String }],
            },
            travelCompanion: {
                type: { type: String },
                ages: [{ type: Number }],
                specialRequirements: { type: String },
            },
            activityLevel: {
                pace: { type: String },
                freeTimePreference: { type: String },
            },
            additionalPreferences: { type: String },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);