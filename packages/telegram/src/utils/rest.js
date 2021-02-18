const axios = require('axios');
const BotError = require('./error');
const {
  HTTP_STATUS: {
    BAD_GATEWAY
  }
} = require('./constants');

// Send HTTP request
module.exports.request = async (
  baseURL,
  apiPath,
  method,
  data,
  auth
) => {
  const url = `${baseURL}${apiPath}`;
  const timeout = 10000;

  // COnfigure connection timeout handler
  const cancelTokenSource = axios.CancelToken.source();
  let connectionTimeout = setTimeout(
    () => cancelTokenSource
      .cancel(
        `Cannot connect to the source: ${baseURL}${apiPath}`
      ),
    timeout
  );

  try {
    // Make a call
    const response = await axios({
      url,
      method,
      timeout,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip,deflate',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...(
          method !== 'get'
            ? { 'Content-Type': 'application/json' }
            : {}
        ),
        ...(
          auth && auth.method === 'headers'
            ? auth.data
            : {}
        )
      },
      data: {
        ...data,
        ...(
          auth && auth.method === 'body'
            ? auth.data
            : {}
        )
      },
      cancelToken: cancelTokenSource.token
    });

    clearTimeout(connectionTimeout);

    return response.data;
  } catch (error) {

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);

    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

    throw new BotError(
      error.message,
      BAD_GATEWAY
    );
  }
};
