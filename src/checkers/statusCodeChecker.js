module.exports = (statusCodeRules) => {
    const code = (statusCodeRules || {}).code || 200;

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const normalizeCode = (code) => (typeof code === 'number' ? [code] : code);

    const normalizeExceptions = (exceptions) => {
        // Output example:
        // [
        //     { regexp: /\/new-projects/, code: [ 301, 307 ] },
        //     { regexp: /\/ur\/new-projects/, code: [ 404 ] },
        // ]
        return Object.keys(exceptions).map((key) => {
            const rule = exceptions[key];
            if (typeof rule === 'object' && rule.regexp === true) {
                return {
                    regexp: new RegExp(key),
                    code: normalizeCode(rule.code),
                };
            }
            return {
                regexp: RegExp(`^${escapeRegExp(key)}$`),
                code: normalizeCode(rule),
            };
        });
    };

    const exceptions = normalizeExceptions((statusCodeRules || {}).exceptions || {});

    const findException = (path, exceptions) => {
        return exceptions.find((exception) => path.match(exception.regexp));
    };

    return {
        analysis: (queueItem, responseBody, response) => {
            return {
                code: queueItem.stateData.code,
                path: queueItem.path,
                url: queueItem.url,
                referrer: queueItem.referrer,
            };
        },
        report: (analysis) => {
            return {
                code: analysis.code,
                path: analysis.path,
            };
        },
        check: (analysis) => {
            const result = {
                passed: true,
                messages: [],
            };

            if (analysis.code === code) {
                return result;
            }

            const exception = findException(analysis.path, exceptions);
            if (exception) {
                if (exception.code.indexOf(analysis.code) === -1) {
                    result.passed = false;
                    result.messages.push(
                        `Expected code(s)=${exception.code}, actual=${analysis.code}, url=${analysis.url}`
                    );
                }
                return result;
            }

            result.passed = false;
            result.messages.push(
                `Expected code(s)=${code}, actual=${analysis.code}, url=${analysis.url}`
            );

            return result;
        },
    };
};
