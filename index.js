const ChangeType = require('./src/changetype');
const CleanupType = require('./src/cleanuptype');
const LineChange = require('./src/linechange');
const TextChange = require('./src/textchange');
const TextDiffPatch = require('./src/textdiffpatch');

module.exports = {
    ChangeType: ChangeType,
    CleanupType: CleanupType,
    LineChange: LineChange,
    TextChange: TextChange,
    TextDiffPatch: TextDiffPatch
};
