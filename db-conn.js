const { MongoClient }  = require('mongodb');
const Rx = require('rxjs');

const db$ = new Rx.AsyncSubject();

MongoClient
    .connect('mongodb://localhost:27017/frostgrave')
    .then(
        db => { db$.next(db); db$.complete() },
        err => { db$.error(err); db$.complete() }
    );


module.exports = {
    db$,
    closeDb() {
        db$.forEach(db => db.close());
        db$.complete();
    }
};
