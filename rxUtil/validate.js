module.exports = (obs) => obs.prototype.validate = function (predicate, error) {
    var source = this;
    const [passed, failed] = source.partition(predicate);
    return obs.merge(passed, failed.mergeMap(_ => obs.throw(error)))
};