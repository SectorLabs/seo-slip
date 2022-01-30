const newEmptyReport = () => ({});

const newEmptyItemResult = () => ({ passed: true, messages: [] });

const run = async (checker, itemsData) => {
    const analyses = [];
    let report = [];
    let results = [];

    await (checker.init && checker.init());

    for (let i = 0; i < itemsData.length; i++) {
        const itemData = itemsData[i];
        const analysis =
            checker.analysis &&
            checker.analysis(itemData.queueItem, itemData.responseBody, itemData.response);
        analyses.push(analysis);

        const shouldStop = (checker.shouldStop && checker.shouldStop()) || false;
        if (shouldStop) {
            break;
        }

        const itemReport = (checker.report && checker.report(analysis)) || newEmptyReport();
        report.push(itemReport);

        const itemResult = (checker.check && checker.check(analysis)) || newEmptyItemResult();
        results.push(itemResult);
    }

    const finalResult =
        (checker.finalCheck && checker.finalCheck(analyses, report)) || newEmptyReport();

    return { report, results, finalResult };
};

module.exports = run;
