const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
