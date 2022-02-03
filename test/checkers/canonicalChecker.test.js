const assert = require('assert');
const { canonicalChecker } = require('../../src/checkers');

const { assertMessages, assertPassed, buildItemData, run } = require('..');

describe('canonicalChecker', () => {
    const rules = [
        {
            url: /^(.+site\.com)(\/)?(\?.*)?$/,
            expected: '($1)',
        },
        {
            url: /^(.+\.site\.com)\/(..)\/search\/(.+)(\?.+)$/,
            expected: '($1)/($2)/search/($3)',
        },
        {
            url: /^(.+\.site\.com)\/(..)\/search\/(.+)$/,
            expected: '($1)/($2)/search/($3)',
        },
        {
            url: /(.*.site\.com)\/(..)\/product-(\d+)(\?.+)/,
            expected: '($1)/($2)/product-($3)',
        },
        {
            url: /(.*.site\.com)\/(..)\/product-(\d+)/,
            expected: '($1)/($2)/product-($3)',
        },
    ];

    [
        ['https://www.site.com', 'https://www.site.com', true, []],
        ['https://www.site.com/', 'https://www.site.com', true, []],
        ['http://www.site.com', 'http://www.site.com', true, []],
        ['https://www.site.com?', 'https://www.site.com', true, []],
        ['https://www.site.com?a=1', 'https://www.site.com', true, []],
        ['https://www.site.com', 'https://www.site.com/', false, [/expected.+actual.+/i]],
        [
            'https://www.site.com/en/search/query-string?a=1',
            'https://www.site.com/en/search/query-string',
            true,
            [],
        ],
        [
            'https://www.site.com/en/search/query-string?a=2',
            'https://www.site.com/en/search/query-string?a=2',
            false,
            [/expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string',
            'https://www.site.com/en/search/query-string',
            true,
            [],
        ],
        [
            'https://www.site.com/en/product-1234?a=1',
            'https://www.site.com/en/product-1234',
            true,
            [],
        ],
        [
            'https://www.site.com/en/product-1234?a=2',
            'https://www.site.com/en/product-1234?a=2',
            false,
            [/expected.+actual.+/i],
        ],
        ['https://www.site.com/en/product-1234', 'https://www.site.com/en/product-1234', true, []],
    ].forEach(([url, canonicalUrl, passed, messagePatterns]) => {
        it(`should check the ${canonicalUrl} canonical url of ${url}`, async () => {
            const content =
                `<html><head>` +
                `<link rel="canonical" href="${canonicalUrl}">` +
                `</head><body></body></html>`;

            const itemData = buildItemData({ url, content });

            const {
                report: [itemReport],
                results,
            } = await run([canonicalChecker(rules)], [itemData]);

            assert.equal(itemReport.canonicalUrl, canonicalUrl);
            assertPassed(results, passed);
            assertMessages(results, messagePatterns);
        });
    });

    it('should fail a response without a canonical link', async () => {
        const url = 'https://www.site.com';
        const content = `<html><head>` + `<link href="${url}">` + `</head><body></body></html>`;

        const itemData = buildItemData({ url, content });

        const {
            report: [itemReport],
            results,
        } = await run([canonicalChecker(rules)], [itemData]);

        assert.equal(itemReport.canonicalUrl, '');
        assertPassed(results, false);
        assertMessages(results, [/expected.+actual.+/i]);
    });

    it('should ignore a response without a proper html content type header', async () => {
        const url = 'https://www.site.com';
        const content =
            `<html><head>` + `<link rel="canonical" href="${url}">` + `</head><body></body></html>`;
        const headers = { 'content-type': 'text' };

        const itemData = buildItemData({ url, content, headers });

        const {
            report: [itemReport],
            results,
        } = await run([canonicalChecker(rules)], [itemData]);

        assert.equal(itemReport.canonicalUrl, '');
        assertPassed(results, true);
    });

    it('should ignore a response without a proper content', async () => {
        const url = 'https://www.site.com';
        const content = [];

        const itemData = buildItemData({ url, content });

        const {
            report: [itemReport],
            results,
        } = await run([canonicalChecker(rules)], [itemData]);

        assert.equal(itemReport.canonicalUrl, '');
        assertPassed(results, true);
    });
});
