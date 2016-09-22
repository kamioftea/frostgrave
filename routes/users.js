const express = require('express');
const router = express.Router();
const {db$} = require('../db-conn.js');
const bcrypt = require('bcryptjs');
const Rx = require('rxjs');

require('../rxUtil/mergeMapPersist.js')(Rx.Observable);

module.exports = (passport) => {
    router.get('/access-key/:access_key', (req, res, next) => {
            const {access_key} = req.params;
            req.logout();

            db$
                .mergeMap(db => db.collection('users').findOne({access_key}))
                .subscribe(
                    user => user
                        ? res.render('user/access-key', {title: 'Frostgrave Roster Management - Access Key', user, access_key})
                        : res.render('user/access-denied', {title: 'Frostgrave Roster Management - Access Key', access_key})
                    ,
                    err => res.redirect('/')
                )

        }
    );

    router.post('/access-key/:access_key',
        (req, res, next) => {
            if (!req.body) {
                return res.sendStatus(400);
            }

            const {access_key} = req.params;
            const {password, password_check} = req.body;

            const errHandler = err => {
                console.log(err);
                res.redirect('/');
            };


            var maybeUser$ = db$.mergeMapPersist(db => db.collection('users').findOne({access_key}));

            const [noUser$, user$] = maybeUser$.partition(([,user]) => !user);
            noUser$.subscribe(
                _ => res.render('user/access-denied', {title: 'Frostgrave Roster Management - Access Key', access_key}),
                errHandler
            );

            const [notValid$, valid$] = user$.partition(_ => !password || password != password_check);
            notValid$.subscribe(
                ([,user]) => res.render('user/access-key',
                    {
                        title:   'Frostgrave Roster Management - Access Key',
                                 user,
                                 access_key,
                        message: password ? "Passwords must match" : "Password must not be empty"
                    }),
                errHandler
            );

            valid$
                .mergeMapPersist(_ => Rx.Observable.bindNodeCallback(bcrypt.hash)(password, 14))
                .mergeMap(([db, user, hash]) => db.collection('users').updateOne(
                    {_id: user._id},
                        {
                            $set:   {password: hash},
                            $unset: {access_key: 1}
                        }))
                .subscribe(
                    _ => res.render('user/access-success', { title: 'Frostgrave Roster Management - Password Set' }),
                    errHandler
                );
        }
    );

    router.post('/login',
        passport.authenticate('local'),
        (req, res) => res.redirect(req.body.redirect_url || '/')
    );
    router.post('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    return router;
};
