const assert = require('assert');
const { loggerDummyChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('loggerDummyChecker', function () {
    it('should log details about the response', function () {
        const url = 'https://www.site.com/en/search/query-string/?a=1';
        const stateData = {
            requestLatency: 1,
            downloadTime: 2,
            requestTime: 3,
            actualDataSize: 4,
        };
        const itemData = buildItemData({ url, stateData });

        const { report, result } = run(loggerDummyChecker(), itemData);

        assert.equal(report.url, url);
        assert.equal(report.__requestLatency, stateData.requestLatency);
        assert.equal(report.__downloadTime, stateData.downloadTime);
        assert.equal(report.__requestTime, stateData.requestTime);
        assert.equal(report.__actualDataSize, stateData.actualDataSize);

        assert.equal(result.passed, true);
    });
});
