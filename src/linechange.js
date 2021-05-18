class LineChange {
    constructor(lineIndex, changeType, lineText) {
        this.lineIndex = lineIndex;
        this.changeType = changeType;
        this.lineText = lineText;
    }
}

module.exports = LineChange;