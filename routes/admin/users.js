const express = require('express');
const router = express.Router();
const {db$} = require('../../db-conn.js');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');
const randomBytes = Rx.Observable.bindNodeCallback(require('crypto').randomBytes);
const {writeMessage} = require('../../flashMessage');

require('../../rxUtil/validate')(Rx.Observable);
require('../../rxUtil/mergeMapPersist')(Rx.Observable);

router.get('/', (req, res) => {
    const addUserActions = user => {
        const roleActions = ['Admin', 'Registered'].map(role => {
                const url = [req.baseUrl, 'toggle-role', user._id, role].join('/');

                if(user._id.equals(req.user._id) && role == 'Admin')
                {
                    return null;
                }

                return user.roles.includes(role)
                    ? {label: 'Remove ' + role, color: 'alert', post: url}
                    : {label: 'Add ' + role, color: 'primary', post: url}
            }
        );
        const actions = [
            user.access_key
                ? {label: user.access_key, color: 'secondary', get: '/user/access-key/' + user.access_key}
                : {label: 'Generate Access Key', color: 'primary', post: req.baseUrl + '/generate-access-key/' + user._id},

            ...roleActions
        ];

        return Object.assign({}, user, {actions});
    };


    db$
        .mergeMap(
            db => db.collection('users')
                .find()
                .sort({name: 1})
                .toArray())
        .subscribe(
            users => res.render('admin/users', {layout: 'admin/layout', title: 'Users - Admin - Frostgrave Roster Management', users: users.map(addUserActions)}),
            err => {
                console.log(err);
                res.redirect(baseUrl);
            }
        )
});

router.post('/generate-access-key/:id', (req, res) => {
    const {id} = req.params;
    const _id = ObjectId(id);

    db$.mergeMapPersist(db => db.collection('users').findOne({_id}))
        .validate(([,user]) => !!user, "Failed to find user")
        .mergeMapPersist(_ => randomBytes(16).map(buffer => buffer.toString('hex')))
        .mergeMap(
            ([db, user, access_key]) =>
                db.collection('users').updateOne(
                    {_id},
                    {$set: {access_key}}
                )
        )
        .subscribe(
            _ => res.redirect(req.baseUrl),
            err => {
                console.log(err);
                res.redirect(req.baseUrl)
            }
        )

});

router.post('/toggle-role/:id/:role', (req, res) => {
    const {id, role} = req.params;
    const _id = ObjectId(id);

    db$.mergeMapPersist(db => db.collection('users').findOne({_id}))
        .validate(([,user]) => !!user, "Failed to find user")
        .mergeMap(([db,user]) => {
            const removed = user.roles.filter(r => r != role);
            const toggled = removed.length == user.roles.length
                ? removed.concat([role])
                : removed;

            return db.collection('users').updateOne(
                {_id},
                {$set: {roles: toggled}}
            )
        })
        .subscribe(
            _ => {
                writeMessage(req, 'User role updated.', 'success');
                res.redirect(req.baseUrl);
            },
            err => {
                writeMessage(req, 'Failed to update user: ' + err, 'alert');
                res.redirect(req.baseUrl);
            }
        )
});

module.exports = router;