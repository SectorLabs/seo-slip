const assert = require('assert');
const mock = require('mock-require');
const sinon = require('sinon');

const { buildItemData, run } = require('..');

describe('robotsTxtChecker', async () => {
    const appUrl = 'https://www.site.com';
    const rules = {
        userAgent: '*',
        notAllowed: ['^/en/', ['\\?']],
    };

    afterEach(() => {
        mock.stopAll();
    });

    const mockDownloadRobotsTxt = (mockExport) => {
        mock('../../src/html/downloadRobotsTxt', mockExport);

        const html = mock.reRequire('../../src/html');
        const robotsTxtChecker = mock.reRequire('../../src/checkers/robotsTxtChecker');
        const checkers = mock.reRequire('../../src/checkers');

        return { html, robotsTxtChecker, checkers };
    };

    [
        ['/en/search/query-string', 'User-agent: *\nDisallow: /en/\n', false, true, []],
        ['/ar/search/query-string', 'User-agent: *\nDisallow: /en/', true, true, []],
        ['/ar/search/query-string/?a=1', 'User-agent: *\nDisallow: *?\n', false, true, []],
        [
            '/ar/search/query-string/?a=1',
            'User-agent: *\nAllow: *?\n',
            true,
            false,
            [/allowed by robots\.txt.+not allowed by the checker rule/i],
        ],
    ].forEach(([path, robotsTxtContent, allowed, passed, messagePatterns]) => {
        it(`should check ${path} in ${robotsTxtContent.replace('\n', '')}`, async () => {
            const { robotsTxtChecker } = mockDownloadRobotsTxt(() =>
                Promise.resolve(robotsTxtContent)
            );

            const itemData = buildItemData({ path });

            const {
                report: [itemReport],
                results: [result],
            } = await run(robotsTxtChecker(rules, appUrl), [itemData]);

            assert.equal(itemReport.isAllowedByRobotsTxt, allowed);

            assert.equal(result.passed, passed);
            messagePatterns.forEach((messagePattern, index) => {
                assert.match(result.messages[index], messagePattern);
            });
        });
    });

    it('should pass when the response is undefined', async () => {
        const path = '/en/search/query-string';
        const robotsTxtContent = 'User-agent: *\nDisallow: /en/\n';
        const allowed = false;
        const { robotsTxtChecker } = mockDownloadRobotsTxt(() => Promise.resolve(robotsTxtContent));

        const itemData = buildItemData({ path });

        const {
            report: [itemReport],
            results: [result],
        } = await run(robotsTxtChecker(rules, appUrl), [itemData]);

        assert.equal(itemReport.isAllowedByRobotsTxt, allowed);

        assert.equal(result.passed, true);
    });

    it('should use the custom headers when specified', async () => {
        const path = '/en/search/query-string';
        const robotsTxtContent = 'User-agent: *\nDisallow: /en/\n';
        const allowed = false;
        const customHeaders = { x: -1 };
        const fakeDownloadRobotsTxt = sinon.fake.returns(Promise.resolve(robotsTxtContent));
        const { robotsTxtChecker } = mockDownloadRobotsTxt(fakeDownloadRobotsTxt);

        const itemData = buildItemData({ path });
        itemData.response = undefined;

        const {
            report: [itemReport],
            results: [result],
        } = await run(robotsTxtChecker(rules, appUrl, customHeaders), [itemData]);

        assert.equal(
            fakeDownloadRobotsTxt.calledWith('https://www.site.com/robots.txt', customHeaders),
            true
        );

        assert.equal(itemReport.isAllowedByRobotsTxt, allowed);

        assert.equal(result.passed, true);
    });
});
