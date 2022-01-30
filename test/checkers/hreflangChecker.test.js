const assert = require('assert');
const { hreflangChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('hreflangChecker', () => {
    const rules = [
        {
            url: /^(.+site\.com)(\/)?(\?.*)?$/,
            expected: {
                en: '($1)($2)($3)',
            },
        },
        {
            url: /^(.+\.site\.com)\/(..)\/search\/(.+)(\?.+)$/,
            expected: {
                en: '($1)/en/search/($3)($4)',
                ar: '($1)/ar/search/($3)($4)',
                ro: '($1)/ro/search/($3)($4)',
            },
        },
        {
            url: /^(.+\.site\.com)\/(..)\/search\/(.+)$/,
            expected: {
                en: '($1)/en/search/($3)',
                ar: '($1)/ar/search/($3)',
                ro: '($1)/ro/search/($3)',
            },
        },
    ];

    [
        [
            'https://www.site.com',
            '<link rel="alternate" hreflang="en" href="https://www.site.com" />',
            true,
            [],
        ],
        [
            'http://w.site.com',
            '<link rel="alternate" hreflang="en" href="http://w.site.com" />',
            true,
            [],
        ],
        ['https://www.site.com', '', false, [/lang.+en.+expected.+actual.+/i]],
        [
            'https://www.site.com',
            '<link rel="alternate" hreflang="en" href="https://www.site.com" />' +
                '<link rel="alternate" hreflang="xx" href="https://www.site.com" />',
            true,
            [],
        ],
        [
            'https://www.site.com',
            '<link rel="alternate" hreflang="en" href="https://www.site.com/en" />' +
                '<link rel="alternate" hreflang="xx" href="https://www.site.com" />',
            false,
            [/lang.+en.+expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<link rel="alternate" hreflang="en" href="https://www.site.com/en/search/query-string/?a=1" />' +
                '<link rel="alternate" hreflang="ar" href="https://www.site.com/ar/search/query-string/?a=1" />' +
                '<link rel="alternate" hreflang="ro" href="https://www.site.com/ro/search/query-string/?a=1" />',
            true,
            [],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<link rel="alternate" hreflang="en" href="https://www.site.com/en/search/query-string/?a=1" />' +
                '<link rel="alternate" hreflang="ar" href="https://www.site.com/ar/search/query-string/?a=1" />' +
                '<link rel="alternate" hreflang="ro" href="https://www.site.com/ro/search/query-string/?a=1" />' +
                '<link rel="alternate" hreflang="xx" href="https://www.site.com/xx/search/query-string/?a=1" />',
            true,
            [],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<link rel="alternate" hreflang="en" href="https://www.site.com/en/search/query-string/?a=1" />',
            false,
            [/lang.+ar.+expected.+actual.+/i, /lang.+ro.+expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<link rel="alternate" hreflang="en" href="https://www.site.com/en/search/query-string/?b=2" />' +
                '<link rel="alternate" hreflang="ar" href="https://www.site.com/ar/search/query-string/?b=2" />' +
                '<link rel="alternate" hreflang="ro" href="https://www.site.com/ro/search/query-string/?b=2" />',
            false,
            [
                /lang.+en.+expected.+actual.+/i,
                /lang.+ar.+expected.+actual.+/i,
                /lang.+ro.+expected.+actual.+/i,
            ],
        ],
    ].forEach(([url, fragment, passed, messagePatterns]) => {
        it(`should check the rules for ${url} and ${fragment}`, async () => {
            const content = `<html>${fragment}</html>`;

            const itemData = buildItemData({ url, content });

            const {
                results: [result],
            } = await run(hreflangChecker(rules), [itemData]);

            assert.equal(result.passed, passed);
            messagePatterns.forEach((messagePattern, index) => {
                assert.match(result.messages[index], messagePattern);
            });
        });
    });

    it('should ignore a response without a proper html content type header', async () => {
        const url = 'https://www.site.com';
        const content = '<html><h1>Best site for search</h1></html>';
        const headers = { 'content-type': 'text' };

        const itemData = buildItemData({ url, content, headers });

        const {
            results: [result],
        } = await run(hreflangChecker(rules), [itemData]);

        assert.equal(result.passed, true);
    });

    it('should ignore a response without a proper content', async () => {
        const url = 'https://www.site.com';
        const content = [];

        const itemData = buildItemData({ url, content });

        const {
            results: [result],
        } = await run(hreflangChecker(rules), [itemData]);

        assert.equal(result.passed, true);
    });
});
