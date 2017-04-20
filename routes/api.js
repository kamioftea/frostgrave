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
        const users$ = db$.mergeMap(db => db.collection('users').find().sort({name: 1}).toArray());
        const soldiers$ = db$.mergeMap(db => db.collection('miniatures').find({type: 'soldier'}).sort({cost: 1, name: 1}).toArray());

        Rx.Observable.zip(spellSchools$, events$, roster$, users$, soldiers$)
            .subscribe(
                ([spell_schools, events, rosters, users, soldiers]) => {
                    res.json({
                        spell_schools,
                        events,
                        rosters,
                        user_map: users.reduce((acc, user) => Object.assign({}, acc, {[user._id]: user.name}), {}),
                        soldiers,
                        user:     req.user,
                    })
                },
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
                    model_limit: parseInt(event.model_limit) - 1,
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

        db$.mergeMapPersist(
            db => db.collection('rosters').updateOne(
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

router.delete('/roster/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = new ObjectId(id);

        return db$.mergeMap(db => db.collection('rosters').findOne({_id}))
            .validate(roster => !!roster, "Failed to find roster")
            .mergeMap(roster => db$.mergeMap(db => db.collection('deleted_rosters').insertOne(Object.assign({}, roster, {_id: undefined}))))
            .validate(({result}) => result.ok === 1 && result.n === 1, "Failed to backup roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').removeOne({_id})))
            .validate(({result}) => result.ok === 1 && result.n === 1, "Failed to delete roster")
            .subscribe(
                _ => res.json({roster_id: id}),
                error => {
                    console.error(error);
                    res.json({error: error.message || error})
                }
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
                {$pull: {[key]: null}}
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
                    .validate((apprentice_allowed) => apprentice_allowed, "Event doesn't allow apprentices");
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
                                name:           '',
                                                cost,
                                stat_modifiers: stat_block,
                                items:          [],
                                notes:          ''
                            }
                        },
                        $inc: {
                            treasury:    -cost,
                            model_limit: -1,
                        }
                    }
                )
            )
            .validate(({result: {nModified}}) => nModified === 1, "Failed to update roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').findOne({_id})))
            .subscribe(
                roster => res.json({roster}),
                error => {
                    console.log(error);
                    res.json({error: error.message ? error.message : error})
                }
            );

    }
);

