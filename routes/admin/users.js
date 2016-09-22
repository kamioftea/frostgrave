const express = require('express');
const router = express.Router();
const {db$} = require('../../db-conn.js');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');
const randomBytes = Rx.Observable.bindNodeCallback(require('crypto').randomBytes);

require('../../rxUtil/validate')(Rx.Observable);
require('../../rxUtil/mergeMapPersist')(Rx.Observable);

router.get('/', (req, res, next) => {
    db$
        .mergeMap(
            db =>
                db.collection('users')
                    .find()
                    .sort({name: 1})
                    .toArray())
        .subscribe(
            users => res.render('admin/users', {layout: 'admin/layout', title: 'Users - Admin - Frostgrave Roster Management', users}),
            err => {
                console.log(err);
                res.redirect(baseUrl);
            }
        )
});

router.post('/generate-access-key/:_id', (req, res) => {
    const {_id} = req.params;

    db$.mergeMapPersist(db => db.collection('users').findOne({_id: ObjectId(_id)}))
        .validate(([,user]) => !!user, "Failed to find user")
        .mergeMapPersist(_ => randomBytes(16).map(buffer => buffer.toString('hex')))
        .mergeMap(
            ([db, user, access_key]) =>
                db.collection('users').updateOne(
                    {_id: ObjectId(_id)},
                    {$set: {access_key}}
                )
        )
        .subscribe(
            _ => res.redirect(req.baseUrl),
            err => {console.log(err); res.redirect(req.baseUrl)}
        )

});

module.exports = router;