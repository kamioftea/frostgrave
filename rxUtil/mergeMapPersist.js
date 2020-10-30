const {mergeMap, map} = require('rxjs/operators');

const mergeMapPersist = fn => mergeMap(arr => fn(arr).pipe(map(result => [...(Array.isArray(arr) ? arr : [arr]), result])));

module.exports = {mergeMapPersist}
