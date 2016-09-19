const express = require('express');
const router = express.Router();
const { collection } = require('../db-conn.js');
const bcrypt = require('bcryptjs');



module.exports = (passport) => {
	router.get('/access-key/:access_key', (req, res, next) => {
			const {access_key} = req.params;

			collection('users')
				.then(users =>
					users
						.findOne({access_key})
						.then(
							user => user
								? res.render('user/access-key', { title: 'Frostgrave Roster Management - Access Key', user, access_key})
								: res.render('user/access-denied', { title: 'Frostgrave Roster Management - Access Key', access_key}),
							err => res.redirect('/')
						)
				)
		}
	);

	router.post('/access-key/:access_key',
		(req, res, next) => {
			if (!req.body) return res.sendStatus(400);

			const {access_key} = req.params;
			const {password, password_check} = req.body;

			collection('users')
				.then(
					users => users
						.findOne({access_key})
						.then(
							user => {
								if(!user){
									return res.render('user/access-denied', { title: 'Frostgrave Roster Management - Access Key', access_key})
								}

								if(!password)
								{
									return res.render('user/access-key', { title: 'Frostgrave Roster Management - Access Key', user, access_key, message: "Password can't be empty"})
								}

								if(password != password_check)
								{
									return res.render('user/access-key', { title: 'Frostgrave Roster Management - Access Key', user, access_key, message: "Passwords must match"})
								}

								bcrypt.hash(password, 14, (err, hash) => {
									if(err) {
										return (res.render('user/access-key', { title: 'Frostgrave Roster Management - Access Key', user, access_key, message: "Failed to generate password: " + err.message}))
									}

									users.updateOne(
										{_id: user._id},
										{
											$set: {password: hash},
											$unset: {access_key: 1}
										},
										res.redirect("/")
									)
								})
							}
						),
					err => err => res.redirect('/')
				)
		}
	);

	router.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/' }));

	return router;
}
