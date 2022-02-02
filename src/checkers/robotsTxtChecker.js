const robotsParser = require('robots-parser');

const { downloadRobotsTxt } = require('../html');

module.exports = (robotsTxtRules, appUrl, customHeaders) => {
    const userAgent = (robotsTxtRules || {}).userAgent || '*';
    const robotsTxtUrl = `${appUrl}/robots.txt`;
    let robotsTxtParser = null;

    if (!robotsTxtRules) {
        return {};
    }

    return {
        init: () => {
            return downloadRobotsTxt(robotsTxtUrl, customHeaders)
                .then((robotsTxtContent) => {
                    robotsTxtParser = robotsParser(robotsTxtUrl, robotsTxtContent);
                })
                .catch((error) => {
                    console.log(error);
                    throw error;
                });
        },
        analysis: (queueItem, responseBody, response) => {
            const contentType = response && response.headers['content-type'];
            return {
                url: queueItem.url,
                path: queueItem.path,
                contentType: contentType,
                isAllowedByRobotsTxt: robotsTxtParser.isAllowed(queueItem.url, userAgent),
            };
        },
        report: (analysis) => {
            return {
                path: analysis.path,
                contentType: analysis.contentType,
                isAllowedByRobotsTxt: analysis.isAllowedByRobotsTxt,
            };
        },
        check: (analysis) => {
            let result = {
                passed: true,
                messages: [],
            };

            if (analysis.url.startsWith(appUrl)) {
                const notAllowedByRulePattern = (robotsTxtRules.notAllowed || []).find((pattern) =>
                    analysis.path.match(pattern)
                );
                if (notAllowedByRulePattern && analysis.isAllowedByRobotsTxt) {
                    result.passed = false;
                    result.messages.push(
                        `Crawling is allowed by robots.txt, but not allowed by the checker rule ${notAllowedByRulePattern}, url=${analysis.url}`
                    );
                }
            }

            return result;
        },
    };
};
