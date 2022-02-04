const assert = require('assert');

const assertMessages = (results, messagePatterns) => {
    const messages = [].concat.apply(
        [],
        results.messages.map((message) => message.text)
    );
    messagePatterns.forEach((messagePattern, index) => {
        assert.match(messages[index], messagePattern);
    });
    assert.equal(messages.length, messagePatterns.length);
};

module.exports = assertMessages;
