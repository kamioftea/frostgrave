const {of, throwError} = require('rxjs');
const {mergeMap} = require('rxjs/operators');

const validate = (predicate, error) => mergeMap(arg => predicate(arg) ? of(arg) :throwError(error));

module.exports = {validate}
