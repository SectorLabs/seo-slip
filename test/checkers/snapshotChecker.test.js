const assert = require('assert');
const { snapshotChecker } = require('../../src/checkers');

describe('snapshotChecker', function () {
    it('should pass when the previous and current reports are empty', function () {
        const rules = {};
        const previousReport = [];
        const currentReport = [];

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, true);
    });

    it('should pass when the previous report is empty', function () {
        const rules = {};
        const previousReport = [];
        const currentReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, true);
    });

    it('should pass when the previous and current reports are identical', function () {
        const rules = {};
        const previousReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];
        const currentReport = previousReport;

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, true);
    });

    it('should pass when a new url is added to the current report', function () {
        const rules = {};
        const previousReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
        ];
        const currentReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, true);
    });

    it('should fail when the reports are different', function () {
        const rules = {};
        const previousReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];
        const currentReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'false' },
        ];

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, false);
        assert.match(result.messages[0], /previous.+follow.+true.+now.+false/i);
    });

    it('should pass when a different column is specified in the ignore list', function () {
        const rules = { ignoreColumns: ['follow'] };
        const previousReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];
        const currentReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'false' },
        ];

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, true);
    });

    it('should pass when a different column is named with __ prefix', function () {
        const rules = {};
        const previousReport = [
            { url: 'https://a.b/c', index: 'true', __follow: 'true' },
            { url: 'https://a.b/d', index: 'true', __follow: 'false' },
            { url: 'https://a.b/e', index: 'false', __follow: 'true' },
        ];
        const currentReport = [
            { url: 'https://a.b/c', index: 'true', __follow: 'true' },
            { url: 'https://a.b/d', index: 'true', __follow: 'false' },
            { url: 'https://a.b/e', index: 'false', __follow: 'false' },
        ];

        const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assert.equal(result.passed, true);
    });

    [
        [1.0, true, []],
        [0.5, true, []],
        [0.34, true, []],
        [0.32, false, [/missing.+count.+1.+percentage.+0.33333/i]],
        [0.0, false, [/missing.+count.+1.+percentage.+0.33333/i]],
    ].forEach(([missingUrlCountThreshold, passed, messagePatterns]) => {
        it('should check when the current report is missing previous urls', function () {
            const rules = { missingUrlCountThreshold };
            const previousReport = [
                { url: 'https://a.b/c', index: 'true', follow: 'true' },
                { url: 'https://a.b/d', index: 'true', follow: 'false' },
                { url: 'https://a.b/e', index: 'false', follow: 'true' },
            ];
            const currentReport = [
                { url: 'https://a.b/c', index: 'true', follow: 'true' },
                { url: 'https://a.b/d', index: 'true', follow: 'false' },
            ];

            const result = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

            assert.equal(result.passed, passed);
            messagePatterns.forEach((messagePattern, index) => {
                assert.match(result.messages[index], messagePattern);
            });
        });
    });
});
