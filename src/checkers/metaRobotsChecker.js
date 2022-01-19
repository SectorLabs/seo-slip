const xpath = require('xpath-html');

const { isHtmlDocument, tryGetContentByXPath } = require('../html');

module.exports = (metaRobotsRules) => {
    const getRobotsContent = (responseBody, robotName = 'robots') => {
        const body = xpath.fromPageSource(responseBody);
        const contentAttributeValue = tryGetContentByXPath(
            body,
            `//meta[@name="${robotName}"]/@content`
        ).join(' ');
        return contentAttributeValue;
    };

    const toBooleanRobotsDirective = (robotsContent) => {
        const content = robotsContent || '';
        return {
            index: content.indexOf('noindex') === -1,
            follow: content.indexOf('nofollow') === -1,
        };
    };

    return {
        analysis: (queueItem, responseBody, response) => {
            const isHtmlDoc = isHtmlDocument(responseBody, response);
            return isHtmlDoc
                ? {
                      ...toBooleanRobotsDirective(
                          getRobotsContent(responseBody)
                      ),
                      isHtmlDocument: isHtmlDoc,
                  }
                : {};
        },
        report: (analysis) => {
            if (analysis.isHtmlDocument) {
                return {
                    index: analysis.index ? 'index' : 'noindex',
                    follow: analysis.follow ? 'follow' : 'nofollow',
                };
            }
            return {};
        },
        check: (analysis) => {
            const rule = (metaRobotsRules || []).find((rule) =>
                analysis.url.match(rule.path)
            );
            let result = {
                passed: true,
                messages: [],
            };
            if (analysis.isHtmlDocument && rule) {
                if (rule.index !== undefined && rule.index !== analysis.index) {
                    result.passed = false;
                    result.messages.push(
                        `Expected index=${rule.index}, actual=${analysis.index}, url=${analysis.url}`
                    );
                }
                if (
                    rule.follow !== undefined &&
                    rule.follow !== analysis.follow
                ) {
                    result.passed = false;
                    result.messages.push(
                        `Expected follow=${rule.follow}, actual=${analysis.follow}, url=${analysis.url}`
                    );
                }
            }
            return result;
        },
    };
};
