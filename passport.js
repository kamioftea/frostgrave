const {bindNodeCallback, of} = require('rxjs');
const {Strategy: LocalStrategy} = require('passport-local');
const {db$} = require('./db-conn.js');
const {map, mergeMap} = require('rxjs/operators')
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');

const bcryptCompare = bindNodeCallback(bcrypt.compare);

const passport = require('passport');

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    (username, password, cb) => {
        db$.pipe(
            mergeMap(db => db.collection('users').findOne({email: username})),
            mergeMap(
                user =>
                    (user ? bcryptCompare(password, user.password) : of(false)).pipe(
                        map(result => result ? user : false)
                        )

            )
            )
            .subscribe(
                user => cb(null, user),
                err => cb(err)
            );
    }
));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => {
    return cb(null, user._id)
});

passport.deserializeUser(
    (id, cb) => db$.pipe(
        mergeMap(db => db.collection('users').findOne({_id: ObjectID(id)}))
        )
        .subscribe(
            user => cb(null, Object.assign({}, user, {password: !!user.password})),
            err => cb(err)
        )
);

module.exports = passport;
