const DiffMatchPatch = require('diff-match-patch');
const dmp = new DiffMatchPatch();

const ChangeType = require('./changetype');
const CleanupType = require('./cleanuptype');
const LineChange = require('./linechange');
const TextChange = require('./textchange');

/**
 * 文本的比较和补丁
 *
 * 本库对 google-diff-match-patch 库进行简单的封装，提供更为简单易用
 * 的接口。
 * google-diff-match-patch 库的仓库地址：
 * https://github.com/google/diff-match-patch
 *
 * 关于文本比较算法的资料：
 *
 * - Difference Algorithm
 *   https://neil.fraser.name/software/diff_match_patch/myers.pdf
 *
 * - An O(ND) Difference Algorithm and Its Variations (1986)
 *   http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 *
 * - Neil Fraser: News: Prefix Matching
 *   https://neil.fraser.name/news/2007/10/09/
 *
 * - Diff Strategies
 *   https://neil.fraser.name/writing/diff/
 *
 * 因为原始库同时还提供了多种编程语言的实现，并不适合直接用于导入
 * Node.js 项目，所以这里使用的是第三方重新打包的版本：
 * https://github.com/JackuB/diff-match-patch
 *
 * 另外还有一个重新打包的版本：
 * https://github.com/jhchen/fast-diff
 *
 * google-diff-match-patch 库的源码成型较早（2007年左右），所以有较为现代的
 * 其他实现可供参考：
 *
 * - https://github.com/kpdecker/jsdiff (这个库似乎有点性能问题)
 * - https://github.com/prettydiff/prettydiff
 *
 */
class TextDiffPatch {

