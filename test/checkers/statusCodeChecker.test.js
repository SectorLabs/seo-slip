const assert = require('assert');
const { statusCodeChecker } = require('../../src/checkers');

const { buildItemData, run } = require('..');

describe('statusCodeChecker', function () {
    const rules = {
        code: 200,
        exceptions: {
            '/201/path': 201,
            '/202or203/path': [202, 203],
            '/205/path/.+/regexp': {
                regexp: true,
                code: 205,
            },
            '/207or208/path/.+/regexp': {
                regexp: true,
                code: [207, 208],
            },
        },
    };

    [
        [200, '/200/path', true, []],
        [201, '/201/path', true, []],
        [
            201,
            '/201/path/no/such/exception',
            false,
            [/expected.+200.+actual.+201/i],
        ],
        [200, '/201/path', true, []],
        [202, '/202or203/path', true, []],
        [203, '/202or203/path', true, []],
        [204, '/202or203/path', false, [/expected.+202,203.+actual.+204/i]],
        [200, '/202or203/path', true, []],
        [205, '/205/path/anything/regexp', true, []],
        [
            206,
            '/205/path/anything/regexp',
            false,
            [/expected.+205.+actual.+206/i],
        ],
        [200, '/205/path/anything/regexp', true, []],
        [207, '/207or208/path/anything/regexp', true, []],
        [208, '/207or208/path/anything/regexp', true, []],
        [
            209,
            '/207or208/path/anything/regexp',
            false,
            [/expected.+207,208.+actual.+209/i],
        ],
        [200, '/207or208/path/anything/regexp', true, []],
    ].forEach(([code, path, passed, messagePatterns]) => {
        it(`should check the ${code} status code of ${path}`, function () {
            const itemData = buildItemData({ code, path });

            const { report, result } = run(statusCodeChecker(rules), itemData);

            assert.equal(report.code, code);
            assert.equal(report.path, path);

            assert.equal(result.passed, passed);
            messagePatterns.forEach((messagePattern, index) => {
                assert.match(result.messages[index], messagePattern);
            });
        });
    });
});
