import express from "express";
import TelegramBot from "node-telegram-bot-api";
import bodyParser from "body-parser";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

const bot = new TelegramBot(token, { polling: false });
const app = express();

// ВАЖНО: Telegram требует RAW body
app.use(bodyParser.json({ limit: "10mb" }));

// Команда /start
bot.setMyCommands([
  { command: "/start", description: "Start game" }
]);

// Обработка webhook
app.post(`/webhook/${token}`, (req, res) => {
  try {
    bot.processWebhookUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e);
    res.sendStatus(500);
  }
});

// Ответ на любое сообщение
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

// Render использует process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`);
});
