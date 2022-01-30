const assert = require('assert');
const { loggerDummyChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('loggerDummyChecker', () => {
    it('should log details about the response', async () => {
        const url = 'https://www.site.com/en/search/query-string/?a=1';
        const stateData = {
            requestLatency: 1,
            downloadTime: 2,
            requestTime: 3,
            actualDataSize: 4,
        };
        const itemData = buildItemData({ url, stateData });

        const {
            report: [itemReport],
            results: [result],
        } = await run(loggerDummyChecker(), [itemData]);

        assert.equal(itemReport.url, url);
        assert.equal(itemReport.__requestLatency, stateData.requestLatency);
        assert.equal(itemReport.__downloadTime, stateData.downloadTime);
        assert.equal(itemReport.__requestTime, stateData.requestTime);
        assert.equal(itemReport.__actualDataSize, stateData.actualDataSize);

        assert.equal(result.passed, true);
    });
});
