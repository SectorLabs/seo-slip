const xpath = require('xpath-html');
const { isHtmlDocument, tryGetContentByXPath } = require('../html');

const { newMessage, newEmptyItemResult } = require('../reporting');

module.exports = (snapshotRules, previousReport) => {
    const name = 'snapshotChecker';

    const missingUrlCountThreshold = (snapshotRules || {}).missingUrlCountThreshold || 0.3;
    const ignoreColumns = (snapshotRules || {}).ignoreColumns || [];
    const ignoreUrls = (snapshotRules || {}).ignoreUrls || [];

    const previousReportMap = previousReport.reduce((acc, itemReport) => {
        acc[itemReport['url']] = itemReport;
        return acc;
    }, {});

    const getMandatoryElement = (responseBody) => {
        const body = xpath.fromPageSource(responseBody);
        const hrefAttributeValue = tryGetContentByXPath(
            body,
            snapshotRules.mandatoryElementSelector
        ).join(' ');
        return hrefAttributeValue;
    };

    const getMandatoryElementCount = (string) => Number(string.split('_').length - 1);

    return {
        analysis: (queueItem, responseBody, response) => {
            const isHtmlDoc = isHtmlDocument(responseBody, response);
            return {
                mandatoryElementCount:
                    getMandatoryElementCount(isHtmlDoc ? getMandatoryElement(responseBody) : '') ||
                    0,
            };
        },
        report: (analysis) => {
            return {
                mandatoryElementCount: analysis.mandatoryElementCount,
            };
        },
        finalCheck: (analyses, report) => {
            let result = newEmptyItemResult();

            const reportMap = report.reduce((acc, itemReport) => {
                acc[itemReport['url']] = itemReport;
                return acc;
            }, {});

            const missingUrls = [];
            Object.keys(previousReportMap).forEach((url) => {
                const previousReportItem = previousReportMap[url];
                const reportItem = reportMap[url];
                if (!reportItem) {
                    missingUrls.push(url);
                } else {
                    Object.keys(previousReportItem).forEach((key) => {
                        const previousValue = previousReportItem[key];
                        const value = reportItem[key];
                        const serializedValue = value === undefined ? '' : value.toString();
                        if (
                            previousValue !== serializedValue &&
                            ignoreColumns.indexOf(key) === -1 &&
                            ignoreUrls.indexOf(url) === -1 &&
                            !key.startsWith('__') &&
                            !(
                                previousReportItem['mandatoryElementCount'] < 10 &&
                                previousReportItem['mandatoryElementCount'] > 0
                            ) &&
                            !(reportItem['mandatoryElementCount'] > 0 && reportItem['code'] === 200)
                        ) {
                            result.passed = false;
                            result.messages.push(
                                newMessage(
                                    url,
                                    name,
                                    `Previous ${key}=${previousValue}, now=${value}`
                                )
                            );
                        }
                    });
                }
            });

            const missingUrlPercentage =
                1 -
                (Object.keys(previousReportMap).length - missingUrls.length) /
                    Object.keys(previousReportMap).length;
            if (missingUrlPercentage >= missingUrlCountThreshold) {
                result.passed = false;
                result.messages.push(
                    newMessage(
                        '',
                        name,
                        `Previous URL count=${
                            Object.keys(previousReportMap).length
                        }, missing URL count=${
                            missingUrls.length
                        }, missing URL percentage=${missingUrlPercentage}, threshold=${missingUrlCountThreshold}\n` +
                            missingUrls.join('\n')
                    )
                );
            }

            return result;
        },
    };
};
