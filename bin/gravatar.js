const prompt = require('prompt');
const md5 = require('js-md5');

const promptSchema = {
    properties: {
        email: {
            required:    true,
            description: 'Email',
        },
    }
};

prompt.message = null;

//
// Start the prompt
//
prompt.start();

prompt.get(promptSchema, (err, result) => {
    if(err) return console.error(err);
    
    console.log('https://www.gravatar.com/avatar/' + md5(result.email))
});
