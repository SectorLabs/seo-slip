const robotsParser = require('robots-parser');

const { downloadRobotsTxt, isHtmlDocument } = require('../html');

module.exports = (appUrl, robotsTxtRules) => {
    const userAgent = (robotsTxtRules || {}).userAgent || '*';
    const robotsTxtUrl = `${appUrl}/robots.txt`;
    let robotsTxtParser = null;

    if (!robotsTxtRules) {
        return {};
    }

    return {
        init: () => {
            return downloadRobotsTxt(robotsTxtUrl)
                .then((robotsTxtContent) => {
                    robotsTxtParser = robotsParser(
                        robotsTxtUrl,
                        robotsTxtContent
                    );
                })
                .catch((error) => {
                    console.log(error);
                    throw error;
                });
        },
        analysis: (queueItem, responseBody, response) => {
            const contentType = queueItem.stateData.headers['content-type'];
            return {
                path: queueItem.path,
                contentType: contentType,
                robotsTxtIsAllowed: isHtmlDocument(responseBody, response)
                    ? robotsTxtParser.isAllowed(queueItem.url, userAgent)
                    : undefined,
            };
        },
        report: (analysis) => {
            return {
                path: analysis.path,
                contentType: analysis.contentType,
                robotsTxtIsAllowed: analysis.robotsTxtIsAllowed,
            };
        },
        check: (analysis) => {
            let result = {
                passed: true,
                messages: [],
            };

            if (analysis.url.startsWith(appUrl)) {
                const notAllowedPattern = (
                    robotsTxtRules.notAllowed || []
                ).find((pattern) => analysis.path.match(pattern));
                if (
                    analysis.robotsTxtIsAllowed !== undefined &&
                    !analysis.robotsTxtIsAllowed &&
                    !notAllowedPattern
                ) {
                    result.passed = false;
                    result.messages.push(
                        `Crawl is not allowed and url not in notAllowed exception list, url=${analysis.url}`
                    );
                }
            }

            return result;
        },
    };
};