    /**
     * 计算两个字符串的变化
     *
     * @param {*} sourceText 原始文本
     * @param {*} modifiedText 修改后的文本
     * @param {*} cleanupType 对比较结果清理（合并）的方式。
     *     如果不对比较结果进行合并，有时结果会比较零碎，比如 'a1b2c3' 和 'a7b8c9' 比较
     *     结果将会是 -1 +7 -2 +8 -3 +9，如果使用 CleanupType.efficiency 方式合并，则
     *     结果将会是 -1b2c3 +7b8c9，合并之后更便于人类阅读。
     * @returns 返回 TextChange 对象数组，即 [TextChange, ...]
     */
    static diff(sourceText, modifiedText, cleanupType = CleanupType.efficiency) {
        let diffItems = dmp.diff_main(sourceText, modifiedText);

        // google-diff-match-patch 库的基本 API，这里摘录下来以便参考：
        // https://github.com/google/diff-match-patch/wiki/API
        //
        //
        // ## diff_main(text1, text2) 返回 diffs
        //
        // An array of differences is computed which describe the transformation of text1 into text2.
        // Each difference is an array (JavaScript, Lua) or tuple (Python) or Diff object (C++, C#, Objective C, Java).
        // The first element specifies if it is an insertion (1), a deletion (-1) or an equality (0).
        // The second element specifies the affected text.
        //
        // diff_main("Good dog", "Bad dog") 返回 [(-1, "Goo"), (1, "Ba"), (0, "d dog")]
        //
        // Despite the large number of optimisations used in this function, diff can take a while to compute.
        // The diff_match_patch.Diff_Timeout property is available to set how many seconds any diff's
        // exploration phase may take. The default value is 1.0. A value of 0 disables the timeout
        // and lets diff run until completion. Should diff timeout, the return value will still be
        // a valid difference, though probably non-optimal.
        //
        // ## diff_cleanupSemantic(diffs) 返回 null
        //
        // A diff of two unrelated texts can be filled with coincidental matches. For example,
        // the diff of "mouse" and "sofas" is
        // [(-1, "m"), (1, "s"), (0, "o"), (-1, "u"), (1, "fa"), (0, "s"), (-1, "e")].
        // While this is the optimum diff, it is difficult for humans to understand. Semantic cleanup rewrites
        // the diff, expanding it into a more intelligible format. The above example would become:
        // [(-1, "mouse"), (1, "sofas")]. If a diff is to be human-readable,
        // it should be passed to diff_cleanupSemantic.
        //
        // ## diff_cleanupEfficiency(diffs) 返回 null
        //
        // This function is similar to diff_cleanupSemantic, except that instead of optimising a diff to
        // be human-readable, it optimises the diff to be efficient for machine processing.
        // The results of both cleanup types are often the same.
        //
        // The efficiency cleanup is based on the observation that a diff made up of large numbers of small
        // diffs edits may take longer to process (in downstream applications) or take more capacity
        // to store or transmit than a smaller number of larger diffs. The diff_match_patch.Diff_EditCost
        // property sets what the cost of handling a new edit is in terms of handling extra characters
        // in an existing edit. The default value is 4, which means if expanding the length of a diff
        // by three characters can eliminate one edit, then that optimisation will reduce the total costs.

        switch (cleanupType) {
            case CleanupType.none:
                // 不清理合并
                break;

            case CleanupType.semantic:
                dmp.diff_cleanupSemantic(diffItems);
                break;

            case CleanupType.efficiency:
                dmp.diff_cleanupEfficiency(diffItems);
                break;
        }

        // diff_main() 方法返回的是一个数组，结构如下：
        //
        //   [change1, change2, change3, ...]
        //
        // 其中的 'change' 的结构如下：
        //
        //   [type, text]
        //
        // 其中的 'type' 表示更改的类型：
        //
        // -  0: 没改变，常量为 DIFF_EQUAL
        // - -1: 被删除，常量为 DIFF_DELETE
        // -  1: 新增加，常量为 DIFF_INSERT
        //
        //
        // 比如下面数组：
        //
        // [
        //   [DIFF_DELETE, 'Hello'],
        //   [DIFF_INSERT, 'Goodbye'],
        //   [DIFF_EQUAL, ' world.']
        // ]
        //
        // 意味着：删除了 'Hello', 新增了 'Goodbye'， ' world.' 保持不变
        //
        // 方法返回的结果比较零散，为了便于人类阅读，diff_cleanupSemantic() 方法
        // 可以将大量零散的小量的改变合并为较大的改变，比如
        // 比较 'a1b2c3' 和 'a7b8c9'
        // 结果将会是 -1 +7 -2 +8 -3 +9，如果使用 CleanupType.efficiency 方式合并，则
        // 结果将会是 -1b2c3 +7b8c9
        //
        // diff_cleanupSemantic() 合并得更多一些，虽然更便于阅读理解，但会有
        // 较多冗余的信息，所以默认使用 diff_cleanupEfficiency() 比较平衡。

        const DIFF_DELETE = -1;
        const DIFF_INSERT = 1;
        const DIFF_EQUAL = 0;

        let textChanges = [];   // 记录改变过（增加或删除部分）的情况，忽略没有变化的部分
        let sourcePosition = 0; // 原始文本的位置

        for (let diffItem of diffItems) {
            let diffType = diffItem[0];
            let text = diffItem[1];

            if (diffType === DIFF_INSERT) {
                // 有新增加文本
                let textChange = new TextChange(sourcePosition, ChangeType.added, text);
                textChanges.push(textChange);

                // 因为新增加的文本是在目标文本上进行的，所以源文本位置保持不变

            } else if (diffType === DIFF_DELETE) {
                // 有文本被删除
                let textChange = new TextChange(sourcePosition, ChangeType.removed, text);
                textChanges.push(textChange);

                // 因为文本是在源文本上被删除的，所以源文本的位置要向前推进
                sourcePosition += text.length;

            } else {
                // (type === DIFF_EQUAL)
                // 有文本保持不变
                // 源文本的位置和目标文本的位置都应该同时向前推进，不过因为我们只
                // 对源文本位置感兴趣，所以这里只让源文本的位置向前推进
                sourcePosition += text.length;

            }
        }

        return textChanges;
    }

