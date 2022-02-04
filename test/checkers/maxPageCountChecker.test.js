const assert = require('assert');
const { maxPageCountChecker } = require('../../src/checkers');

const { assertMessages, assertPassed, buildItemData, run } = require('..');

describe('maxPageCountChecker', () => {
    [
        [0, 10, true, []],
        [1, 10, true, []],
        [10, 10, true, []],
        [11, 10, false, [/limit.+10.+exceeded/i]],
        [100, 10, false, [/limit.+10.+exceeded/i]],
    ].forEach(([itemCount, maxPageCount, passed, messagePatterns]) => {
        it(`should check when itemCount=${itemCount} and maxPageCount=${maxPageCount}`, async () => {
            const itemData = buildItemData();
            const itemsData = Array(itemCount).fill(itemData);

            const { results, report } = await run([maxPageCountChecker(maxPageCount)], itemsData);

            assert.equal(report.length, Math.min(itemCount, maxPageCount));

            assertPassed(results, passed);
            assertMessages(results, messagePatterns);
        });
    });
});
