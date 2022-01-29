const xpath = require('xpath-html');

const { isHtmlDocument, tryGetContentByXPath } = require('../html');

module.exports = (contentRules) => {
    return {
        analysis: (queueItem, responseBody, response) => {
            const isHtmlDoc = isHtmlDocument(responseBody, response);
            const rule = (contentRules || []).find((rule) => queueItem.url.match(rule.url));
            const result = {
                url: queueItem.url,
                isHtmlDoc: isHtmlDoc,
                contentCheckerFindings: {},
            };

            if (isHtmlDoc && rule) {
                Object.keys(rule.expected).forEach((locator) => {
                    const expectedPattern = rule.expected[locator];
                    const body = xpath.fromPageSource(responseBody);
                    const actualValue = tryGetContentByXPath(body, locator).join(' ');
                    result.contentCheckerFindings[locator] = {
                        expected: expectedPattern,
                        actual: actualValue,
                    };
                });
            }

            return result;
        },
        check: (analysis) => {
            const result = {
                passed: true,
                messages: [],
            };

            Object.keys(analysis.contentCheckerFindings).forEach((locator) => {
                const url = analysis.url;
                const expected = analysis.contentCheckerFindings[locator].expected;
                const actual = analysis.contentCheckerFindings[locator].actual;

                if (!actual.match(expected)) {
                    result.passed = false;
                    result.messages.push(
                        `For locator=${locator}, expected=${expected}, actual="${actual}", url=${url}"`
                    );
                }
            });

            return result;
        },
    };
};
