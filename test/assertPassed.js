const assert = require('assert');

const assertPassed = (results, passed) => {
    assert.equal(results.passed, passed);
};

module.exports = assertPassed;
