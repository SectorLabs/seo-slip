const assert = require('assert');
const { dataSizeChecker } = require('../../src/checkers');

const { assertMessages, assertPassed, buildItemData, run } = require('..');

describe('dataSizeChecker', () => {
    const rules = [
        {
            condition: {
                path: '/exceptional/unrestricted/small/file',
                'content-type': 'text/html',
            },
            maxDataSize: 10,
            maxUncompressedDataSize: 10,
        },
        {
            condition: {
                'content-type': 'text/html',
            },
            minDataSize: 5,
            maxDataSize: 10,
            minUncompressedDataSize: 5,
            maxUncompressedDataSize: 10,
        },
    ];

    const noContentType = {};
    const htmlContentType = { 'content-type': 'text/html' };
    const htmlContent = '<html />';
    const smallHtmlContent = '</>';
    const largeHtmlContent = '<html><head></head><body></body></html>';

    [
        ['path', noContentType, smallHtmlContent, true, []],
        ['path', noContentType, largeHtmlContent, true, []],
        ['path', htmlContentType, htmlContent, true, []],
        [
            'path',
            htmlContentType,
            smallHtmlContent,
            false,
            [/.+minDataSize.+/i, /.+minUncompressedDataSize.+/i],
        ],
        [
            'path',
            htmlContentType,
            largeHtmlContent,
            false,
            [/.+maxDataSize.+/i, /.+maxUncompressedDataSize.+/i],
        ],
        ['/exceptional/unrestricted/small/file', htmlContentType, smallHtmlContent, true, []],
        [
            '/exceptional/unrestricted/small/file',
            htmlContentType,
            largeHtmlContent,
            false,
            [/.+maxDataSize.+/i, /.+maxUncompressedDataSize.+/i],
        ],
    ].forEach(([path, headers, content, passed, messagePatterns]) => {
        it(`should check ${path}, ${headers['content-type']} and ${content}`, async () => {
            const actualDataSize = content.length;
            const uncompressedDataSize = content.length;

            const itemData = buildItemData({
                path,
                headers,
                content,
                stateData: { actualDataSize },
            });

            const {
                report: [itemReport],
                results,
            } = await run([dataSizeChecker(rules)], [itemData]);

            assert.equal(itemReport.__dataSize, actualDataSize);
            assert.equal(itemReport.__uncompressedDataSize, uncompressedDataSize);

            assertPassed(results, passed);
            assertMessages(results, messagePatterns);
        });
    });
});
