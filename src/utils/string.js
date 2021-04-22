// Make short string version with ellipsis
module.exports.withEllipsis = (str, length) => str.length > length
  ? `${str.substr(0, length)}…`
  : str;

// Extract host name from the URL
module.exports.extractHostname = url => {
  try {
    return (new URL(url).hostname).replace('www.', '');
  } catch(error) {
    console.error(error);
    return url;
  }
};
