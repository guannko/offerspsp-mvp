const TelegramBot = require('node-telegram-bot-api');
  require('dotenv').config();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🎯 Welcome to OffersPSP Bot!\n\n/apply - Submit application\n/status - Check status\n/offers - Browse PSP offers');
  });

  bot.onText(/\/apply/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '📝 Visit our website to submit your application: https://offerspsp.com/apply');
  });

  bot.onText(/\/offers/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '💳 Browse available PSP offers at: https://offerspsp.com/offers');
  });

  console.log('🤖 OffersPSP Telegram Bot is running...');