const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
	if(req.user)
	{
		return res.json(req.user);
	}
	res.render('index', { title: 'Frostgrave Roster Management' })
});

module.exports = router;
