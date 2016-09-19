const { MongoClient, ObjectID }  = require('mongodb');

const db = () =>
	MongoClient.connect('mongodb://localhost:27017/frostgrave')

module.exports = {
	db
};
