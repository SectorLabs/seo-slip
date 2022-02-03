const {
    newEmptyAnalysis,
    newEmptyAnalyses,
    mergeItemAnalysis,
    pushItemAnalysis,

    newEmptyItemReport,
    newEmptyReport,
    mergeItemReport,
    pushItemReport,

    newEmptyItemResult,
    newEmptyResults,
    mergeItemResult,
    pushItemResult,
} = require('../src/reporting');

const run = async (checkers, itemsData) => {
    let analyses = newEmptyAnalyses();
    let report = newEmptyReport();
    let results = newEmptyResults();

    for (let i = 0; i < checkers.length; i++) {
        const checker = checkers[i];
        if (checker.init) {
            await checker.init();
        }
    }

    for (let i = 0; i < itemsData.length; i++) {
        const itemData = itemsData[i];

        const analysis = checkers
            .filter((checker) => checker.analysis)
            .map((checker) =>
                checker.analysis(itemData.queueItem, itemData.responseBody, itemData.response)
            )
            .reduce(mergeItemAnalysis, newEmptyAnalysis());
        analyses = pushItemAnalysis(analysis, analyses);

        const shouldStop = checkers
            .filter((checker) => checker.shouldStop)
            .map((checker) => checker.shouldStop())
            .some((shouldStop) => shouldStop);
        if (shouldStop) {
            break;
        }

        const itemReport = checkers
            .filter((checker) => checker.report)
            .map((checker) => checker.report(analysis))
            .reduce(mergeItemReport, newEmptyItemReport());
        report = pushItemReport(itemReport, report);

        const itemResult = checkers
            .filter((checker) => checker.check)
            .map((checker) => checker.check(analysis))
            .reduce(mergeItemResult, newEmptyItemResult());
        results = pushItemResult(itemResult, results);
    }

    const finalResult = checkers
        .filter((checker) => checker.finalCheck)
        .map((checker) => checker.finalCheck(analyses, report))
        .reduce(mergeItemResult, newEmptyItemResult());
    results = pushItemResult(finalResult, results);

    return { report, results };
};

module.exports = run;
