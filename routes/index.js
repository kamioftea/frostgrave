const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
	if(req.user)
	{
		console.log(user);
	}
	res.render('index', { title: 'Frostgrave Roster Management' })
});

module.exports = router;
