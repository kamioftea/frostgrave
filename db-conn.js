const { MongoClient }  = require('mongodb');
const Rx = require('rxjs');
const {tap} = require('rxjs/operators');

const db$ = new Rx.AsyncSubject();
let cachedClient = null;

MongoClient
    .connect('mongodb://localhost:27017')
    .then(client => {
        cachedClient = client;
        return client.db('frostgrave')
    })
    .then(
        db => { db$.next(db); db$.complete() },
        err => { db$.error(err); db$.complete() }
    );


module.exports = {
    db$,
    closeDb() {
        cachedClient ? cachedClient.close() : null;
        db$.complete();
    }
};
