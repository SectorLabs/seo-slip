const xpath = require('xpath-html');

const { newMessage, newEmptyItemResult } = require('../reporting');

const { isHtmlDocument, tryGetContentByXPath } = require('../html');

module.exports = (metaRobotsRules) => {
    const name = 'metaRobotsChecker';

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
                      ...toBooleanRobotsDirective(getRobotsContent(responseBody)),
                      url: queueItem.url,
                      isHtmlDocument: isHtmlDoc,
                  }
                : { isHtmlDocument: isHtmlDoc };
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
            const rule = analysis.isHtmlDocument
                ? (metaRobotsRules || []).find((rule) => analysis.url.match(rule.path))
                : null;
            let result = newEmptyItemResult();
            if (analysis.isHtmlDocument && rule) {
                if (rule.index !== undefined && rule.index !== analysis.index) {
                    result.passed = false;
                    result.messages.push(
                        newMessage(
                            analysis.url,
                            name,
                            `Expected index=${rule.index}, actual=${analysis.index}`
                        )
                    );
                }
                if (rule.follow !== undefined && rule.follow !== analysis.follow) {
                    result.passed = false;
                    result.messages.push(
                        newMessage(
                            analysis.url,
                            name,
                            `Expected follow=${rule.follow}, actual=${analysis.follow}`
                        )
                    );
                }
            }
            return result;
        },
    };
};
