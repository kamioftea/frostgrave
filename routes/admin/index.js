const express = require('express');
const router = express.Router();
const {authenticated} = require('../../authenticateRequest');

const adminPages = [
    {url: '/users', label: 'Users', router: require('./users')},
    {url: '/events', label: 'Events'},
    {url: '/spells', label: 'Spells'},
    {url: '/soldiers', label: 'Soldiers'},
];

router.use(authenticated('Admin'));
router.use((req, res, next) => {
    res.locals.adminPages = adminPages.map(
        ({url, label}) => ({url: req.baseUrl + url, label, active: req.url == url})
    );
    next();
});

adminPages
    .filter(({router: subRouter}) => subRouter != undefined)
    .forEach(({url, router: subRouter}) => router.use(url, subRouter));

module.exports = router;