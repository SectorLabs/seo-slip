const { newMessage, newEmptyItemResult } = require('../reporting');

module.exports = (dataSizeRules) => {
    const name = 'dataSizeChecker';
    const rules = dataSizeRules || [];

    const isN = (number) => !isNaN(number);

    return {
        analysis: (queueItem, responseBody, response) => {
            return {
                url: queueItem.url,
                path: queueItem.path,
                contentType: response && response.headers && response.headers['content-type'],
                dataSize: queueItem.stateData.actualDataSize,
                uncompressedDataSize: responseBody.length,
            };
        },
        report: (analysis) => {
            return {
                contentType: analysis.contentType,
                __dataSize: analysis.dataSize,
                __uncompressedDataSize: analysis.uncompressedDataSize,
            };
        },
        check: (analysis) => {
            const result = newEmptyItemResult();

            const rule = rules.find((rule) => {
                return (
                    (!rule.condition.path || (analysis.path || '').includes(rule.condition.path)) &&
                    (!rule.condition['content-type'] ||
                        (analysis.contentType || '').includes(rule.condition['content-type']))
                );
            });

            if (rule) {
                if (isN(rule.minDataSize) && rule.minDataSize > analysis.dataSize) {
                    result.passed = false;
                    result.messages.push(
                        newMessage(
                            analysis.url,
                            name,
                            `Expected minDataSize=${rule.minDataSize}, actual=${analysis.dataSize}`
                        )
                    );
                }
                if (isN(rule.maxDataSize) && rule.maxDataSize < analysis.dataSize) {
                    result.passed = false;
                    result.messages.push(
                        newMessage(
                            analysis.url,
                            name,
                            `Expected maxDataSize=${rule.maxDataSize}, actual=${analysis.dataSize}`
                        )
                    );
                }
                if (
                    isN(rule.minUncompressedDataSize) &&
                    rule.minUncompressedDataSize > analysis.uncompressedDataSize
                ) {
                    result.passed = false;
                    result.messages.push(
                        newMessage(
                            analysis.url,
                            name,
                            `Expected minUncompressedDataSize=${rule.minUncompressedDataSize}, actual=${analysis.uncompressedDataSize}`
                        )
                    );
                }
                if (
                    isN(rule.maxUncompressedDataSize) &&
                    rule.maxUncompressedDataSize < analysis.uncompressedDataSize
                ) {
                    result.passed = false;
                    result.messages.push(
                        newMessage(
                            analysis.url,
                            name,
                            `Expected maxUncompressedDataSize=${rule.maxUncompressedDataSize}, actual=${analysis.uncompressedDataSize}`
                        )
                    );
                }
            }

            return result;
        },
    };
};
