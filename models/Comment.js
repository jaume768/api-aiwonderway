const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        content: { type: String, required: true },
        parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);