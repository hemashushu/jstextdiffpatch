const { TextSelection } = require('jstextselection');

const ChangeType = require('./changetype');

class CursorPatch {

    /**
     * 计算文本更改之后的光标的新位置
     *
     * 光标改变的规则：
     * - 对于折叠的光标
     *   - 在光标之后插入文本，光标保持不变
     *   - 在光标之前插入文本，光标后移
     *   - 在光标处插入文本，光标后移
     *   - 删除的文本在光标之后，光标保持不变
     *   - 删除的文本在光标之前，光标前移
     *   - 删除的文本涵盖光标，光标前移
     *
     * - 对于展开的光标
     *   - 在选定之后插入文本，选定不变
     *   - 在选定之前插入文本，选定整体后移
     *   - 在选定结束位置（后边缘）插入文本，选定不变
     *   - 在选定开始位置（前边缘）插入文本，选定整体后移
     *   - 在选定中间插入文本， 选定扩大（选定的结束位置后移）
     *   - 删除的文本在选定之后，选定不变
     *   - 删除的文本在选定之前，选定整体前移
     *   - 删除的文本的开始位置在选定的开始之前
     *     - 删除文本的结束位置在选定的开始位置。（即删除的文本在选定的前边缘）
     *       选定整体前移
     *     - 删除文本的结束位置在选定的中间，选定前移&缩小
     *     - 删除文本的结束位置在选定的结束位置，选定前移&缩小
     *     - 删除文本的结束位置在选定的结束之后，选定前移&缩小
     *   - 删除的文本的开始位置在选定的开始位置
     *     - 删除文本的结束位置在选定的中间，选定缩小
     *     - 删除文本的结束位置在选定的结束位置，选定缩小
     *     - 删除文本的结束位置在选定的后面，选定缩小
     *   - 删除的文本的开始位置在选定的中间位置
     *     - 删除文本的结束位置在选定的中间，选定缩小
     *     - 删除文本的结束位置在选定的结束位置，选定缩小
     *     - 删除文本的结束位置在选定的后面，选定缩小
     *   - 删除的文本的开始位置在选定的结束位置。（即删除的文本在选定的后边缘）
     *     选定不变
     *
     * @param {*} lastSelection 文本更改之前的光标位置（即原光标位置）
     * @param {*} textChanges TextChange 对象数组，文本改变情况
     * @returns
     */
    static apply(lastSelection, textChanges) {
        // 光标的新位置
        let selection = new TextSelection(
            lastSelection.start,
            lastSelection.end);

        for (let textChange of textChanges) {

            if (textChange.changeType === ChangeType.added) {
                let insertPosition = textChange.position; // 索引包括
                let length = textChange.text.length;

                if (insertPosition <= selection.start) {
                    // 断定插入的文本在 lastSelection 之前
                    selection.start += length;
                    selection.end += length;
                } else if (insertPosition < selection.end) {
                    // 断定插入的文本在 lastSelection 之间
                    selection.end += length;
                } else {
                    // 断定插入的文本在 lastSelection 之后
                    // 光标不需改变
                }

            } else if (textChange.changeType === ChangeType.removed) {
                let removeStartPosition = textChange.position; // 索引包括
                let length = textChange.text.length;
                let removeEndPosition = removeStartPosition + length - 1; // 索引包括

                if (removeEndPosition < selection.start) {
                    // 断定删除的文本在 lastSelection 之前
                    selection.start -= length;
                    selection.end -= length;
                } else if (removeStartPosition < selection.end) {
                    if (removeStartPosition < selection.start) {
                        // 断定删除的文本部分在 lastSelection 之前开始，直到 lastSelection 当中（或之后）
                        selection.start = removeStartPosition;
                        if (removeEndPosition > selection.end) {
                            // 整个 lastSelection 都被删除
                            selection.end = removeStartPosition;
                        } else {
                            // 部分 lastSelection 被删除
                            let remainTextLength = selection.end - removeEndPosition - 1;
                            selection.end = removeStartPosition + remainTextLength;
                        }
                    } else {
                        // 断定删除的文本部分在 lastSelection 中间开始，直到 lastSelection 结束（或之后）
                        if (removeEndPosition > selection.end) {
                            selection.end = removeStartPosition;
                        } else {
                            selection.end -= length;
                        }
                    }
                } else {
                    // 断定删除的文本在 lastSelection 之后
                    // 光标不需改变
                }
            }
        }

        return selection;
    }
}

module.exports = CursorPatch;