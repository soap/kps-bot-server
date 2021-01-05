'use strict';

const express = require('express');
const bodyParser = require('body-parser')
const middleware = require('@line/bot-sdk').middleware
const JSONParseError = require('@line/bot-sdk').JSONParseError
const SignatureValidationFailed = require('@line/bot-sdk').SignatureValidationFailed
//const AIMLInterpreter = require('aimlinterpreter')
const AIMLParser = require('aimlparser')
const { channelAccessToken, channelSecret } = require('./config');
const lineClient = require('@line/bot-sdk').Client;
const port = process.env.PORT || 4000;

//const aimlInterpreter = new AIMLInterpreter({ name: 'KPSBot' })
const aimlParser = new AIMLParser({ name:'KPSBot' })

aimlParser.load(['./alice.aiml'])

//aimlInterpreter.loadAIMLFilesIntoArray(['./currencies.aiml'])

const config = {
    channelAccessToken: channelAccessToken,
    channelSecret: channelSecret
}

const client = new lineClient(config);
const app = express();
app.use(middleware(config));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// webhook callback
app.post('/webhook', (req, res) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  // handle events separately
  Promise.all(req.body.events.map(event => {
    console.log('event', event);
    // check verify webhook event
    if (event.replyToken === '00000000000000000000000000000000' ||
      event.replyToken === 'ffffffffffffffffffffffffffffffff') {
      return;
    }
    return handleEvent(event);
  }))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.use((err, req, res, next) => {
  if (err instanceof SignatureValidationFailed) {
    res.status(401).send(err.signature)
    return
  } else if (err instanceof JSONParseError) {
    res.status(400).send(err.raw)
    return
  }
  next(err) // will throw default 500
})

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

var callback = function(answer, wildCardArray, input){
    console.log(answer + ' | ' + wildCardArray + ' | ' + input);
};

// callback function to handle a single event
function handleEvent(event) {
    console.log(event);
    switch (event.type) {
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    return handleText(message, event.replyToken);
                case 'image':
                    return handleImage(message, event.replyToken);
                case 'video':
                    return handleVideo(message, event.replyToken);
                case 'audio':
                    return handleAudio(message, event.replyToken);
                case 'location':
                    return handleLocation(message, event.replyToken);
                case 'sticker':
                    return handleSticker(message, event.replyToken);
                default:
                    throw new Error(`Unknown message: ${JSON.stringify(message)}`);
            }

        case 'follow':
            return replyText(event.replyToken, 'Got followed event');

        case 'unfollow':
            return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

        case 'join':
            return replyText(event.replyToken, `Joined ${event.source.type}`);

        case 'leave':
            return console.log(`Left: ${JSON.stringify(event)}`);

        case 'postback':
            let data = event.postback.data;
            return replyText(event.replyToken, `Got postback: ${data}`);

        case 'beacon':
            const dm = `${Buffer.from(event.beacon.dm || '', 'hex').toString('utf8')}`;
            return replyText(event.replyToken, `${event.beacon.type} beacon hwid : ${event.beacon.hwid} with device message = ${dm}`);

        default:
            throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    } 
}

function handleText(message, replyToken) {
    //aimlInterpreter.findAnswerInLoadedAIMLFiles(message.text, (answer, wildCardArray, input) => {
    aimlParser.getResult(message.text, (answer, wildCardArray, input) => {
        console.log(answer + ' | ' + wildCardArray + ' | ' + input);
        if (answer) {
            return replyText(replyToken, answer);     
        }
        return replyText(replyToken, 'No answer found');
    })
}

function handleImage(message, replyToken) {
    return replyText(replyToken, 'Got Image');
}

function handleVideo(message, replyToken) {
    return replyText(replyToken, 'Got Video');
}

function handleAudio(message, replyToken) {
    return replyText(replyToken, 'Got Audio');
}

function handleLocation(message, replyToken) {
    return replyText(replyToken, 'Got Location');
}

function handleSticker(message, replyToken) {
    return replyText(replyToken, 'Got Sticker');
}

app.listen(port, () => {
    console.log(`listening on ${port}`);
});
