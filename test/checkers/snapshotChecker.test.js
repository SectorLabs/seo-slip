const assert = require('assert');
const { snapshotChecker } = require('../../src/checkers');

const { assertMessages, assertPassed } = require('..');

describe('snapshotChecker', () => {
    it('should pass when the previous and current reports are empty', () => {
        const rules = {};
        const previousReport = [];
        const currentReport = [];

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    it('should pass when the previous report is empty', () => {
        const rules = {};
        const previousReport = [];
        const currentReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    it('should pass when the previous and current reports are identical', () => {
        const rules = {};
        const previousReport = [
            { url: 'https://a.b/c', index: 'true', follow: 'true' },
            { url: 'https://a.b/d', index: 'true', follow: 'false' },
            { url: 'https://a.b/e', index: 'false', follow: 'true' },
        ];
        const currentReport = previousReport;

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    it('should pass when a new url is added to the current report', () => {
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

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    it('should fail when the reports are different', () => {
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

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, false);
        assertMessages(results, [/previous.+follow.+true.+now.+false/i]);
    });

    it('should pass when an url is different and also specified in the ignore list', () => {
        const rules = { ignoreUrls: ['https://a.b/e'] };
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

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    it('should pass when a column is different and also specified in the ignore list', () => {
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

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    it('should pass when a different column is named with __ prefix', () => {
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

        const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

        assertPassed(results, true);
    });

    [
        [1.0, true, []],
        [0.5, true, []],
        [0.34, true, []],
        [0.32, false, [/missing.+count.+1.+percentage.+0.33333/i]],
        [0.0, false, [/missing.+count.+1.+percentage.+0.33333/i]],
    ].forEach(([missingUrlCountThreshold, passed, messagePatterns]) => {
        it('should check when the current report is missing previous urls', () => {
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

            const results = snapshotChecker(rules, previousReport).finalCheck([], currentReport);

            assertPassed(results, passed);
            assertMessages(results, messagePatterns);
        });
    });
});
