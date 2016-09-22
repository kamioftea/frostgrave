const express = require('express');
const router = express.Router();
const {authenticated} = require('../authenticateRequest');

/* GET home page. */
router.get('/',
    authenticated(),
    (req, res, next) => {
        res.json(req.user);
    });

module.exports = router;
