const passport = require('passport');
const {Strategy: LocalStrategy} = require('passport-local');
const {db} = require('./db-conn.js');
const { ObjectID }  = require('mongodb');
const bcrypt = require('bcryptjs');

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
        db().then(
            db => db.collection('users')
                .findOne({email: username})
                .then(
                    user => {
                        console.log(user);
                        if (!user) {
                            db.close();
                            return cb(null, false)
                        }
                        bcrypt.compare(password, user.password, (err, res) => {
                            db.close();
                            if (err) {
                                return cb(err);
                            }
                            console.log("bcrypt:");
                            console.log(res);
                            return cb(null, res ? user : false)
                        })
                    },
                    err => {
                        db.close();
                        return cb(err)
                    }
                ),
            err => {
                return cb(err)
            }
        )
    }));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => {
    console.log('serializeUser');
    console.log(user);
    return cb(null, user._id)
});

passport.deserializeUser((id, cb) => {
        console.log('unserializeUser');
        console.log(id);
        return db().then(
            db => db.collection('users')
                .findOne({_id: ObjectID(id)})
                .then(
                    user => {
                        console.log(user);
                        db.close();
                        cb(null, user)
                    },
                    err => {
                        db.close();
                        cb(err)
                    }
                ),
            err => {
                cb(err)
            }
        )
    }
);

module.exports = passport;
