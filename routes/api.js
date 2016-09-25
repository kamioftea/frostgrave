const express = require('express');
const router = express.Router();
const {db$} = require('../db-conn.js');
const Rx = require('rxjs');
const {authenticated} = require('../authenticateRequest');

router.use(authenticated());

router.get('/data',
    (req, res) => {
        const spellSchools$ = db$.mergeMap(db => db.collection('spell_schools').find().sort({name: 1}).toArray());
        const event$ = db$.mergeMap(db => db.collection('events').find().sort({name: 1}).toArray());

        Rx.Observable.zip(spellSchools$, event$)
            .subscribe(
                ([spell_schools, events]) => res.json({
                    spell_schools,
                    events,
                    user: req.user,
                }),
                error => res.json({error: error.message})
            )
    }
);

module.exports = router;
