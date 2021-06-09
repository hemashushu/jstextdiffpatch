const {TextSelection} = require('jstextselection');
const { TextChange, ChangeType, CursorPatch, TextDiffPatch } = require('../index');
const { ObjectUtils } = require('jsobjectutils');

const assert = require('assert/strict')

describe('CursorPatch Test', () => {
    it('Test insert on collapsed cursor', () => {
        let selection1 = new TextSelection(3);

        // 0 1 2 3 4 5 6 7 8 9    <-- text and index
        //0 1 2 3 4 5 6 7 8 9 10  <-- cursor position
        //      ^--------- current collapsed cursor

        let textChanges1 = [new TextChange(4, ChangeType.added, 'abc')];
        let r1 = CursorPatch.apply(selection1, textChanges1); // 在光标之后插入文本
        assert(ObjectUtils.objectEquals(r1, new TextSelection(3))); // 光标保持不变

        let textChanges2 = [new TextChange(2, ChangeType.added, 'abc')];
        let r2 = CursorPatch.apply(selection1, textChanges2); // 在光标之前插入文本
        assert(ObjectUtils.objectEquals(r2, new TextSelection(6))); // 光标后移

        let textChanges3 = [new TextChange(3, ChangeType.added, 'abc')];
        let r3 = CursorPatch.apply(selection1, textChanges3); // 在光标处插入文本
        assert(ObjectUtils.objectEquals(r3, new TextSelection(6))); // 光标后移
    });

    it('Test insert on expand cursor', () => {
        let selection1 = new TextSelection(3, 7);

        // 0 1 2 3 4 5 6 7 8 9    <-- text and index
        //0 1 2 3 4 5 6 7 8 9 10  <-- cursor position
        //      ^       ^
        //      |       |
        // sel. start  end, sel text: '3456'

        let textChanges1 = [new TextChange(8, ChangeType.added, 'abc')];
        let r1 = CursorPatch.apply(selection1, textChanges1); // 在选定之后插入文本
        assert(ObjectUtils.objectEquals(r1, new TextSelection(3, 7))); // 选定不变

        let textChanges2 = [new TextChange(2, ChangeType.added, 'abc')];
        let r2 = CursorPatch.apply(selection1, textChanges2); // 在选定之前插入文本
        assert(ObjectUtils.objectEquals(r2, new TextSelection(6, 10))); // 选定整体后移

        let textChanges3 = [new TextChange(7, ChangeType.added, 'abc')];
        let r3 = CursorPatch.apply(selection1, textChanges3); // 在选定结束位置（后边缘）插入文本
        assert(ObjectUtils.objectEquals(r3, new TextSelection(3, 7))); // 选定不变

        let textChanges4 = [new TextChange(3, ChangeType.added, 'abc')];
        let r4 = CursorPatch.apply(selection1, textChanges4); // 在选定开始位置（前边缘）插入文本
        assert(ObjectUtils.objectEquals(r4, new TextSelection(6, 10))); // 选定整体后移

        let textChanges5 = [new TextChange(5, ChangeType.added, 'abc')];
        let r5 = CursorPatch.apply(selection1, textChanges5); // 在选定中间插入文本
        assert(ObjectUtils.objectEquals(r5, new TextSelection(3, 10))); // 选定扩大（选定的结束位置后移）
    });

    it('Test delete on collapsed cursor', () => {
        let selection1 = new TextSelection(3);

        // 0 1 2 3 4 5 6 7 8 9    <-- text and index
        //0 1 2 3 4 5 6 7 8 9 10  <-- cursor position
        //      ^--------- current collapsed cursor

        let textChanges1 = TextDiffPatch.diff('0123456789', '0123789'); // 删除 '456'
        assert(ObjectUtils.arrayEquals(textChanges1, [new TextChange(4, ChangeType.removed, '456')]));
        let r1 = CursorPatch.apply(selection1, textChanges1); // 删除的文本在光标之后
        assert(ObjectUtils.objectEquals(r1, new TextSelection(3))); // 光标保持不变

        let textChanges2 = TextDiffPatch.diff('0123456789', '3456789'); // 删除 '012'
        assert(ObjectUtils.arrayEquals(textChanges2, [new TextChange(0, ChangeType.removed, '012')]));
        let r2 = CursorPatch.apply(selection1, textChanges2); // 删除的文本在光标之前
        assert(ObjectUtils.objectEquals(r2, new TextSelection(0))); // 光标前移

        let textChanges3 = TextDiffPatch.diff('0123456789', '056789'); // 删除 '1234'
        assert(ObjectUtils.arrayEquals(textChanges3, [new TextChange(1, ChangeType.removed, '1234')]));
        let r3 = CursorPatch.apply(selection1, textChanges3); // 删除的文本涵盖光标
        assert(ObjectUtils.objectEquals(r3, new TextSelection(1))); // 光标前移
    });

    it('Test delete on expand cursor', () => {
        let selection1 = new TextSelection(3, 7);

        // 0 1 2 3 4 5 6 7 8 9    <-- text and index
        //0 1 2 3 4 5 6 7 8 9 10  <-- cursor position
        //      ^       ^
        //      |       |
        // sel. start  end, sel text: '3456'

        let textChanges1 = TextDiffPatch.diff('0123456789', '01234567'); // 删除 '89'
        let r1 = CursorPatch.apply(selection1, textChanges1); // 删除的文本在选定之后
        assert(ObjectUtils.objectEquals(r1, new TextSelection(3, 7))); // 选定不变

        let textChanges2 = TextDiffPatch.diff('0123456789', '23456789'); // 删除 '01'
        let r2 = CursorPatch.apply(selection1, textChanges2); // 删除的文本在选定之前
        assert(ObjectUtils.objectEquals(r2, new TextSelection(1, 5))); // 选定整体前移

        // 删除的文本的开始位置在选定的开始之前

        let textChangesB1 = TextDiffPatch.diff('0123456789', '03456789'); // 删除 '12'
        let rB1 = CursorPatch.apply(selection1, textChangesB1); // 删除文本的结束位置在选定的开始位置。（即删除的文本在选定的前边缘）
        assert(ObjectUtils.objectEquals(rB1, new TextSelection(1, 5))); // 选定整体前移

        let textChangesB2 = TextDiffPatch.diff('0123456789', '056789'); // 删除 '1234'
        let rB2 = CursorPatch.apply(selection1, textChangesB2); // 删除文本的结束位置在选定的中间
        assert(ObjectUtils.objectEquals(rB2, new TextSelection(1, 3))); // 选定前移&缩小

        let textChangesB3 = TextDiffPatch.diff('0123456789', '0789'); // 删除 '123456'
        let rB3 = CursorPatch.apply(selection1, textChangesB3); // 删除文本的结束位置在选定的结束位置
        assert(ObjectUtils.objectEquals(rB3, new TextSelection(1, 1))); // 选定前移&缩小

        let textChangesB4 = TextDiffPatch.diff('0123456789', '09'); // 删除 '12345678'
        let rB4 = CursorPatch.apply(selection1, textChangesB4); // 删除文本的结束位置在选定的结束之后
        assert(ObjectUtils.objectEquals(rB4, new TextSelection(1, 1))); // 选定前移&缩小

        // 删除的文本的开始位置在选定的开始位置

        let textChangesS1 = TextDiffPatch.diff('0123456789', '01256789'); // 删除 '34'
        let rS1 = CursorPatch.apply(selection1, textChangesS1); // 删除文本的结束位置在选定的中间
        assert(ObjectUtils.objectEquals(rS1, new TextSelection(3, 5))); // 选定缩小

        let textChangesS2 = TextDiffPatch.diff('0123456789', '012789'); // 删除 '3456'
        let rS2 = CursorPatch.apply(selection1, textChangesS2); // 删除文本的结束位置在选定的结束位置
        assert(ObjectUtils.objectEquals(rS2, new TextSelection(3, 3))); // 选定缩小

        let textChangesS3 = TextDiffPatch.diff('0123456789', '0129'); // 删除 '345678'
        let rS3 = CursorPatch.apply(selection1, textChangesS3); // 删除文本的结束位置在选定的后面
        assert(ObjectUtils.objectEquals(rS3, new TextSelection(3, 3))); // 选定缩小

        // 删除的文本的开始位置在选定的中间位置

        let textChangesM1 = TextDiffPatch.diff('0123456789', '012346789'); // 删除 '5'
        let rM1 = CursorPatch.apply(selection1, textChangesM1); // 删除文本的结束位置在选定的中间
        assert(ObjectUtils.objectEquals(rM1, new TextSelection(3, 6))); // 选定缩小

        let textChangesM2 = TextDiffPatch.diff('0123456789', '01234789'); // 删除 '56'
        let rM2 = CursorPatch.apply(selection1, textChangesM2); // 删除文本的结束位置在选定的结束位置
        assert(ObjectUtils.objectEquals(rM2, new TextSelection(3, 5))); // 选定缩小

        let textChangesM3 = TextDiffPatch.diff('0123456789', '012349'); // 删除 '5678'
        let rM3 = CursorPatch.apply(selection1, textChangesM3); // 删除文本的结束位置在选定的后面
        assert(ObjectUtils.objectEquals(rM3, new TextSelection(3, 5))); // 选定缩小

        // 删除的文本的开始位置在选定的结束位置。（即删除的文本在选定的后边缘）
        let textChangesE1 = TextDiffPatch.diff('0123456789', '01234569'); // 删除 '78'
        let rE1 = CursorPatch.apply(selection1, textChangesE1); // 删除的文本在选定的结束位置。（即删除的文本在选定的后边缘）
        assert(ObjectUtils.objectEquals(rE1, new TextSelection(3, 7))); // 选定不变
    });

});