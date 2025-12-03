import express from "express";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

const bot = new TelegramBot(token, {
  polling: false,
  webHook: {
    port: process.env.PORT
  }
});

const app = express();
app.use(express.json());

// Настройка webhook для бота
bot.setWebHook(`${process.env.RENDER_EXTERNAL_URL}/webhook/${token}`);

// Команда /start
bot.setMyCommands([
  { command: "/start", description: "Start game" }
]);

// Webhook endpoint
app.post(`/webhook/${token}`, (req, res) => {
  bot.processWebhookUpdate(req.body);
  res.sendStatus(200);
});

// Сообщения
bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "Добро пожаловать в Quantum Fox Empire!", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Играть",
            web_app: { url: webAppUrl }
          }
        ]
      ]
    }
  });
});

// Запуск сервера (ВАЖНО!)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Bot server running on port " + PORT);
});
