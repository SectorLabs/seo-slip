const http = require('http');
const https = require('https');

const Crawler = require('simplecrawler');

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
} = require('../reporting');

module.exports = (fullPath, maxDepth, variables, checkers, done) => {
    const crawler = new Crawler(fullPath);

    crawler.needsAuth = variables.needsAuth;
    crawler.authUser = variables.authUser;
    crawler.authPass = variables.authPass;

    crawler.maxConcurrency = variables.maxConcurrency || 3;
    crawler.maxDepth = maxDepth || 1;
    crawler.respectRobotsTxt = variables.respectRobotsTxt;
    crawler.userAgent = variables.userAgent || 'seo-slip';
    crawler.scanSubdomains = variables.scanSubdomains;
    crawler.domainWhitelist = variables.domainWhitelist;
    crawler.decodeResponses = variables.decodeResponses;
    crawler.timeout = variables.timeout || 60000;
    crawler.customHeaders = variables.customHeaders;
    crawler.parseHTMLComments = variables.parseHTMLComments;
    crawler.parseScriptTags = variables.parseScriptTags;

    crawler.httpAgent = http.Agent({ keepAlive: true });
    crawler.httpsAgent = https.Agent({ keepAlive: true });

    const skipUrls = (variables.skipUrls || []).map((str) => new RegExp(str));

    crawler.addFetchCondition((queueItem, referrerQueueItem, callback) => {
        if (queueItem.url === referrerQueueItem.url) {
            console.log('Skipped same URL!');
            const fetch = false;
            callback(null, fetch);
        } else {
            const fetch = !skipUrls.some((skipUrl) => skipUrl.test(queueItem.url));
            callback(null, fetch);
        }
    });

    const header = new Set();
    let analyses = newEmptyAnalyses();
    let report = newEmptyReport();
    let results = newEmptyResults();
    let isCrawlCompleted = false;

    const fetchCompleted = (queueItem, responseBody, response) => {
        const analysis = checkers
            .filter((checker) => checker.analysis)
            .map((checker) => checker.analysis(queueItem, responseBody, response))
            .reduce(mergeItemAnalysis, newEmptyAnalysis());
        analyses = pushItemAnalysis(analysis, analyses);

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

        Object.keys(itemReport).forEach((key) => header.add(key));
    };

    const crawlCompleted = () => {
        if (isCrawlCompleted) {
            // workaround because the events library used by the crawler has a bug
            return;
        } else {
            isCrawlCompleted = true;
        }

        results = checkers
            .filter((checker) => checker.finalCheck)
            .map((checker) => checker.finalCheck(analyses, report))
            .reduce(pushItemResult, results);

        done(results, Array.from(header), report);
    };

    const fetchStarted = (queueItem) => {
        const stop = checkers
            .filter((checker) => checker.shouldStop)
            .map((checker) => checker.shouldStop(queueItem))
            .some((shouldStop) => shouldStop);
        if (stop) {
            crawler.stop();
            crawlCompleted();
        }
    };

    crawler.on('fetchstart', fetchStarted);
    crawler.on('fetchcomplete', fetchCompleted);
    crawler.on('fetchredirect', fetchCompleted);
    crawler.on('fetch404', fetchCompleted);
    crawler.on('fetch410', fetchCompleted);
    crawler.on('fetcherror', fetchCompleted);

    crawler.on('fetchprevented', (queueItem) =>
        console.log(`fetch for url=${queueItem.url} prevented by the rules`)
    );

    crawler.on('fetchtimeout', (queueItem) =>
        console.log(`fetch for url=${queueItem.url} time out`)
    );

    crawler.on('fetchclienterror', (queueItem, error) =>
        console.log(`fetch for url=${queueItem.url} client fetch error: ${error}`)
    );

    crawler.on('complete', crawlCompleted);

    const originalEmit = crawler.emit;
    crawler.emit = function (evtName, queueItem) {
        crawler.queue.countItems({ fetched: true }, function (err, completeCount) {
            if (err) {
                throw err;
            }

            crawler.queue.getLength(function (err, length) {
                if (err) {
                    throw err;
                }

                console.log(
                    'fetched %d of %d — %d open requests, %d open listeners',
                    completeCount,
                    length,
                    crawler._openRequests.length,
                    crawler._openListeners,
                    queueItem?.url ?? queueItem,
                    queueItem?.status ?? queueItem,
                    queueItem?.fetched ?? queueItem,
                    queueItem?.stateData.code ?? queueItem,
                    queueItem?.referrer ?? queueItem,
                    crawler.queue[-3]
                );
            });
        });

        console.log(evtName, queueItem ? (queueItem.url ? queueItem.url : queueItem) : null);
        originalEmit.apply(crawler, arguments);
    };

    Promise.all(
        checkers
            .map((checker) => checker.init)
            .filter((init) => init)
            .map((init) => init())
    ).then(() => crawler.start());
};
