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
        // rosters are sorted by the client
        const roster$ = db$.mergeMap(db => db.collection('rosters').find().toArray());

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
            .validate(spell_school => {
                console.log(spell_school);
                return !!spell_school
            }, "Failed to load spell school");

        const event$ = db$.mergeMap(db => db.collection('events').findOne({_id: new ObjectId(event_id)}))
            .validate(event => !!event, "Failed to load event");

        Rx.Observable.zip(wizard$, spellSchool$, event$, db$)
            .mergeMapPersist(([wizard, spell_school, event, db]) =>
                db.collection('rosters').insertOne({
                    _id,
                    name,
                    wizard:      {
                        name:       '',
                                    spell_school_id,
                        stat_block: wizard.stat_block,
                        items:      [],
                        notes:      ''
                    },
                    items:       [],
                    spells:      [],
                    soldiers:    [],
                    treasury:    event.points_limit,
                    model_limit: parseInt(event.model_limit),
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

router.put('/roster/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = new ObjectId(id);
        const update = req.body;
        console.log(update);

        db$.mergeMapPersist(db => db.collection('rosters').updateOne(
            {_id, user_id: req.user._id},
            {$set: update}
        ))
            .validate(([,{result: {nModified}}]) => nModified === 1, "Failed to update roster")
            .mergeMap(([db,]) => db.collection('rosters').findOne({_id}))
            .subscribe(
                roster => res.json({roster}),
                error => res.json({error})
            );
    }
);

router.post('/roster/:id/item',
    (req, res) => {
        const {id} = req.params;
        const _id = new ObjectId(id);
        const {target, item: {name, cost, bonus}} = req.body;

        db$
            .mergeMapPersist(db => db.collection('rosters').updateOne(
                {_id, user_id: req.user._id},
                {
                    $push: {[target + '.items']: {name, cost, bonus}},
                    $inc:  {treasury: -cost}
                }
            ))
            .validate(([,{result: {nModified}}]) => nModified === 1, "Failed to update roster")
            .mergeMap(([db,]) => db.collection('rosters').findOne({_id}))
            .subscribe(
                roster => res.json({roster}),
                error => res.json({error})
            );

    }
);

router.delete('/roster/:id/item/:target/:index',
    (req, res) => {
        const {id, target, index} = req.params;
        const _id = new ObjectId(id);
        const key = target + '.items';

        db$.mergeMapPersist(db => db.collection('rosters').findOne({_id}, {[key]: 1}))
            .mergeMapPersist(([db, result]) => {
                const {cost} = result[target].items[index] || {};
                return cost !== undefined
                    ? db.collection('rosters').updateOne(
                    {_id, user_id: req.user._id},
                    {
                        $unset: {[key + '.' + index]: 1},
                        $inc:   {treasury: cost}
                    }
                )
                    : Rx.Observable.throw("Failed to find item to delete")
            })
            .validate(([,,{result: {nModified}}]) => nModified === 1, "Failed to update roster")
            .mergeMapPersist(([db,]) => db.collection('rosters').updateOne(
                {_id, user_id: req.user._id},
                { $pull: {[key]: null} }
            ))
            .mergeMap(([db,]) => db.collection('rosters').findOne({_id}))
            .subscribe(
                roster => res.json({roster}),
                error => res.json({error: error.message ? error.message : error})
            );

    }
);

router.post('/roster/:id/apprentice',
    (req, res) => {
        const {id} = req.params;
        const _id = new ObjectId(id);

        db$.mergeMap(db => db.collection('rosters').findOne({_id}))
            .validate(roster => !!roster, "Failed to find roster")
            .mergeMap(roster => {
                const event$ = db$.mergeMap(db => db.collection('events').findOne({_id: new ObjectId(roster.event_id)}))
                    .validate(event => !!event, "Failed to load event")
                    .validate((apprentice_allowed) => apprentice_allowed, "Event doesnt allow apprentices");
                const apprentice$ = db$.mergeMap(db => db.collection('miniatures').findOne({type: 'apprentice'}))
                    .validate(apprentice => !!apprentice && !!apprentice.stat_block, "Failed to load apprentice stat modifiers");

                return Rx.Observable.zip(db$, event$, apprentice$)
            })
            .mergeMap(([db, ,{cost, stat_block}]) =>
                db.collection('rosters').updateOne(
                    {_id, user_id: req.user._id},
                    {
                        $set: {
                            apprentice: {
                                name: '',
                                cost,
                                stat_modifiers: stat_block,
                                items: [],
                                notes: ''
                            }
                        },
                        $inc:  {
                            treasury: -cost,
                            model_limit: -1,
                        }
                    }
                )
            )
            .validate(({result: {nModified}}) => nModified === 1, "Failed to update roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').findOne({_id})))
            .subscribe(
                roster => res.json({roster}),
                error => {console.log(error); res.json({error: error.message ? error.message : error})}
            );

    }
);

router.delete('/roster/:id/apprentice',
    (req, res) => {
        const {id, target, index} = req.params;
        const _id = new ObjectId(id);
        const key = target + '.items';

        db$.mergeMapPersist(db => db.collection('rosters').findOne({_id}))
            .mergeMapPersist(([db, result]) => {
                const {cost, items} = result.apprentice || {};
                const totalCost = cost + (items || []).reduce((acc, item) => acc + parseInt(item.cost), 0);
                return cost !== undefined
                    ? db.collection('rosters').updateOne(
                    {_id, user_id: req.user._id},
                    {
                        $unset: {apprentice: 1},
                        $inc:   {
                            treasury: parseInt(totalCost),
                            model_limit: 1
                        }
                    }
                )
                    : Rx.Observable.throw("Failed to find apprentice to delete")
            })
            .validate(([,,{result: {nModified}}]) => nModified === 1, "Failed to update roster")
            .mergeMap(([db]) => db.collection('rosters').findOne({_id}))
            .subscribe(
                roster => res.json({roster}),
                error => res.json({error: error.message ? error.message : error})
            );

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
