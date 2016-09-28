const express = require('express');
const router = express.Router();
const {db$} = require('../../db-conn.js');
const {ObjectId} = require('mongodb');
const Rx = require('rxjs');
const {writeMessage} = require('../../flashMessage');

require('../../rxUtil/validate')(Rx.Observable);
require('../../rxUtil/mergeMapPersist')(Rx.Observable);

router.get('/', (req, res) => {
    db$
        .mergeMap(
            db => db.collection('spell_schools')
                .find()
                .sort({name: 1})
                .toArray())
        .subscribe(
            spell_schools => res.render('admin/spells/index', {layout: 'admin/layout', title: 'Spells - Admin - Frostgrave Roster Management', spell_schools}),
            err => {
                console.log(err);
                res.redirect(baseUrl);
            }
        )
});

router.get('/add-school',
    (req, res) => res.render('admin/spells/add-school', {title: 'Add Spell School - Admin - Frostgrave Roster Management', layout: 'admin/layout'})
);
router.post('/add-school',
    (req, res) => {
        const {name} = req.body;
        db$.mergeMap(db => db.collection('spell_schools').insertOne({name, spells: {}}))
            .subscribe(
                _ => {
                    writeMessage(req, 'School added successfully', 'success');
                    res.redirect(req.baseUrl)
                },
                err => {
                    writeMessage(req, 'Adding school failed: ' + err, 'error');
                    res.redirect(req.baseUrl)
                }
            );
    }
);

router.get('/edit-school/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const spell_school$ = db$.mergeMap(db => db.collection('spell_schools').findOne({_id}))
            .validate(school => !!school, "School Not Found");

        const other_schools$ = db$.mergeMap(db => db.collection('spell_schools').find({_id: {$ne: _id}}).sort({name: 1}).toArray());

        Rx.Observable.zip(spell_school$, other_schools$)
            .subscribe(
                ([school, others]) => {
                    console.log('here subscribe');
                    const other_schools = others.map(({_id, name}) => {
                        const data = {
                            _id,
                            name,
                            allied: (school.allied_schools || []).filter(allied_id => _id.equals(allied_id)),
                            opposed: _id.equals(school.opposed_school)
                        };
                        console.log(data);
                        return data;
                        });
                    res.render(
                        'admin/spells/edit-school',
                        {
                            title:  'Edit Spell School - Admin - Frostgrave Roster Management',
                            layout: 'admin/layout',
                                    school,
                                    other_schools,
                        }
                    )
                },
                err => err => {
                    writeMessage(req, 'Editing school failed: ' + err, 'error');
                    res.redirect(req.baseUrl)
                }
            )
    }
);
router.post('/edit-school/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const {name, allied_schools, opposed_school} = req.body;
        console.log(name, allied_schools, opposed_school, req.body);

        db$.mergeMap(db =>
            db.collection('spell_schools').updateOne(
                {_id},
                {$set: {
                    name,
                    allied_schools,
                    opposed_school
                }}
            ))
            .validate(({result: {n}}) => n == 1, "Failed to find matching spell school")
            .validate(({result: {nModified}}) => nModified == 1, "No change detected")
            .subscribe(
                _ => {
                    writeMessage(req, 'School edited successfully', 'success');
                    res.redirect(req.baseUrl);
                },
                err => {
                    writeMessage(req, 'Editing school failed: ' + err, 'error');
                    res.redirect(req.baseUrl);
                }
            );
    }
);

router.get('/delete-school/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('spell_schools').findOne({_id}))
            .validate(school => !!school, "School Not Found")
            .subscribe(
                school => res.render('admin/spells/delete-school', {title: 'Delete Spell School - Admin - Frostgrave Roster Management', layout: 'admin/layout', school}),
                err => err => {
                    writeMessage(req, 'Deleting school failed: ' + err, 'error');
                    res.redirect(req.baseUrl)
                }
            )
    }
);
router.post('/delete-school/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('spell_schools').removeOne({_id}))
            .validate(({result: {n}}) => n == 1, "Failed to find matching spell school")
            .subscribe(
                _ => {
                    writeMessage(req, 'School deleted successfully', 'success');
                    res.redirect(req.baseUrl);
                },
                err => {
                    writeMessage(req, 'Deleting school failed: ' + err, 'error');
                    res.redirect(req.baseUrl);
                }
            );
    }
);

const spellTypes = [
    'Out of Game',
    'Self Only',
    'Line of Sight',
    'Area Effect',
    'Touch'
];

router.get('/add-spell/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        db$.mergeMap(db => db.collection('spell_schools').findOne({_id}))
            .validate(school => !!school, "School Not Found")
            .subscribe(
                school => res.render('admin/spells/add-spell', {
                    title:  'Add ' + school.name + ' Spell - Admin - Frostgrave Roster Management',
                    layout: 'admin/layout',
                            school,
                    types:  spellTypes.map(name => ({name, checked: false}))
                }),
                err => err => {
                    writeMessage(req, 'Adding spell failed: ' + err, 'error');
                    res.redirect(req.baseUrl)
                }
            )
    }
);

