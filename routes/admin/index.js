const express = require('express');
const router = express.Router();
const {authenticated} = require('../../authenticateRequest');
const {readMessage} = require('../../flashMessage');

const adminPages = [
    {url: '/users', label: 'Users', router: require('./users')},
    {url: '/events', label: 'Events'},
    {url: '/spells', label: 'Spells'},
    {url: '/soldiers', label: 'Soldiers'},
];

router.use(authenticated('Admin'));
router.use(readMessage);
router.use((req, res, next) => {
    res.locals.adminPages = adminPages.map(
        ({url, label}) => ({url: req.baseUrl + url, label, active: req.url == url})
    );
    next();
});
router.get('/', (req, res) => res.render('admin/index', {layout: 'admin/layout', title: 'Admin - Frostgrave Roster Management'}));

adminPages
    .filter(({router: subRouter}) => subRouter != undefined)
    .forEach(({url, router: subRouter}) => router.use(url, subRouter));

module.exports = router;