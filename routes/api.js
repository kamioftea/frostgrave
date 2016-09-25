const express = require('express');
const router = express.Router();
const {db$} = require('../db-conn.js');
const Rx = require('rxjs');
const {ObjectId} = require('mongodb');
const {authenticated} = require('../authenticateRequest');

require('../rxUtil/validate')(Rx.Observable);
require('../rxUtil/mergeMapPersist')(Rx.Observable);

router.use(authenticated(null, true));

router.get('/data',
    (req, res) => {
        const spellSchools$ = db$.mergeMap(db => db.collection('spell_schools').find().sort({name: 1}).toArray());
        const events$ = db$.mergeMap(db => db.collection('events').find().sort({name: 1}).toArray());
        const roster$ = db$.mergeMap(db => db.collection('rosters').find().sort({name: 1}).toArray());

        Rx.Observable.zip(spellSchools$, events$, roster$)
            .subscribe(
                ([spell_schools, events, rosters]) => res.json({
                    spell_schools,
                    events,
                    rosters,
                    user: req.user,
                }),
                error => res.json({error: error.message})
            )
    }
);

router.post('/roster',
    (req, res) => {
        const {name, spell_school_id, event_id} = req.body;
        const _id = new ObjectId();
        const user_id = req.user._id;

        const wizard$ = db$.mergeMap(db => db.collection('miniatures').findOne({type: 'wizard'}))
            .validate(wizard => !!wizard, "Base wizard stat line not configured");

        const spellSchool$ = db$.mergeMap(db => db.collection('spell_schools').findOne({_id: new ObjectId(spell_school_id)}))
            .validate(spell_school => {console.log(spell_school); return !!spell_school}, "Failed to load spell school");

        const event$ = db$.mergeMap(db => db.collection('events').findOne({_id: new ObjectId(event_id)}))
            .validate(spell_school => !!spell_school, "Failed to load event");

        Rx.Observable.zip(wizard$, spellSchool$, event$, db$)
            .mergeMapPersist(([wizard, spell_school, event, db]) =>
                db.collection('rosters').insertOne({
                    _id,
                    name,
                    wizard: {
                        name: '',
                        spell_school_id,
                        stat_block: wizard.stat_block,
                    },
                    spells: [],
                    soldiers: [],
                    treasury: event.points_limit,
                    model_limit: event.model_limit,
                    event_id,
                    user_id
                })
            )
            .validate(([,,,,{result: {ok, n}}]) => ok && n == 1, "Failed to insert roster")
            .mergeMap(([,,,db,]) => db.collection('rosters').findOne({_id}))
            .subscribe(
                roster => res.json({roster}),
                error => res.json({error})
            )
    }
);

// JSON 404
router.use((req, res) => {
    res.statusCode = 404;
    res.json({
        error: req.baseUrl + req.url + ' Not Found'
    });
});

module.exports = router;