router.post('/add-spell/:id',
    (req, res) => {
        const {id} = req.params;
        const _id = ObjectId(id);

        const _spell_id = new ObjectId();

        const {name, types, description, base_cost} = req.body;

        db$.mergeMap(db =>
            db.collection('spell_schools').updateOne(
                {_id},
                {
                    $set: {
                        ['spells.' + _spell_id]: {
                            name,
                            types: types || [],
                            description,
                            base_cost
                        }
                    }
                }
            ))
            .validate(({result: {n}}) => n == 1, "Failed to find matching spell school")
            .validate(({result: {nModified}}) => nModified == 1, "No change detected")
            .subscribe(
                _ => {
                    writeMessage(req, 'Spell added successfully', 'success');
                    res.redirect(req.baseUrl);
                },
                err => {
                    writeMessage(req, 'Adding spell failed: ' + err, 'error');
                    res.redirect(req.baseUrl);
                }
            );
    }
);

router.get('/edit-spell/:id/:spell_id',
    (req, res) => {
        const {id, spell_id} = req.params;
        const _id = ObjectId(id);

        const _spell_id = new ObjectId(spell_id);

        db$.mergeMap(db => db.collection('spell_schools').findOne({_id}))
            .validate(school => !!school && !!school.spells[_spell_id], "School/Spell Not Found")
            .subscribe(
                school => {
                    const spell = school.spells[_spell_id];
                    res.render('admin/spells/edit-spell', {
                        title:  'Edit ' + spell.name + ' Spell - Admin - Frostgrave Roster Management',
                        layout: 'admin/layout',
                                school,
                                spell,
                                _spell_id,
                        types:  spellTypes.map(name => ({name, checked: (spell.types || []).includes(name)}))
                    });
                },
                err => err => {
                    writeMessage(req, 'Editing spell failed: ' + err, 'error');
                    res.redirect(req.baseUrl)
                }
            )
    }
);

router.post('/edit-spell/:id/:spell_id',
    (req, res) => {
        const {id, spell_id} = req.params;
        const _id = ObjectId(id);

        const _spell_id = new ObjectId(spell_id);

        const {name, types, description, base_cost} = req.body;

        db$.mergeMap(db =>
            db.collection('spell_schools').updateOne(
                {_id},
                {
                    $set: {
                        ['spells.' + _spell_id]: {
                            name,
                            types,
                            description,
                            base_cost
                        }
                    }
                }
            ))
            .validate(({result: {n}}) => n == 1, "Failed to find matching spell school")
            .validate(({result: {nModified}}) => nModified == 1, "No change detected")
            .subscribe(
                _ => {
                    writeMessage(req, 'Spell edited successfully', 'success');
                    res.redirect(req.baseUrl);
                },
                err => {
                    writeMessage(req, 'Editing spell failed: ' + err, 'error');
                    res.redirect(req.baseUrl);
                }
            );
    }
);

router.get('/delete-spell/:id/:spell_id',
    (req, res) => {
        const {id, spell_id} = req.params;
        const _id = ObjectId(id);
        const _spell_id = new ObjectId(spell_id);

        db$.mergeMap(db => db.collection('spell_schools').findOne({_id}))
            .validate(school => !!school && !!school.spells[_spell_id], "School/Spell Not Found")
            .subscribe(
                school => {
                    const spell = school.spells[_spell_id];
                    res.render('admin/spells/delete-spell', {
                        title:  'Delete ' + spell.name + ' Spell - Admin - Frostgrave Roster Management',
                        layout: 'admin/layout',
                                school,
                                spell,
                                _spell_id,
                    });
                },
                err => err => {
                    writeMessage(req, 'Deleting spell failed: ' + err, 'error');
                    res.redirect(req.baseUrl)
                }
            )
    }
);

router.post('/delete-spell/:id/:spell_id',
    (req, res) => {
        const {id, spell_id} = req.params;
        const _id = ObjectId(id);

        const _spell_id = new ObjectId(spell_id);

        db$.mergeMap(db =>
            db.collection('spell_schools').updateOne(
                {_id},
                {
                    $unset: {
                        ['spells.' + _spell_id]: 1
                    }
                }
            ))
            .validate(({result: {n}}) => n == 1, "Failed to find matching spell school")
            .validate(({result: {nModified}}) => nModified == 1, "No change detected")
            .subscribe(
                _ => {
                    writeMessage(req, 'Spell deleted successfully', 'success');
                    res.redirect(req.baseUrl);
                },
                err => {
                    writeMessage(req, 'Deleting spell failed: ' + err, 'error');
                    res.redirect(req.baseUrl);
                }
            );
    }
);

module.exports = router;