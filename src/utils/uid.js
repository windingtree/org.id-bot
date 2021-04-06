// Simple unique ID generator
module.exports.getUid = () => Math.random().toString(36).substr(2, 9);
