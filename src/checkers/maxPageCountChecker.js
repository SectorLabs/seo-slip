module.exports = (maxPageCount) => {
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
            return {
                passed: passed,
                messages: passed ? [] : [`Limit maxPageCount=${maxPageCount} exceeded`],
            };
        },
    };
};
