const objectEntries = (obj) => {
    let index = 0;

    // In ES6, you can use strings or symbols as property keys,
    // Reflect.ownKeys() retrieves both
    let propKeys = Reflect.ownKeys(obj);

    return {
        [Symbol.iterator]() {
            return this;
        },
        next() {
            if (index < propKeys.length) {
                let key = propKeys[index];
                index++;
                return {value: [key, obj[key]], done: false};
            }
            else {
                return {done: true};
            }
        }
    };
};


const forAll = (pred) => (obj) => {
    for (const [key, value] of objectEntries(obj)) {
        if (!pred(key, value)) {
            return false
        }
    }

    return true;
};

module.exports = {
    objectEntries,
    forAll
};