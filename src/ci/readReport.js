const fs = require('fs');
const csv = require('csv-parse/lib/sync');

module.exports = (fullFileName) => {
    try {
        const content = fs.readFileSync(fullFileName);
        return csv(content, { columns: true });
    } catch {
        return [];
    }
};
