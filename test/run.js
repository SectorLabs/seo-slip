const run = (checker, itemData) => {
    const analysis =
        checker.analysis &&
        checker.analysis(
            itemData.queueItem,
            itemData.responseBody,
            itemData.response
        );
    const report = checker.report && checker.report(analysis);
    const result = checker.check && checker.check(analysis);
    const finalResult =
        checker.finalCheck && checker.finalCheck([analysis], report);

    return { report, result, finalResult };
};

module.exports = run;
