import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const TOKEN = '8456865406:AAGqqDLt4PpMf5QrDEPr7dDXymtTb_eN1_o';
const WEBHOOK_URL = 'https://qfox-bot.onrender.com/webhook/' + TOKEN;

const app = express();
app.use(express.json());

// Создаём бота в режиме WEBHOOK
const bot = new TelegramBot(TOKEN, { webHook: { port: process.env.PORT } });

// Устанавливаем вебхук
bot.setWebHook(WEBHOOK_URL);

// Маршрут, который Telegram вызывает
app.post(`/webhook/${TOKEN}`, (req, res) => {
    bot.processWebhookUpdate(req.body);
    res.sendStatus(200);
});

// Тестовый маршрут
app.get('/', (req, res) => {
    res.send("Bot is running.");
});

// Логика бота
bot.on('message', msg => {
    bot.sendMessage(msg.chat.id, "Бот работает, получено сообщение!");
});

// Запуск Express (Render сам назначает порт)
app.listen(process.env.PORT, () => {
    console.log("Server started on port " + process.env.PORT);
});
