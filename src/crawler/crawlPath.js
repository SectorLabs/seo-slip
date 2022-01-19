const http = require('http');
const https = require('https');

const Crawler = require('simplecrawler');

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

    crawler.httpAgent = http.Agent({ keepAlive: true });
    crawler.httpsAgent = https.Agent({ keepAlive: true });

    const skipUrls = (variables.skipUrls || []).map((str) => new RegExp(str));
    crawler.addFetchCondition((queueItem, referrerQueueItem, callback) => {
        const fetch = !skipUrls.some((skipUrl) => skipUrl.test(queueItem.url));
        callback(null, fetch);
    });

    const header = new Set();
    const report = [];
    const analyses = [];
    let isCrawlCompleted = false;

    const analyzeResponse = (queueItem, responseBody, response) => {
        let analyse = {};

        checkers.forEach((checker) => {
            analyse = Object.assign(
                analyse,
                checker.analysis
                    ? checker.analysis(queueItem, responseBody, response)
                    : {}
            );
        });

        return analyse;
    };

    const createItemReport = (analysis) => {
        let itemReport = {};

        checkers.forEach((checker) => {
            itemReport = Object.assign(
                itemReport,
                checker.report ? checker.report(analysis) : {}
            );
        });

        return itemReport;
    };

    const fetchCompleted = (queueItem, responseBody, response) => {
        const analysis = analyzeResponse(queueItem, responseBody, response);
        const itemReport = createItemReport(analysis);

        analyses.push(analysis);
        report.push(itemReport);
        Object.keys(itemReport).forEach((key) => header.add(key));
    };

    const crawlCompleted = () => {
        if (isCrawlCompleted) {
            // workaround because the events library used by the crawler has a bug
            return;
        } else {
            isCrawlCompleted = true;
        }

        let results = {
            passed: true,
            messages: [],
        };

        checkers.forEach((checker) => {
            analyses.forEach((analysis) => {
                const result = checker.check
                    ? checker.check(analysis)
                    : {
                          passed: true,
                          messages: [],
                      };
                results.passed &= result.passed;
                results.messages = results.messages.concat(result.messages);
            });
            if (checker.finalCheck) {
                const result = checker.finalCheck(analyses, report);
                results.passed &= result.passed;
                results.messages = results.messages.concat(result.messages);
            }
        });

        done(results, Array.from(header), report);
    };

    const fetchStarted = (queueItem) => {
        const stop = checkers
            .map((checker) => checker.shouldStop)
            .filter((shouldStop) => shouldStop)
            .some((shouldStop) => shouldStop(queueItem));
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
    crawler.on('complete', crawlCompleted);

    Promise.all(
        checkers
            .map((checker) => checker.init)
            .filter((init) => init)
            .map((init) => init())
    ).then(() => crawler.start());
};
