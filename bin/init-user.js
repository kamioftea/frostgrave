const prompt = require('prompt');
const {db} = require('../db-conn.js');
const bcrypt = require('bcryptjs');

const promptSchema = {
    properties: {
        name:           {
            required:    false,
            description: 'Full name: ',
        },
        email:          {
            required:    true,
            description: 'Email: ',
        },
        password:       {
            required: true,
            hidden:   true,
            replace:  '*',
        },
        password_check: {
            required: true,
            hidden:   true,
            replace:  '*',
        }
    }
};

prompt.message = null;

//
// Start the prompt
//
prompt.start();

//
// Get two properties from the user: email, password
//
prompt.get(promptSchema, function (err, result) {
    if (err) {
        return console.error(err);
    }

    const {name, email, password, password_check} = result;

    if (password !== password_check) {
        return console.error("Passwords must match");
    }

    return db()
        .then(
            db => db.collection('users').insertOne({
                name,
                email,
                password: bcrypt.hashSync(password, 10)
            }, (err, res) => {
                err ? console.error(err) : console.info(res.result);
                db.close();
            }),
            err => console.error(err)
        )
});