module.exports = () => {
    return {
        analysis: (queueItem) => {
            return {
                url: queueItem.url,
                requestLatency: queueItem.stateData.requestLatency,
                downloadTime: queueItem.stateData.downloadTime,
                requestTime: queueItem.stateData.requestTime,
                actualDataSize: queueItem.stateData.actualDataSize,
            };
        },
        report: (analysis) => {
            return {
                url: analysis.url,
                __requestLatency: analysis.requestLatency,
                __downloadTime: analysis.downloadTime,
                __requestTime: analysis.requestTime,
                __actualDataSize: analysis.actualDataSize,
            };
        },
    };
};
