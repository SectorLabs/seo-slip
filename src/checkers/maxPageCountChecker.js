const { newMessage, newEmptyItemResult } = require('../reporting');

module.exports = (maxPageCount) => {
    const name = 'maxPageCountChecker';
    let pageCount = 0;
    return {
        analysis: () => {
            pageCount += 1;
            return {};
        },
        shouldStop: () => {
            return pageCount > maxPageCount;
        },
        finalCheck: (analyses, report) => {
            const passed = pageCount <= maxPageCount;
            const result = newEmptyItemResult();
            result.passed = passed;
            if (!passed) {
                result.messages.push(
                    newMessage('', name, `Limit maxPageCount=${maxPageCount} exceeded`)
                );
            }
            return result;
        },
    };
};
