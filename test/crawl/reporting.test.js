const assert = require('assert');
const { canonicalChecker, statusCodeChecker } = require('../../src/checkers');

const { buildItemData, run, assertMessages } = require('..');

describe('canonicalChecker', () => {
    it.only('should properly report the messages', async () => {
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

        assert.equal(results.passed, false);
        assertMessages(results, [/expected.+actual.+/i, /expected.+200.+actual.+201/i]);
    });
});
