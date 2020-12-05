const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3002;
const multer = require('multer');
const upload = multer();
const path = require('path');
const UserModel = require('./UserModel.js');
const { ObjectId } = require('mongodb');

require("./core/mongoose");

app.use(bodyParser.json());
app.use(upload.array());

const dir = path.join(__dirname, 'uploads');
app.use(express.static(dir));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const origin = 'http://localhost:3002';

const createUserHandler = async (req, res, next) => {
    const name = req.body.name;
    const base64Data = req.body.image.replace(/^data:image\/jpeg;base64,/, "");
    let imageName = name + Math.ceil(Math.random() * 100000) + '.jpeg';
    imageName = imageName.replace(" ", '');
    fs.writeFile(`uploads/${imageName}`, base64Data, 'base64', (err) => {
        if (err) res.status(500).json(err);
        const postData = {
            fullname: name,
            imageUrl: origin + '/' + imageName
        }
        const newUser = new UserModel(postData);
        newUser.save().then((savedUser) => {
            res.json({ status: 'Success', user: savedUser });
        }).catch(() => {
            res.status(500).json({ status: 'Internal Error', message: "Something went wrong" });
        })
    });
}


const getUsers = async (req, res) => {
    try {
        const users = await UserModel.find({});
        res.json({ status: 'success', users });
    } catch {
        res.status(500).json({ status: 'error', message: "Something went wrong" });
    }
}


// const deleteUser = (req, res) => {
//     const id = ObjectId(req.params.id);
//     console.log(id);
//     UserModel.findById(id, (err, user) => {
//         if (err)
// return res.status(404).json({ status: 'error', message: 'User is not found' });

//         console.log(user, err);

// let imagePath = user.imageUrl;
// const paths = imagePath.split('/');
// const imageName = paths[paths.length - 1];
// imagePath = '/uploads/' + imageName;
// console.log(imagePath);
// fs.unlink(imagePath, (err) => {
//     if (err)
//         res.status(500).json({ status: 'error', message: 'Can not delete image' });

//     user.remove().then(() => {
//         res.json({ status: 'success', message: 'User successfullt deleted' });
//     }).catch(() => {
//         res.status(500).json({ status: 'error', message: 'Can not delete user' });
//     });
// });
//     });
// };

const deleteUser = async (req, res, next) => {
    const id = req.params.id;
    try {
        const user = await UserModel.findOne({ _id: id });
        let imagePath = user.imageUrl;
        const paths = imagePath.split('/');
        const imageName = paths[paths.length - 1];
        imagePath = __dirname + '/uploads/' + imageName;
        return fs.unlink(imagePath, (err) => {
            if (err)
                res.status(500).json({ status: 'error', message: 'Can not delete image' });

            user.remove().then((user) => {
                res.json({ status: 'success', message: 'User successfully deleted', user: user });
            }).catch(() => {
                res.status(500).json({ status: 'error', message: 'Can not delete user' });
            });
        });
    } catch {
        return res.status(404).json({ status: 'error', message: 'User is not found' });
    }
}

app.post('/user', createUserHandler);
app.get('/user', getUsers);
app.delete('/user/:id', deleteUser);
app.listen(port, () => {
    console.log('Server successfully started on port ' + port);
});
