const express = require('express');
const router = express.Router();
const {db$} = require('../../db-conn.js');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');

require('../../rxUtil/validate')(Rx.Observable);
require('../../rxUtil/mergeMapPersist')(Rx.Observable);

router.get('/',
    (req, res) => {
        db$.mergeMap(db => db.collection('events').find().sort({name: 1}).toArray())
            .subscribe(
                (events) => {
                    res.render(
                        'admin/events/index',
                        {
                            title:    'Events - Admin - Frostgrave Roster Management',
                            layout:   'admin/layout',
                            base_url: req.baseUrl,
                                      events
                        }
                    )
                }
            );
    }
);

router.get('/add',
    (req, res, next) => {
        res.render(
            'admin/events/add',
            {
                title:    'Add Event - Admin - Frostgrave Roster Management',
                layout:   'admin/layout',
                base_url: req.baseUrl,
            }
        )
    }
);

router.post('/add',
    (req, res) => {
        const {name, points_limit, model_limit, native_spells, allied_spells, neutral_spells, apprentice_allowed} = req.body;

        db$.mergeMap(db => db.collection('events').insertOne({
            name,
            points_limit:       parseInt(points_limit),
            model_limit:        parseInt(model_limit),
            native_spells:      parseInt(native_spells),
            allied_spells:      parseInt(allied_spells),
            neutral_spells:     parseInt(neutral_spells),
            apprentice_allowed: !!apprentice_allowed
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

        db$.mergeMap(db => db.collection('events').findOne({_id}))
            .subscribe(
                event => {
                    res.render(
                        'admin/events/edit',
                        {
                            title:    'Edit Event ' + event.name + ' - Admin - Frostgrave Roster Management',
                            layout:   'admin/layout',
                            base_url: req.baseUrl,
                                      event
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
        const {name, points_limit, model_limit, native_spells, allied_spells, neutral_spells, apprentice_allowed} = req.body;

        db$.mergeMap(db => db.collection('events').updateOne(
            {_id},
            {
                $set: {
                    name:               name,
                    points_limit:       parseInt(points_limit),
                    model_limit:        parseInt(model_limit),
                    native_spells:      parseInt(native_spells),
                    allied_spells:      parseInt(allied_spells),
                    neutral_spells:     parseInt(neutral_spells),
                    apprentice_allowed: !!apprentice_allowed
                }
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

        db$.mergeMap(db => db.collection('events').findOne({_id}))
            .subscribe(
                event =>
                    res.render(
                        'admin/events/delete',
                        {
                            title:    'Delete Event ' + event.name + ' - Admin - Frostgrave Roster Management',
                            layout:   'admin/layout',
                            base_url: req.baseUrl,
                                      event,
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

        db$.mergeMap(db => db.collection('events').removeOne({_id}))
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
