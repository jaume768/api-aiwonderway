const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customListSchema = new Schema(
    {
        name: { type: String, required: true },
        trips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
    },
    { _id: true }
);

const userSchema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        favorites: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
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
