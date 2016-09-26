const express = require('express');
const router = express.Router();
const {authenticated} = require('../authenticateRequest');

/* GET home page. */
router.get('/',
    authenticated(),
    (req, res) => res.render('roster', {title: 'Frostgrave Roster Management'})
);

module.exports = router;
