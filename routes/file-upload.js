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

        gm(tmpPath).size((err, size) => {
            if(err) return onError(err);

            const {width, height} = size;

            mkdirp(path.dirname(filePath), function (err) {
                if (err) return onError(err);

                const heightRatio = TARGET_HEIGHT / height;
                const widthRatio = TARGET_WIDTH / width;

                const [crop_x, crop_y, crop_w, crop_h] = widthRatio > heightRatio
                    ? [0, (height - TARGET_HEIGHT / widthRatio) / 2, width, TARGET_HEIGHT / widthRatio]
                    : [(width - TARGET_WIDTH / heightRatio) / 2, 0, TARGET_WIDTH / heightRatio, height];

                gm(tmpPath)
                    .crop(crop_w, crop_h, crop_x, crop_y)
                    .resizeExact(TARGET_WIDTH, TARGET_HEIGHT)
                    .write(filePath, (err) => {
                        if (err) return onError(err);
                        return res.json({file_url: req.baseUrl + '/' + _id + '.png'})
                    })
            });
        });
    }
);

module.exports = router;
