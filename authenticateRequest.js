const authenticated = (role = null) => (req, res, next) => {
    if(!req.user) {
        res.status(401);
        res.render('user/login', { title: 'Frostgrave Roster Management', redirect_url: req.baseUrl + req.url});
        return;
    }

    if(role && (!Array.isArray(req.user.roles) || !req.user.roles.includes(role)))
    {
        res.status(403);
        res.render('user/forbidden', { title: 'Forbidden - Frostgrave Roster Management' });
        return;
    }

    next();
};

module.exports = {
    authenticated
};