const loggerDummyChecker = require('./loggerDummyChecker');
const statusCodeChecker = require('./statusCodeChecker');
const metaRobotsChecker = require('./metaRobotsChecker');
const maxPageCountChecker = require('./maxPageCountChecker');
const robotsTxtChecker = require('./robotsTxtChecker');
const canonicalChecker = require('./canonicalChecker');
const hreflangChecker = require('./hreflangChecker');
const contentChecker = require('./contentChecker');
const snapshotChecker = require('./snapshotChecher');

module.exports = {
    loggerDummyChecker,
    statusCodeChecker,
    metaRobotsChecker,
    maxPageCountChecker,
    robotsTxtChecker,
    canonicalChecker,
    hreflangChecker,
    contentChecker,
    snapshotChecker,
};
