const passport = require('passport');
const {Strategy: LocalStrategy} = require('passport-local');
const { collection } = require('./db-conn.js');
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
	(username, password, cb) =>
{
	console.log(username, password);
	collection('users')
			.then(
				users => users
				.findOne({email: username})
				.then(
					user => {
						console.log(user)
						if (!user) {
							return cb(null, false)
						}
						bcrypt.compare(password, user.password, (err, res) => {
							if (err) {
								console.log(err);
								return cb(err);
							}
							console.log(res);
							return cb(null, res ? user : false)
						})
					},
					err => {console.log(err); return cb(err)}
				),
				err => {console.log(err); return cb(err)}
			)}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser((id, cb) =>
	collection('users').then(
		users => user.findOne({_id: id}).then(
			user => cb(null, user),
			err => cb(err)
		),
		err => cb(err)
	)
);

module.exports = passport;
