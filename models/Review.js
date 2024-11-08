const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
