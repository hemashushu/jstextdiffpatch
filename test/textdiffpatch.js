const { ChangeType,
    CleanupType,
    LineChange,
    TextChange,
    TextDiffPatch } = require('../index');

const assert = require('assert/strict')
const { ObjectUtils } = require('jsobjectutils');

describe('TextDiffPatch Test', () => {
    it('Test diff()', () => {
        let text1 = 'hello foo';
        let text2 = 'hello bar';
        let textChanges1 = TextDiffPatch.diff(text1, text2);

        assert.equal(2, textChanges1.length);

        assert(ObjectUtils.objectEquals(textChanges1[0],
            new TextChange(6, ChangeType.removed, 'foo')));

        assert(ObjectUtils.objectEquals(textChanges1[1],
            new TextChange(9, ChangeType.added, 'bar')));

        let text3 = 'abc d1e2f3 xyz';
        let text4 = 'abc d7e8f9 xyz opq';
        let textChanges2 = TextDiffPatch.diff(text3, text4);

        // 比较结果有合并，所以 textChange2 的元素只有 2 个，一个表示
        // “删除的” 文本 '1e2f3'，一个表示 “增加的” 文本 '7e8f9'，
        // 而不是 -1 +7 -2 +8 -3 +9

        assert.equal(3, textChanges2.length);

        assert(ObjectUtils.objectEquals(textChanges2[0],
            new TextChange(5, ChangeType.removed, '1e2f3')));

        assert(ObjectUtils.objectEquals(textChanges2[1],
            new TextChange(10, ChangeType.added, '7e8f9')));

        assert(ObjectUtils.objectEquals(textChanges2[2],
            new TextChange(14, ChangeType.added, ' opq')));

        // 测试不合并比较结果
        let textChanges3 = TextDiffPatch.diff('abc d1e2f3 xyz', 'abc d7e8f9 xyz opq', CleanupType.none);

        assert.equal(7, textChanges3.length);

        assert(ObjectUtils.objectEquals(textChanges3[0],
            new TextChange(5, ChangeType.removed, '1')));

        assert(ObjectUtils.objectEquals(textChanges3[1],
            new TextChange(6, ChangeType.added, '7')));

        assert(ObjectUtils.objectEquals(textChanges3[2],
            new TextChange(7, ChangeType.removed, '2')));

        assert(ObjectUtils.objectEquals(textChanges3[3],
            new TextChange(8, ChangeType.added, '8')));

        assert(ObjectUtils.objectEquals(textChanges3[4],
            new TextChange(9, ChangeType.removed, '3')));

        assert(ObjectUtils.objectEquals(textChanges3[5],
            new TextChange(10, ChangeType.added, '9')));

        assert(ObjectUtils.objectEquals(textChanges3[6],
            new TextChange(14, ChangeType.added, ' opq')));

    });

    it('Test diffLine()', () => {
        let text1 = 'hello\nfoo\nworld';
        let text2 = 'hello\nbar\nworld';
        let lineChanges1 = TextDiffPatch.diffLine(text1, text2);

        assert.equal(2, lineChanges1.length);

        assert(ObjectUtils.objectEquals(lineChanges1[0],
            new LineChange(1, ChangeType.removed, 'foo\n')));

        assert(ObjectUtils.objectEquals(lineChanges1[1],
            new LineChange(2, ChangeType.added, 'bar\n')));

        let text3 = 'abc\nd1e2f3\nxyz\nopq1\nend';
        let text4 = 'abc\nd7e8f9\nxyz\nopq2\nend';

        let lineChanges2 = TextDiffPatch.diffLine(text3, text4);

        assert.equal(4, lineChanges2.length);

        assert(ObjectUtils.objectEquals(lineChanges2[0],
            new LineChange(1, ChangeType.removed, 'd1e2f3\n')));

        assert(ObjectUtils.objectEquals(lineChanges2[1],
            new LineChange(2, ChangeType.added, 'd7e8f9\n')));

        assert(ObjectUtils.objectEquals(lineChanges2[2],
            new LineChange(3, ChangeType.removed, 'opq1\n')));

        assert(ObjectUtils.objectEquals(lineChanges2[3],
            new LineChange(4, ChangeType.added, 'opq2\n')));
    });

    it('Test apply()', () => {
        let text1 = 'abc d1e2f3 xyz';
        let text2 = 'abc d7e8f9 xyz opq';
        let textChanges1 = TextDiffPatch.diff(text1, text2);

        let r1 = TextDiffPatch.apply(text1, textChanges1);
        assert.equal(r1, text2);
    });

    it('Test reverse()', () => {
        let text1 = 'abc d1e2f3 xyz';
        let text2 = 'abc d7e8f9 xyz opq';
        let textChanges1 = TextDiffPatch.diff(text1, text2);

        let reverse1 = TextDiffPatch.reverse(textChanges1);
        let r1 = TextDiffPatch.apply(text2, reverse1);
        assert.equal(r1, text1);
    });
});

