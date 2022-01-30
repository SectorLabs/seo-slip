const buildItemData = ({ code, path, url, content, headers, stateData } = {}) => {
    const queueItem = {
        stateData: {
            ...(stateData || {}),
            code: code || 200,
        },
        url: url || `https://www.site.com${path}`,
        path: path || '',
    };

    const responseBody = content || '';

    const response = {
        headers: headers || { 'content-type': 'text/html' },
    };

    return { queueItem, responseBody, response };
};

module.exports = buildItemData;
