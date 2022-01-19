const isHtmlDocument = (responseBody, response) => {
    return (
        responseBody &&
        typeof responseBody === 'string' &&
        response &&
        /^text\/html/.test(response.headers['content-type'])
    );
};

module.exports = isHtmlDocument;
