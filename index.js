import express from "express";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

const bot = new TelegramBot(token, { polling: false });
bot.setWebHook(`https://qfox-bot.onrender.com/webhook/${token}`);

const app = express();
app.use(express.json());

// Команда /start
bot.setMyCommands([
  { command: "/start", description: "Start game" }
]);

// Приём webhook от Telegram
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

// Старт сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
});
