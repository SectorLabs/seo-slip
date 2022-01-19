const https = require('https');

const downloadRobotsTxt = (robotsTxtUrl) => {
    const options = { headers: { 'User-Agent': 'curl/7.64.1' } };
    return new Promise((resolve, reject) => {
        https
            .get(robotsTxtUrl, options, (res) => {
                const { statusCode } = res;
                const contentType = res.headers['content-type'];

                let error;
                const expectedContentType = /^text\/plain/;
                if (statusCode !== 200) {
                    error = new Error(
                        `Request to ${robotsTxtUrl} failed. Status code: ${statusCode}`
                    );
                } else if (!expectedContentType.test(contentType)) {
                    error = new Error(
                        `Invalid content-type of ${robotsTxtUrl}. Expected ${expectedContentType} but received ${contentType}`
                    );
                }
                if (error) {
                    console.error(error.message);
                    // Consume response data to free up memory
                    res.resume();
                    reject(error);
                    return;
                }

                res.setEncoding('utf8');
                let robotsTxtContent = '';
                res.on('data', (chunk) => {
                    robotsTxtContent += chunk;
                });
                res.on('end', () => {
                    resolve(robotsTxtContent);
                });
            })
            .on('error', (e) => {
                reject(new Error(`Got error: ${e.message}`));
            });
    });
};

module.exports = downloadRobotsTxt;
