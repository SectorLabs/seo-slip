const assert = require('assert');

const assertResults = (results, expectedResults) => {
    assert.equal(results.passed, expectedResults.passed);
    expectedResults.messages.forEach((message, index) => {
        assert.match(results.messages[index].url, message.url);
        assert.match(results.messages[index].source, message.source);
        assert.match(results.messages[index].text, message.text);
    });
    assert.equal(results.messages.length, expectedResults.messages.length);
};

module.exports = assertResults;
