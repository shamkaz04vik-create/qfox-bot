import express from "express";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = "8456865406:AAGqqDLt4PpMf5QrDEPr7dDXymtTb_eN1_o";
const WEBHOOK_URL = "https://qfox-bot.onrender.com/webhook/" + TOKEN;

const app = express();
app.use(express.json());

const bot = new TelegramBot(TOKEN, { webHook: true });

// Настраиваем вебхук
bot.setWebHook(WEBHOOK_URL);

// Корневой маршрут чтобы не было "Cannot GET /"
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Маршрут вебхука
app.post("/webhook/" + TOKEN, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Обработка сообщения
bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "Привет! Бот работает!");
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
