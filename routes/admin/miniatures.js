const express = require('express');
const router = express.Router();
const {db$} = require('../../db-conn.js');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');
const {writeMessage} = require('../../flashMessage');

require('../../rxUtil/validate')(Rx.Observable);
require('../../rxUtil/mergeMapPersist')(Rx.Observable);

const objMap = (f) => (a, b) =>
    Object.keys(a).reduce(
        (acc, key) => Object.assign({}, acc, {[key]: f(a[key], b[key])}),
        {}
    );


router.get('/',
    (req, res) => {
        const wizard$ = db$.mergeMap(db => db.collection('miniatures').findOne({type: 'wizard'}));
        const apprentice$ = db$.mergeMap(db => db.collection('miniatures').findOne({type: 'apprentice'}));
        const soldiers$ = db$.mergeMap(db => db.collection('miniatures').find({type: 'soldier'}).sort({cost: 1, name: 1}).toArray());

        Rx.Observable.zip(wizard$, apprentice$, soldiers$).subscribe(
            ([wizard, apprentice, soldiers]) => {
                const sample_apprentice = objMap((a, b) => parseInt(a) + (parseInt(b) || 0))(wizard.stat_block || {}, apprentice.stat_block || {});
                res.render(
                    'admin/miniatures/index',
                    {
                        title:    'Miniatures - Admin - Frostgrave Roster Management',
                        layout:   'admin/layout',
                        base_url: req.baseUrl,
                                  wizard,
                                  apprentice,
                                  sample_apprentice,
                                  soldiers
                    }
                )
            }
        );

    }
);

router.get('/add/:type',
    (req, res, next) => {
        const {type} = req.params;
        let miniature, locked;

        switch (type) {
            case 'wizard':
                miniature = {name: 'Wizard', type, cost: 0};
                locked = {name: true, cost: true};
                break;

            case 'apprentice':
                miniature = {name: 'Apprentice Modifier', type, cost: 0};
                locked = {name: true};
                break;

            case 'soldier':
                miniature = {name: '', type, cost: 0};
                locked = {};
                break;

            default:
                // fall through to 404
                return next();
        }

        res.render(
            'admin/miniatures/edit',
            {
                title:  'Add ' + miniature.name + ' - Admin - Frostgrave Roster Management',
                layout: 'admin/layout',
                url:    req.baseUrl + '/add',
                        miniature,
                        locked
            }
        )
    }
);

router.post('/add',
    (req, res) => {
        const {type, name, cost, stat_block, items, notes} = req.body;

        db$.mergeMap(db => db.collection('miniatures').insertOne({
            type,
            name,
            cost,
            stat_block,
            items: (items || '').split(/\s*,\s*/).filter(Boolean),
            notes
        })).subscribe(
            _ => res.redirect(req.baseUrl),
            err => {
                console.error(err);
                res.redirect(req.baseUrl)
            }
        )
    }
);

router.get('/edit/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('miniatures').findOne({_id}))
            .subscribe(
                miniature => {
                    const locked = {
                            wizard:     {name: true, cost: true},
                            apprentice: {name: true}
                        }[miniature.type] || {};

                    res.render(
                        'admin/miniatures/edit',
                        {
                            title:  'Edit ' + miniature.name + ' - Admin - Frostgrave Roster Management',
                            layout: 'admin/layout',
                            url:    req.baseUrl + '/edit/' + miniature._id,
                                    miniature,
                                    locked
                        }
                    )
                },
                err => {
                    console.error(err);
                    res.redirect(req.baseUrl)
                }
            )
    }
);

router.post('/edit/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);
        const {type, name, cost, stat_block, items, notes} = req.body;

        db$.mergeMap(db => db.collection('miniatures').updateOne(
            {_id},
            {
                type,
                name,
                cost,
                stat_block,
                items: (items || '').split(/\s*,\s*/).filter(Boolean),
                notes
            }
        )).subscribe(
            _ => res.redirect(req.baseUrl),
            err => {
                console.error(err);
                res.redirect(req.baseUrl)
            }
        )
    }
);

router.get('/delete/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('miniatures').findOne({_id}))
            .subscribe(
                miniature =>
                    res.render(
                        'admin/miniatures/delete',
                        {
                            title:  'Delete ' + miniature.name + ' - Admin - Frostgrave Roster Management',
                            layout: 'admin/layout',
                            base_url: req.baseUrl,
                                    miniature,
                        }
                    ),
                err => {
                    console.error(err);
                    res.redirect(req.baseUrl)
                }
            )
    }
);

router.post('/delete/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('miniatures').removeOne({_id}))
            .subscribe(
                _ => res.redirect(req.baseUrl),
                err => {
                    console.error(err);
                    res.redirect(req.baseUrl)
                }
            )
    }
);

module.exports = router;
