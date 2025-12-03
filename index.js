import express from "express";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL; // Твоя игра на Netlify

const bot = new TelegramBot(token, { polling: false });
const app = express();

app.use(express.json());

// обработка команды /start
bot.setMyCommands([{ command: "/start", description: "Start game" }]);

app.post(`/webhook/${token}`, (req, res) => {
    bot.processWebhookUpdate(req.body);
    res.sendStatus(200);
});

bot.on("message", (msg) => {
    bot.sendMessage(msg.chat.id, "Добро пожаловать в Quantum Fox Empire!", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Играть", web_app: { url: webAppUrl } }]
            ]
        }
    });
});

// старт сервера
app.listen(3000, () => {
    console.log("Bot server running!");
});
