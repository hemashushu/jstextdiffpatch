const ChangeType = require('./src/changetype');
const CleanupType = require('./src/cleanuptype');
const CursorPatch = require('./src/cursorpatch');
const LineChange = require('./src/linechange');
const TextChange = require('./src/textchange');
const TextDiffPatch = require('./src/textdiffpatch');

module.exports = {
    ChangeType: ChangeType,
    CleanupType: CleanupType,
    CursorPatch: CursorPatch,
    LineChange: LineChange,
    TextChange: TextChange,
    TextDiffPatch: TextDiffPatch
};
