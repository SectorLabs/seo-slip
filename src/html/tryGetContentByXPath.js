const noMemoryLeakStrCopy = require('./noMemoryLeakStrCopy');

const textHandler = (body, locator) => {
    const textPattern = /\/text\(\)$/;
    const match = locator.match(textPattern);
    if (match) {
        const noTextLocator = locator.replace(textPattern, '');
        const elements = body.findElements(noTextLocator);
        return elements
            .map((element) => element.getText())
            .filter((text) => text)
            .map((text) => noMemoryLeakStrCopy(text || ''));
    }
    return null;
};

const attributeHandler = (body, locator) => {
    const attributePattern = /\/@([a-zA-Z:(?!@\/\[\])]+)$/;
    const match = locator.match(attributePattern);
    if (match) {
        const noAttributeLocator = locator.replace(attributePattern, '');
        const elements = body.findElements(noAttributeLocator);
        const attributeName = match[1];
        return elements
            .map((element) => element.getAttribute(attributeName))
            .filter((value) => value)
            .map((value) => noMemoryLeakStrCopy(value || ''));
    }
};

const tryGetContentByXPath = (body, locator) => {
    try {
        const content = textHandler(body, locator) || attributeHandler(body, locator) || [];
        return content;
    } catch (e) {
        console.log(e);
    }
    return [];
};

module.exports = tryGetContentByXPath;