    /**
     * 以行模式比较两个字符串的变化
     *
     * @param {*} sourceText
     * @param {*} modifiedText
     * @returns
     */
    static diffLine(sourceText, modifiedText) {
        let ltc = dmp.diff_linesToChars_(sourceText, modifiedText);

        let lineText1 = ltc.chars1;
        let lineText2 = ltc.chars2;
        let lineArray = ltc.lineArray;
        let diffItems = dmp.diff_main(lineText1, lineText2, false);

        dmp.diff_charsToLines_(diffItems, lineArray);

        const DIFF_DELETE = -1;
        const DIFF_INSERT = 1;
        const DIFF_EQUAL = 0;

        let lineChanges = []; // 记录行改变过（增加或删除部分）的情况，忽略没有变化的部分
        let sourceLineIndex = 0;     // 原始文本行索引

        for (let diffItem of diffItems) {
            let diffType = diffItem[0];
            let text = diffItem[1];

            if (diffType === DIFF_INSERT) {
                // 有新增加行
                let lineChange = new LineChange(sourceLineIndex, ChangeType.added, text);
                lineChanges.push(lineChange);

                // 因为新增加的文本是在目标文本上进行的，所以源文本位置保持不变

            } else if (diffType === DIFF_DELETE) {
                // 有文本被删除
                let lineChange = new LineChange(sourceLineIndex, ChangeType.removed, text);
                lineChanges.push(lineChange);

                // 因为文本是在源文本上被删除的，所以源文本的位置要向前推进
                sourceLineIndex += 1;

            } else {
                // (type === DIFF_EQUAL)
                // 有文本保持不变
                // 源文本的位置和目标文本的位置都应该同时向前推进，不过因为我们只
                // 对源文本位置感兴趣，所以这里只让源文本的位置向前推进
                sourceLineIndex += 1;

            }
        }

        return lineChanges;
    }

    /**
     * 反转 TextChange 集合。
     *
     * 这个方法用于还原（un-patch）文本，比如文本编辑器的 Undo 功能。
     *
     * 显然，将 TextChange 集合反转 2 次会得到原始的 TextChange 集合，即
     * reverse(reverse(textChanges)) == textChanges
     *
     * @param {*} textChanges
     * @returns
     */
    static reverse(textChanges) {
        let reverseTextChanges = [];

        // 被删除/添加的字符个数计数器，用于计算在文本变化的过程中，目标文本
        // 发生改变的位置。即：
        // positionInModifiedText = sourcePosition - removedCharCount + addedCharCount

        let removedCharCount = 0;
        let addedCharCount = 0;

        for (let idx = 0; idx < textChanges.length; idx++) {
            let textChange = textChanges[idx];
            let positionInModifiedText = textChange.position - removedCharCount + addedCharCount;

            if (textChange.changeType === ChangeType.removed) {
                reverseTextChanges.push(new TextChange(
                    positionInModifiedText, ChangeType.added, textChange.text));

                removedCharCount += textChange.text.length;

            } else if (textChange.changeType === ChangeType.added) {
                reverseTextChanges.push(new TextChange(
                    positionInModifiedText, ChangeType.removed, textChange.text));

                addedCharCount += textChange.text.length;
            }
        }

        return reverseTextChanges;
    }

    /**
     * 对源文本应用 TextChange 集合，得到改变后的文本，相当于 patch 功能。
     *
     * @param {*} sourceText
     * @param {*} textChanges
     * @returns
     */
    static apply(sourceText, textChanges) {
        let stringBuffer = [];        // the new string buffer.
        let sourcePosition = 0; // the position in the original text.

        // 构造目标文本的方法：
        // 累加 “新增的” 和 “未改变的” 文本，跳过 “被删除的” 文本

        for (let idx = 0; idx < textChanges.length; idx++) {
            let change = textChanges[idx];

            if (change.position !== sourcePosition) {
                // 在当前 TextChange 之前，有一段 “未改变的” 文本
                let length = change.position - sourcePosition;
                stringBuffer.push(sourceText.substr(sourcePosition, length));
                sourcePosition += length;
            }

            if (change.changeType === ChangeType.added) {
                // 累加 “新增的” 文本
                stringBuffer.push(change.text);

            } else if (change.changeType === ChangeType.removed) {
                // 跳过 “被删除的” 文本
                sourcePosition += change.text.length;
            }
        }

        if (sourcePosition !== sourceText.length) {
            // 在最后一个 TextChange 到源文本末尾之间，还有一段 “未改变的” 文本。
            stringBuffer.push(sourceText.substring(sourcePosition, sourceText.length));
        }

        return stringBuffer.join('');
    }
}

module.exports = TextDiffPatch;
