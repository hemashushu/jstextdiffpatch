/**
 * 文本的改变情况
 */
class TextChange {
    /**
     *
     * @param {*} position 在原始文本当中的位置
     * @param {*} changeType 文本的改变类型，ChangeType 数据类型
     * @param {*} text 改变的文本
     */
	constructor(position, changeType, text) {
		this.position = position;
		this.changeType = changeType;
		this.text = text;
	}
}

module.exports = TextChange;