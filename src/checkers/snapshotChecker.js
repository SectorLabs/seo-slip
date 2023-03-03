const xpath = require('xpath-html');
const { isHtmlDocument, tryGetContentByXPath } = require('../html');

const { newMessage, newEmptyItemResult } = require('../reporting');

module.exports = (snapshotRules, previousReport) => {
    const name = 'snapshotChecker';

    const missingUrlCountThreshold = (snapshotRules || {}).missingUrlCountThreshold || 0.3;
    const ignoreColumns = (snapshotRules || {}).ignoreColumns || [];
    const ignoreUrls = (snapshotRules || {}).ignoreUrls || [];
    const mandatoryElement = (snapshotRules || {}).mandatoryElement || [];
    const mandatoryElementSelector = Object.keys(mandatoryElement).length
        ? mandatoryElement.selector
        : '';
    const mandatoryElementHysteresis = Object.keys(mandatoryElement).length
        ? mandatoryElement.hysteresis
        : 0;

    const previousReportMap = previousReport.reduce((acc, itemReport) => {
        acc[itemReport['url']] = itemReport;
        return acc;
    }, {});

    const getMandatoryElement = (responseBody) => {
        const body = xpath.fromPageSource(responseBody);
        const hrefAttributeValue = tryGetContentByXPath(body, mandatoryElementSelector).join('-');
        return hrefAttributeValue;
    };

    const getMandatoryElementCount = (string) => (string === '' ? 0 : string.split('-').length);

    const isLowInventoryUrl = (reportItem) =>
        Number(reportItem['mandatoryElementCount']) < mandatoryElementHysteresis &&
        Number(reportItem['mandatoryElementCount']) > 0 &&
        Number(reportItem['code']) === 200;

    const isIgnoredUrl = (url) => ignoreUrls.some((ignoreUrl) => url.includes(ignoreUrl));

    return {
        analysis: (queueItem, responseBody, response) => {
            const isHtmlDoc = isHtmlDocument(responseBody, response);
            return {
                mandatoryElementCount: Number(
                    getMandatoryElementCount(isHtmlDoc ? getMandatoryElement(responseBody) : '') ||
                        0
                ),
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
                    if (!isIgnoredUrl(previousReportItem.url)) {
                        missingUrls.push(url);
                    }
                } else {
                    Object.keys(previousReportItem).forEach((key) => {
                        const previousValue = previousReportItem[key];
                        const value = reportItem[key];
                        const serializedValue = value === undefined ? '' : value.toString();

                        if (
                            previousValue !== serializedValue &&
                            ignoreColumns.indexOf(key) === -1 &&
                            !isIgnoredUrl(url) &&
                            !key.startsWith('__') &&
                            !(
                                isLowInventoryUrl(previousReportItem) &&
                                Number(reportItem['mandatoryElementCount']) === 0 &&
                                Number(reportItem['code']) === 404
                            ) &&
                            !(
                                Number(reportItem['mandatoryElementCount']) > 0 &&
                                Number(reportItem['code']) === 200 &&
                                Number(previousReportItem['code']) === 404
                            ) &&
                            !(
                                Number(reportItem['mandatoryElementCount']) > 0 &&
                                Number(previousReportItem['mandatoryElementCount']) > 0 &&
                                Number(reportItem['code']) === 200 &&
                                Number(previousReportItem['code']) === 200
                            )
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
