const xpath = require('xpath-html');

const { newMessage, newEmptyItemResult } = require('../reporting');

const { isHtmlDocument, noMemoryLeakStrCopy } = require('../html');

module.exports = (hreflangRules) => {
    const name = 'hreflang';

    const getHreflangUrls = (responseBody) => {
        try {
            const hreflangElements = xpath
                .fromPageSource(responseBody)
                .findElements(`//link[@rel="alternate"]`);
            if (hreflangElements) {
                return hreflangElements.reduce((hreflangElemsMap, elem) => {
                    const hrefAttribute = elem.attributes.getNamedItem('href');
                    const hreflangAttribute = elem.attributes.getNamedItem('hreflang');
                    if (hrefAttribute && hreflangAttribute) {
                        const hreflang = noMemoryLeakStrCopy(hreflangAttribute.value);
                        const href = noMemoryLeakStrCopy(hrefAttribute.value);
                        hreflangElemsMap[hreflang] = href;
                    }
                    return hreflangElemsMap;
                }, {});
            }
        } catch (e) {
            console.log(e);
        }
        return {};
    };

    return {
        analysis: (queueItem, responseBody, response) => {
            const isHtmlDoc = isHtmlDocument(responseBody, response);
            return {
                url: queueItem.url,
                isHtmlDocument: isHtmlDoc,
                hreflangUrls: isHtmlDoc ? getHreflangUrls(responseBody) : {},
            };
        },
        report: (analysis) => {
            const report = {};
            Object.keys(analysis.hreflangUrls)
                .sort()
                .forEach((hreflang) => {
                    report[`hreflang=${hreflang}`] = analysis.hreflangUrls[hreflang];
                });
            return report;
        },
        check: (analysis) => {
            const result = newEmptyItemResult();

            const hreflangRule = (hreflangRules || []).find((hreflangRule) =>
                analysis.url.match(hreflangRule.url)
            );

            if (analysis.isHtmlDocument && hreflangRule) {
                const match = analysis.url.match(hreflangRule.url);

                Object.keys(hreflangRule.expected).forEach((hreflang) => {
                    let expectedUrl = hreflangRule.expected[hreflang];
                    for (let i = 1; i < match.length; i++) {
                        expectedUrl = expectedUrl.replace(`(\$${i})`, match[i] || '');
                    }

                    if (analysis.hreflangUrls[hreflang] !== expectedUrl) {
                        result.passed = false;
                        result.messages.push(
                            newMessage(
                                analysis.url,
                                name,
                                `For lang=${hreflang}, expected href=${expectedUrl}, actual=${analysis.hreflangUrls[hreflang]}`
                            )
                        );
                    }
                });
            }

            return result;
        },
    };
};
