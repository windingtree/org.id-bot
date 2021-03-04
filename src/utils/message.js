// Send long message splitted by chunks
const replayWithSplit = (ctx, message) => Promise.all(
  message
    .match(/(.|[\r\n]){1,4095}/gm)
    .map(
      m => ctx.reply(
        `${m}\n`,
        {
          disable_web_page_preview: true
        }
      )
    )
);
module.exports.replayWithSplit = replayWithSplit;

