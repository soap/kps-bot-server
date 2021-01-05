// config.js
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    // endpoint: process.env.PORT,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
    port: process.env.PORT | 4000
};