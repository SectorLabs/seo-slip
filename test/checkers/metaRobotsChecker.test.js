const assert = require('assert');
const { metaRobotsChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('metaRobotsChecker', function () {
    const rules = [
        {
            path: /^(.+site\.com)(\/)?(\?.*)?$/,
            index: true,
            follow: true,
        },
        {
            path: /^(.+\.site\.com)\/(..)\/search\/(.+)(\?.+)$/,
            index: false,
            follow: true,
        },
    ];

    [
        ['https://www.site.com', '', true, []],
        [
            'https://www.site.com',
            '<meta name="robots" content="index,follow" />',
            true,
            [],
        ],
        [
            'https://www.site.com',
            '<meta name="robots" content=" follow , index " />',
            true,
            [],
        ],
        [
            'https://www.site.com',
            '<meta name="robots" content="follow" />',
            true,
            [],
        ],
        [
            'https://www.site.com',
            '<meta name="robots" content="noindex,nofollow" />',
            false,
            [
                /expected.+index.+true.+actual.+false/i,
                /expected.+follow.+true.+actual.+false/i,
            ],
        ],

        [
            'https://www.site.com/en/search/query-search/?a=1',
            '<meta name="robots" content="noindex,follow" />',
            true,
            [],
        ],
        [
            'https://www.site.com/en/search/query-search/?a=1',
            '<meta name="robots" content="index,nofollow" />',
            false,
            [
                /expected.+index.+false.+actual.+true/i,
                /expected.+follow.+true.+actual.+false/i,
            ],
        ],
        [
            'https://www.site.com/en/search/query-search/?a=1',
            '<meta name="robots" content=" index , nofollow" />',
            false,
            [
                /expected.+index.+false.+actual.+true/i,
                /expected.+follow.+true.+actual.+false/i,
            ],
        ],
        [
            'https://www.site.com/en/search/query-search/?a=1',
            '<meta name="robots" content="nofollow" />',
            false,
            [
                /expected.+index.+false.+actual.+true/i,
                /expected.+follow.+true.+actual.+false/i,
            ],
        ],
    ].forEach(([url, fragment, passed, messagePatterns]) => {
        it(`should check the rules for ${url} and ${fragment}`, async function () {
            const content = `<html>${fragment}</html>`;

            const itemData = buildItemData({ url, content });

            const {
                results: [result],
            } = await run(metaRobotsChecker(rules), [itemData]);

            assert.equal(result.passed, passed);
            messagePatterns.forEach((messagePattern, index) => {
                assert.match(result.messages[index], messagePattern);
            });
        });
    });

    it('should ignore a response without a proper html content type header', async function () {
        const url = 'https://www.site.com';
        const content = '<meta name="robots" content="noindex,nofollow" />';
        const headers = { 'content-type': 'text' };

        const itemData = buildItemData({ url, content, headers });

        const {
            results: [result],
        } = await run(metaRobotsChecker(rules), [itemData]);

        assert.equal(result.passed, true);
    });

    it('should ignore a response without a proper content', async function () {
        const url = 'https://www.site.com';
        const content = [];

        const itemData = buildItemData({ url, content });

        const {
            results: [result],
        } = await run(metaRobotsChecker(rules), [itemData]);

        assert.equal(result.passed, true);
    });
});
