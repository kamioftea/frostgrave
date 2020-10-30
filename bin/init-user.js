const {mergeMapPersist} = require('../rxUtil/mergeMapPersist.js');
const {validate} = require('../rxUtil/validate.js');

const prompt = require('prompt');
const {partition, bindNodeCallback, merge, from} = require('rxjs');
const {withLatestFrom, mergeMap, map, first} = require('rxjs/operators');
const bcrypt = require('bcryptjs');

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
const promptGet = bindNodeCallback(prompt.get);
const bcryptHash = bindNodeCallback(bcrypt.hash);

const [withUser, noUser] =
    partition(
        promptGet(promptSchema)
            .pipe(
                validate(({password, password_check}) => password === password_check, "Passwords must match"),
                withLatestFrom(db$),
                mergeMapPersist(([{email}, db]) => from(db.collection('users').findOne({email: email})))
            ),
        ([, , user]) => user !== null
    );

const replaceExistingSchema = {
    properties: {
        update: {
            description: 'Existing User Found, Update?',
            default:     'N',
            pattern:     /^(y|n|yes|no)$/i,
            before:      s => /^(y|yes)$/i.test(s)
        }
    }
};

merge(
    withUser.pipe(
        mergeMapPersist((_) => promptGet(replaceExistingSchema)),
        validate(([, , , {update}]) => update, "Operation cancelled"),
        mergeMapPersist(([{password}]) => bcryptHash(password, 14)),
        mergeMap(([{name, email, roles}, db, user, , hash]) =>
            db.collection('users').updateOne(
                {_id: user._id},
                {
                    $set:   {
                        name,
                        email,
                        password: hash,
                        roles
                    },
                    $unset: {
                        access_key: 1
                    }
                }
            )
        )
    ),
    noUser.pipe(
        mergeMapPersist(([{password}]) => bcryptHash(password, 14)),
        mergeMap(([{name, email, roles}, db, , hash]) =>
            db.collection('users').insertOne({
                name,
                email,
                password: hash,
                roles
            })
        )
    )
).pipe(
    map(res => res.result),
    first(),
    )
    .subscribe(
        result => {
            console.log('Success', result);
            closeDb()
        },
        err => {
            console.error('Error:', err);
            closeDb()
            process.exit()
        },
    );
