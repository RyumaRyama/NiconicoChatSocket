const request = require('request');
const cheerio = require('cheerio');

const getWssUrl = async () => {
  const url = '';
  var wssUrl = '';

  await request({uri: url}, (error, response, body) => {
    const $ = cheerio.load(body);
    const embeddedData = JSON.parse($('#embedded-data').attr('data-props'));
    wssUrl = embeddedData.site.relive.webSocketUrl; // websocketのurl
    console.log(wssUrl);
  });
  return wssUrl;
};
