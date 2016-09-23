module.exports = (obs) => obs.prototype.validate = function (predicate, error) {
    return this.mergeMap(arg => predicate(arg) ? obs.of(arg) : obs.throw(error));
};