const noMemoryLeakStrCopy = (value) => (' ' + value).slice(1);

module.exports = noMemoryLeakStrCopy;
