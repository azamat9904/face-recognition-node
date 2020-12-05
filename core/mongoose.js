const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/face-recognition", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
}, (err) => {
    if (err) {
        throw Error(err);
    }
});
