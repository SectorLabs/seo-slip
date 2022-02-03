const assert = require('assert');

const assertMessages = (results, messagePatterns) => {
    messagePatterns.forEach((messagePattern, index) => {
        assert.match(results.messages[index], messagePattern);
    });
    assert.equal(results.messages.length, messagePatterns.length);
};

module.exports = assertMessages;
