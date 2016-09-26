const express = require('express');
const router = express.Router();
const path = require('path');
const mkdirp = require('mkdirp');
const Rx = require('rxjs');
const multer = require('multer');
var upload = multer({ dest: path.join(__dirname, '..', 'tmp', 'uploads')});
const {ObjectId} = require('mongodb');

const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});

const TARGET_WIDTH = 300;
const TARGET_HEIGHT = 400;

router.get('/', express.static(path.join(__dirname, '..', 'uploads')));

router.post('/',
    upload.single('file'),
    (req, res) => {
        const {path: tmpPath} = req.file;
        const _id = new ObjectId();
        const filePath = path.join(__dirname, '..', 'uploads', _id + '.png');

        const onError = err => {console.log(err); res.json({error: err.message})};

        gm(tmpPath).size((err, {width, height}) => {
            if(err) return onError(err);

            mkdirp(path.dirname(filePath), function (err) {
                if (err) return onError(err);

                const heightRatio = TARGET_HEIGHT / height;
                const widthRatio = TARGET_WIDTH / width;

                const [crop_x, crop_y, crop_w, crop_h] = widthRatio > heightRatio
                    ? [0, ((TARGET_HEIGHT - (height * widthRatio)) / (widthRatio * 2)), TARGET_WIDTH / widthRatio, TARGET_HEIGHT / widthRatio]
                    : [((TARGET_WIDTH - (widthRatio * heightRatio)) / (heightRatio * 2)), 0, TARGET_WIDTH / heightRatio, TARGET_HEIGHT / heightRatio];

                console.log(crop_w, crop_h, crop_x, crop_y);

                gm(tmpPath)
                    .crop(crop_w, crop_h, crop_x, crop_y)
                    .resize(TARGET_WIDTH, TARGET_HEIGHT)
                    .write(filePath, (err) => {
                        if (err) return onError(err);
                        const data = {file_url: req.baseUrl + '/' + _id + '.png'};
                        console.log(data);
                        return res.json(data)
                    })
            });
        });
    }
);

module.exports = router;
