const path = require('path');
const fs = require('fs');

const ensurePathExists = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensurePathExists(dirname);
    fs.mkdirSync(dirname);
};

module.exports = ensurePathExists;
