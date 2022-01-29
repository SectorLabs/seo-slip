const assert = require('assert');
const { maxPageCountChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('maxPageCountChecker', function () {
    [
        [0, 10, true, []],
        [1, 10, true, []],
        [10, 10, true, []],
        [11, 10, false, [/limit.+10.+exceeded/i]],
        [100, 10, false, [/limit.+10.+exceeded/i]],
    ].forEach(([itemCount, maxPageCount, passed, messagePatterns]) => {
        it(`should check when itemCount=${itemCount} and maxPageCount=${maxPageCount}`, async function () {
            const itemData = buildItemData();
            const itemsData = Array(itemCount).fill(itemData);

            const { results, finalResult } = await run(
                maxPageCountChecker(maxPageCount),
                itemsData
            );

            assert.equal(results.length, Math.min(itemCount, maxPageCount));

            assert.equal(finalResult.passed, passed);
            messagePatterns.forEach((messagePattern, index) => {
                assert.match(finalResult.messages[index], messagePattern);
            });
        });
    });
});