router.delete('/roster/:id/apprentice',
    (req, res) => {
        const {id} = req.params;
        const _id = new ObjectId(id);

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
                            treasury:    parseInt(totalCost),
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

router.post('/roster/:id/soldier/:miniature_id',
    (req, res) => {
        const {id, miniature_id} = req.params;
        const _id = new ObjectId(id);

        const roster$ = db$.mergeMap(db => db.collection('rosters').findOne({_id}))
            .validate(roster => !!roster, "Failed to find roster")
            .validate(({model_limit, treasury}) => model_limit > 0 && treasury > 0, "Not enough space/funds to add soldier");

        const soldier$ = db$.mergeMap(db => db.collection('miniatures').findOne({_id: new ObjectId(miniature_id), type: 'soldier'}))
            .validate(soldier => !!soldier, "Failed to find soldier");

        Rx.Observable.zip(db$, roster$, soldier$)
            .mergeMap(([db,roster,soldier]) =>
                db.collection('rosters').updateOne(
                    {_id, user_id: req.user._id},
                    {
                        $push: {
                            soldiers: {
                                name:         '',
                                cost:         soldier.cost,
                                miniature_id: soldier._id,
                                items:        soldier.items.map(name => ({name})),
                                notes:        soldier.notes
                            }
                        },
                        $inc:  {
                            treasury:    -soldier.cost,
                            model_limit: -1,
                        }
                    }
                )
            )
            .validate(({result: {nModified}}) => nModified === 1, "Failed to update roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').findOne({_id})))
            .subscribe(
                roster => res.json({roster}),
                error => {
                    console.log(error);
                    res.json({error: error.message ? error.message : error})
                }
            );

    }
);

router.delete('/roster/:id/soldier/:index',
    (req, res) => {
        const {id, index} = req.params;
        const _id = new ObjectId(id);

        db$.mergeMap(db => db.collection('rosters').findOne({_id, user_id: req.user._id}))
            .validate(roster => !!roster, "Failed to find Roster")
            .mergeMap(roster => {
                const {cost, items} = roster.soldiers[index] || {};
                const totalCost = cost + (items || []).reduce((acc, item) => acc + parseInt(item.cost || 0), 0);
                return cost !== undefined
                    ? db$.mergeMap(
                    db => db.collection('rosters').updateOne(
                        {_id, user_id: req.user._id},
                        {
                            $unset: {['soldiers.' + index]: 1},
                            $inc:   {
                                treasury:    parseInt(totalCost),
                                model_limit: 1
                            }
                        }
                    ))
                    : Rx.Observable.throw("Failed to find apprentice to delete")
            })
            .validate(({result: {nModified}}) => nModified === 1, "Failed to update roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').updateOne(
                {_id},
                {$pull: {soldiers: null}}
            )))
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').findOne({_id})))
            .subscribe(
                roster => res.json({roster}),
                error => res.json({error: error.message ? error.message : error})
            );

    }
);

router.post('/roster/:id/spell/:spell_school_id/:spell_id',
    (req, res) => {
        const {id, spell_school_id, spell_id} = req.params;
        const _id = new ObjectId(id);

        const roster$ =
            db$.mergeMap(db => db.collection('rosters').findOne({_id}))
                .validate(roster => !!roster, "Failed to find roster");

        const event$ = roster$
            .mergeMap(roster => db$.mergeMap(db => db.collection('events').findOne({_id: ObjectId(roster.event_id)})))
            .validate((event) => !!event, "Failed to look up event");

        const wizard_spell_school$ = roster$
            .mergeMap(roster => db$.mergeMap(db => db.collection('spell_schools').findOne({_id: ObjectId(roster.wizard.spell_school_id)})))
            .validate((event) => !!event, "Failed to look up wizard spell_school");

        const new_spell_school$ =
            db$.mergeMap(db => db.collection('spell_schools').findOne({_id: ObjectId(spell_school_id)}))
                .validate(spell_school => spell_school && spell_school.spells && spell_school.spells[spell_id], "Failed to find new spell");

        Rx.Observable.zip(db$, roster$, event$, wizard_spell_school$, new_spell_school$)
            .mergeMap(([db,roster, event, wizard_spell_school, new_spell_school]) => {
                switch (true) {
                    case wizard_spell_school._id.equals(new_spell_school._id):
                        const existing_native = roster.spells.filter(_ => wizard_spell_school._id.equals(_.spell_school_id)).length;
                        if (existing_native >= event.native_spells) {
                            return Rx.Observable.throw("All ready has maximum allowed spells from that school");
                        }
                        break;

                    case wizard_spell_school.opposed_school == spell_school_id:
                        return Rx.Observable.throw("Spell is from opposed school");

                    case roster.spells.filter(_ => _.spell_school_id == spell_school_id).length > 0:
                        return Rx.Observable.throw("All ready has maximum allowed spells from that school");

                    case wizard_spell_school.allied_schools.includes(spell_school_id):
                        const existing_allied = roster.spells.filter(_ => wizard_spell_school.allied_schools.includes(_.spell_school_id)).length;
                        if (existing_allied >= event.allied_spells) {
                            return Rx.Observable.throw("All ready has maximum allowed allied spells.");
                        }
                        break;
                    default:
                        const existing_neutral = roster.spells
                            .filter(_ => !wizard_spell_school.allied_schools.includes(_.spell_school_id))
                            .filter(_ => ![roster.wizard.spell_school_id, wizard_spell_school.opposed_school].includes(_.spell_school_id))
                            .length;
                        if (existing_neutral >= event.neutral_spells) {
                            return Rx.Observable.throw("All ready has maximum allowed neutral spells.");
                        }
                }

                const newSpells =
                    (roster.spells || [])
                        .filter(_ => _.spell_id != spell_id)
                        .concat([{
                            spell_id:        spell_id,
                            spell_school_id: spell_school_id
                        }]);
                return db.collection('rosters').updateOne(
                    {_id, user_id: req.user._id},
                    {
                        $set: {
                            spells: newSpells,
                        },
                    }
                )
            })
            .validate(({result: {nModified}}) => nModified === 1, "Failed to update roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').findOne({_id})))
            .subscribe(
                roster => res.json({roster}),
                error => {
                    console.log(error);
                    res.json({error: error.message ? error.message : error})
                }
            );

    }
);

router.delete('/roster/:id/spell/:spell_id',
    (req, res) => {
        const {id, spell_id} = req.params;
        const _id = new ObjectId(id);

        db$.mergeMap(db => db.collection('rosters').findOne({_id, user_id: req.user._id}))
            .validate(roster => !!roster, "Failed to find Roster")
            .mergeMap(roster => {
                const newSpells = (roster.spells || []).filter(_ => _.spell_id != spell_id);

                return db$.mergeMap(
                    db => db.collection('rosters').updateOne(
                        {_id, user_id: req.user._id},
                        {
                            $set: {spells: newSpells}
                        }
                    )
                );
            })
            .validate(({result: {nModified}}) => nModified === 1, "Failed to update roster")
            .mergeMapTo(db$.mergeMap(db => db.collection('rosters').findOne({_id})))
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
