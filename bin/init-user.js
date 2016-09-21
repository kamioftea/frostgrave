const prompt = require('prompt');
const Rx = require('rxjs');
const bcrypt = require('bcryptjs');

Rx.Observable.prototype.validate = function (predicate, error) {
    var source = this;
    const [passed, failed] = source.partition(predicate);
    return Rx.Observable.merge(passed, failed.mergeMap(_ => Rx.Observable.throw(error)))
};

Rx.Observable.prototype.mergeMapPersist = function (mapper, ...args) {
    var source = this;
    return source.mergeMap(
        (data, ...args) => Rx.Observable.from(mapper(data, ...args)).map(result => [...data, result]),
        ...args
    );
};

const {db$, closeDb} = require('../db-conn.js');

const promptSchema = {
    properties: {
        name:           {
            required:    true,
            description: 'Full name',
        },
        email:          {
            required:    true,
            description: 'Email',
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
        },
        roles:          {
            default:     'Admin',
            description: 'User Roles(comma separated)',
            before:      roles => roles.split(',').map(s => s.trim())
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
const promptGet = Rx.Observable.bindNodeCallback(prompt.get);
const bcryptHash = Rx.Observable.bindNodeCallback(bcrypt.hash);

const [withUser, noUser] = promptGet(promptSchema)
    .validate(({password, password_check}) => password === password_check, "Passwords must match")
    .withLatestFrom(db$)
    .mergeMapPersist(([{email}, db]) => db.collection('users').findOne({email: email}))
    .partition(([,,user]) => user !== null);

replaceExistingSchema = {
    properties: {
        update: {
            description: 'Existing User Found, Update?',
            default:     'N',
            pattern:     /^(y|n|yes|no)$/i,
            before:      s => /^(y|yes)$/i.test(s)
        }
    }
};

Rx.Observable
    .merge(
        withUser
            .mergeMapPersist((_) => promptGet(replaceExistingSchema))
            .validate(([,,,{update}]) => update, "Operation cancelled")
            .mergeMapPersist(([{password}]) => bcryptHash(password, 14))
            .mergeMap(([{name, email, roles}, db, user, ,hash]) =>
                db.collection('users').updateOne(
                    {_id: user._id},
                    {
                        $set: {
                            name,
                            email,
                            password: hash,
                            roles
                        }
                    }
                )
            ),
        noUser
            .mergeMapPersist(([{password}]) => bcryptHash(password, 14))
            .mergeMap(([{name, email, roles}, db, ,hash]) =>
                db.collection('users').insertOne({
                    name,
                    email,
                    password: hash,
                    roles
                })
            )
    )
    .map(res => res.result)
    .first()
    .subscribe(
        result => console.log('Success', result),
        err => {
            console.error('Error:', err);
            process.exit()
        },
        closeDb
    );
