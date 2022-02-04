const assert = require('assert');
const { canonicalChecker, statusCodeChecker } = require('../../src/checkers');
const { newMessage, printResults } = require('../../src/reporting');

const { assertMessages, assertResults, buildItemData, run } = require('..');

describe('reporting', () => {
    it('should properly report the messages', async () => {
        const url = 'https://www.site.com/';
        const path = '/';
        const canonicalUrl = 'https://www.site.com/?a=1';
        const code = 201;
        const canonicalRules = [
            {
                url: /^(.+site\.com)(\/)?(\?.*)?$/,
                expected: '($1)',
            },
        ];
        const statusCodeRules = { code: 200, exceptions: {} };
        const content =
            '<html><head>' +
            `<link rel="canonical" href="${canonicalUrl}">` +
            '</head><body></body></html>';

        const itemData = buildItemData({ code, content, path, url });

        const {
            report: [itemReport],
            results,
        } = await run(
            [canonicalChecker(canonicalRules), statusCodeChecker(statusCodeRules)],
            [itemData]
        );

        assert.equal(itemReport.canonicalUrl, canonicalUrl);
        assert.equal(itemReport.path, path);
        assert.equal(itemReport.code, code);

        const expectedResults = {
            passed: false,
            messages: [
                newMessage(/.+/, /canonicalChecker/, /expected.+actual.+/i),
                newMessage(/.+/, /statusCodeChecker/, /expected.+200.+actual.+201/i),
            ],
        };
        assertResults(results, expectedResults);

        const expectedMessages = [].concat.apply(
            [],
            expectedResults.messages.map((message) => message.text)
        );
        assertMessages(results, [].concat.apply([], expectedMessages));

        const humanFriendlyResults = printResults(results);
        assert.match(humanFriendlyResults, /canonicalChecker/i);
        assert.match(humanFriendlyResults, /statusCodeChecker/i);
        assert.match(humanFriendlyResults, /2 message\(s\) for 1 URL\(s\)/i);
    });
});
