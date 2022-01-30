const fs = require('fs');

const ensurePathExists = require('./ensurePathExists');

module.exports = (fullFileName, header, report) => {
    ensurePathExists(fullFileName);
    report.sort((u1, u2) => u1.url < u2.url);

    const headerContent = header.join(',');

    const content = report.map((item) => header.map((column) => item[column]).join(',')).join('\n');
    fs.writeFileSync(fullFileName, headerContent + '\n' + content);
};
