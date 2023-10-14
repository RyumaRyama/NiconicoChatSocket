const WebSocket = require('ws');
const request = require('request');
const cheerio = require('cheerio');

const getWssUrl = () => {
  return new Promise(function (resolve, reject) {
    const url = '';
    request({uri: url}, (error, response, body) => {
      const $ = cheerio.load(body);
      const embeddedData = JSON.parse($('#embedded-data').attr('data-props'));
      const wssUrl = embeddedData.site.relive.webSocketUrl; // websocketのurl
      resolve(wssUrl);
    });
  });
};

// 接続情報関連
let uri_comment;
let threadID;
let mes_comment;

getWssUrl().then((wssUrl) => {
  console.log(wssUrl);
  const ws = new WebSocket(wssUrl, 'niconama', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    },
  });

  ws.onopen = async () => {
    const message_system_1 = '{"type":"startWatching","data":{"stream":{"quality":"abr","protocol":"hls","latency":"low","chasePlay":false},"room":{"protocol":"webSocket","commentable":true},"reconnect":false}}';
    const message_system_2 = '{"type":"getAkashic","data":{"chasePlay":False}}';
    await doSend_system(message_system_1);
    await doSend_system(message_system_2);
  }

  ws.onmessage = async (evt) => {
    is_room = evt.data.indexOf("room");
    is_ping = evt.data.indexOf("ping");

    if (is_room > 0) {
      console.log("RESPONSE FROM THE SYSTEM SERVER: " + evt.data);
      // 必要な情報を送られてきたメッセージから抽出
      evt_data_json = JSON.parse(evt.data);
      uri_comment = evt_data_json.data.messageServer.uri;
      threadID = evt_data_json.data.threadId;
      message_comment =
        '[{"ping":{"content":"rs:0"}},{"ping":{"content":"ps:0"}},{"thread":{"thread":"' +
        threadID +
        '","version":"20061206","user_id":"guest","res_from":-150,"with_global":1,"scores":1,"nicoru":0}},{"ping":{"content":"pf:0"}},{"ping":{"content":"rf:0"}}]';
      // コメントセッションとのWebSocket接続を開始
      connect_WebSocket_comment();
    }

    // pingが送られてきたらpongとkeepseatを送り、視聴権を獲得し続ける
    if (is_ping > 0) {
      await ws.send('{"type":"pong"}');
      await ws.send('{"type":"keepSeat"}');
      console.log("ping");
    }
  };

  const doSend_system = async (message) => {
    console.log("SENT TO THE SYSTEM SERVER: " + message);
    await ws.send(message);
  }
});

const connect_WebSocket_comment = () => {
  websocket_comment = new WebSocket(uri_comment, "niconama", {
    headers: {
      "Sec-WebSocket-Extensions":
        "permessage-deflate; client_max_window_bits",
      "Sec-WebSocket-Protocol": "msg.nicovideo.jp#json",
    },
  });
  websocket_comment.onopen = () => {
    websocket_comment.send(message_comment);
  };
  websocket_comment.onclose = (evt) => {
    // 再接続ロジックほしい
  };
  websocket_comment.onmessage = (evt) => {
    //コメント部分のみを抽出
    const comment = JSON.parse(evt.data).chat?.content;
    //コメントを出力
    if (comment != undefined) {
      console.log(comment);
    }
  };
}
