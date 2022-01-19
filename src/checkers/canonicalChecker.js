const xpath = require('xpath-html');

const { isHtmlDocument, tryGetContentByXPath } = require('../html');

module.exports = (canonicalRules) => {
    const getCanonicalUrl = (responseBody) => {
        const body = xpath.fromPageSource(responseBody);
        const hrefAttributeValue = tryGetContentByXPath(
            body,
            `//link[@rel="canonical"]/@href`
        ).join(' ');
        return hrefAttributeValue;
    };

    return {
        analysis: (queueItem, responseBody, response) => {
            const isHtmlDoc = isHtmlDocument(responseBody, response);
            return {
                url: queueItem.url,
                isHtmlDocument: isHtmlDoc,
                canonicalUrl: isHtmlDoc ? getCanonicalUrl(responseBody) : '',
            };
        },
        report: (analysis) => {
            return {
                canonicalUrl: analysis.canonicalUrl,
            };
        },
        check: (analysis) => {
            const result = {
                passed: true,
                messages: [],
            };

            const canonicalRule = (canonicalRules || []).find((canonicalRule) =>
                analysis.url.match(canonicalRule.url)
            );

            if (analysis.isHtmlDocument && canonicalRule) {
                const match = analysis.url.match(canonicalRule.url);
                let expectedUrl = canonicalRule.expected;
                for (let i = 1; i < match.length; i++) {
                    expectedUrl = expectedUrl.replace(
                        `(\$${i})`,
                        match[i] || ''
                    );
                }

                if (analysis.canonicalUrl !== expectedUrl) {
                    result.passed = false;
                    result.messages.push(
                        `Expected canonicalUrl=${expectedUrl}, actual=${analysis.canonicalUrl}, url=${analysis.url}`
                    );
                }
            }

            return result;
        },
    };
};
