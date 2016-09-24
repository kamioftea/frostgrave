module.exports = (obs) => obs.prototype.mergeMapPersist = function (mapper, ...args) {
    var source = this;
    return source.mergeMap(
        (rawData, ...args) =>
            obs
                .from(mapper(rawData, ...args))
                .map(result => [...(Array.isArray(rawData) ? rawData : [rawData]), result])
        ,
        ...args
    );
};