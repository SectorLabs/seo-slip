const assert = require('assert');
const { contentChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('contentChecker', () => {
    const rules = [
        {
            url: /^(.+site\.com)(\/)?(\?.*)?$/,
            expected: {
                '//h1/text()': '^Best site for search$',
            },
        },
        {
            url: /^(.+\.site\.com)\/(..)\/search\/(.+)(\?.+)$/,
            expected: {
                '//h1/text()': '^Advanced search page$',
                '//meta[@name="description"]/@content': '^(.|\\n){20,100}$',
            },
        },
        {
            url: /^(.+\.site\.com)\/(..)\/search\/(.+)$/,
            expected: {
                '//h1/text()': '^Basic search page$',
            },
        },
    ];

    [
        ['https://www.site.com', '<h1>Best site for search</h1>', true, []],
        ['https://www.site.com', '<h1>Best</h1>' + '<h1>site for search</h1>', true, []],
        [
            'https://www.site.com',
            '<h1>Best site for search in the entire world</h1>',
            false,
            [/locator.+h1.+expected.+actual.+/i],
        ],
        ['https://www.site.com', '<h1></h1>', false, [/locator.+h1.+expected.+actual.+/i]],
        ['https://www.site.com', '', false, [/locator.+h1.+expected.+actual.+/i]],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<h1>Advanced search page</h1>' +
                '<meta name="description" content="Advanced search page with query in path and attribute" />',
            true,
            [],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<h1>Wrong h1</h1>' + '<meta name="description" content="Short description" />',
            false,
            [/locator.+h1.+expected.+actual.+/i, /locator.+meta.+expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<h1>Advanced search page</h1>',
            false,
            [/locator.+meta.+expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '<meta name="description" content="Advanced search page with query in path and attribute" />',
            false,
            [/locator.+h1.+expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string/?a=1',
            '',
            false,
            [/locator.+h1.+expected.+actual.+/i, /locator.+meta.+expected.+actual.+/i],
        ],
        [
            'https://www.site.com/en/search/query-string',
            '<h1>Basic search page</h1>' +
                '<meta name="description" content="Irrelevant description" />',
            true,
            [],
        ],
    ].forEach(([url, fragment, passed, messagePatterns]) => {
        it(`should check the rules for ${url} and ${fragment}`, async () => {
            const content = `<html>${fragment}</html>`;

            const itemData = buildItemData({ url, content });

            const {
                results: [result],
            } = await run(contentChecker(rules), [itemData]);

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
        } = await run(contentChecker(rules), [itemData]);

        assert.equal(result.passed, true);
    });

    it('should ignore a response without a proper content', async () => {
        const url = 'https://www.site.com';
        const content = [];

        const itemData = buildItemData({ url, content });

        const {
            results: [result],
        } = await run(contentChecker(rules), [itemData]);

        assert.equal(result.passed, true);
    });
});
