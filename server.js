const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3002;
const multer = require('multer');
const upload = multer();
const path = require('path');
const UserModel = require('./UserModel.js');
const imageToBase64 = require('image-to-base64');
const request = require('request');

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

const getBase64Data = (image) => {
    return image.replace(/^data:image\/jpeg;base64,/, "");
}

const createUserHandler = async (req, res, next) => {
    const name = req.body.name;
    const base64Data = getBase64Data(req.body.image);
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

const wait = (milleseconds) => {
    return new Promise(resolve => setTimeout(resolve, milleseconds))
}

const validateUser = async (req, res) => {
    const image1 = req.body.image;
    const prefix = "data:image/jpeg;base64,";
    const users = await UserModel.find();

    const results = [];

    for (let user of users) {
        const splits = user.imageUrl.split('/');
        const imagePath = __dirname + '/uploads/' + splits[splits.length - 1];
        let image2 = await imageToBase64(imagePath);
        image2 = prefix + image2;

        request.post({
            url: 'https://api-us.faceplusplus.com/facepp/v3/compare', formData: {
                api_key: 'wB0U2swa2c6Tabfv4ROQjScpe77DJ4iz',
                api_secret: 'Q23bxMQPHNifNfDKYJdsGOoBtc9PGxTM',
                image_base64_1: image1,
                image_base64_2: image2
            }
        }, (err, httpResponse, body) => {
            if (err) {
                results.push({ status: 'error', error: err });
            }
            const result = JSON.parse(body);

            if (result.error_message)
                results.push({ status: 'error', result });
            else
                results.push({ status: 'success', result, user });
        });
        await wait(1500);
    }

    setTimeout(() => {
        const positiveResults = results.filter((response) => {
            if (response.status !== 'error' & response.result.confidence >= 60) {
                return response;
            }
        });

        res.json({ result: positiveResults });
    }, 1000);
}

app.post('/user', createUserHandler);
app.get('/user', getUsers);
app.delete('/user/:id', deleteUser);
app.post('/validateUser', validateUser);

app.listen(port, () => {
    console.log('Server successfully started on port ' + port);
});
