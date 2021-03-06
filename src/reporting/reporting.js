const newEmptyAnalysis = () => ({});

const newEmptyAnalyses = () => [];

const mergeItemAnalysis = (a, b) => ({ ...a, ...b });

const pushItemAnalysis = (itemAnalysis, analyses) => [...analyses, itemAnalysis];

const newEmptyItemReport = () => ({});

const newEmptyReport = () => [];

const mergeItemReport = (a, b) => ({ ...a, ...b });

const pushItemReport = (itemReport, report) => [...report, itemReport];

const newMessage = (url, source, text) => ({ url, source, text });

const newEmptyItemResult = () => ({ passed: true, messages: [] });

const newEmptyResults = () => ({ passed: true, messages: [] });

const mergeItemResult = (a, b) => ({
    passed: a.passed && b.passed,
    messages: a.messages.concat(b.messages),
});

const pushItemResult = (itemResult, results) => ({
    passed: itemResult.passed && results.passed,
    messages: itemResult.messages.concat(results.messages),
});

const printResults = (itemResults) => {
    const resultsByUrl = {};
    itemResults.messages.forEach((message) => {
        if (!resultsByUrl[message.url]) {
            resultsByUrl[message.url] = [];
        }
        resultsByUrl[message.url].push(message);
    });

    let text = '';

    Object.keys(resultsByUrl).forEach((url) => {
        const messages = resultsByUrl[url];
        text += `${url}\n`;
        messages.forEach((message) => (text += `\t${message.source}: ${message.text}\n`));
        text += `\n`;
    });

    text += `${itemResults.messages.length} message(s) for ${
        Object.keys(resultsByUrl).length
    } URL(s)`;

    return text;
};

module.exports = {
    newEmptyAnalysis,
    newEmptyAnalyses,
    mergeItemAnalysis,
    pushItemAnalysis,

    newMessage,
    newEmptyItemReport,
    newEmptyReport,
    mergeItemReport,
    pushItemReport,
    printResults,

    newEmptyItemResult,
    newEmptyResults,
    mergeItemResult,
    pushItemResult,
};
