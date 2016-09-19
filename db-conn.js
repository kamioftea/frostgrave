const { MongoClient }  = require('mongodb');

const collection = name =>
	MongoClient
		.connect('mongodb://localhost:27017/frostgrave')
		.then(db => db.collection(name));

module.exports = {
	collection
};
