const { Telegraf } = require('telegraf');
const axios = require('axios');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const _ = require('lodash');

// Настройки
const BOT_TOKEN = 'ТОКЕН_ОТ_BOTFATHER';
const WEBHOOK_URL = 'https://твой-бот.onrender.com';
const PREMIUM_PRICE_STARS = 500; // цена подписки на месяц в Stars
const FREE_DAILY_LIMIT = 15;     // бесплатных сообщений в день

// Инициализация БД
db.defaults({ users: {} }).write();

const bot = new Telegraf(BOT_TOKEN);

// Проверка, премиум ли пользователь или есть ли бесплатные сообщения сегодня
function canUseFree(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const user = db.get('users').find({ id: userId }).value() || { id: userId, count: 0, date: null, premiumUntil: null };

    if (user.premiumUntil && new Date(user.premiumUntil) > new Date()) {
        return true; // премиум активен
    }

    if (user.date !== today) {
        // новый день — сбрасываем счётчик
        db.get('users').remove({ id: userId }).write();
        db.get('users').push({ id: userId, count: 0, date: today }).write();
        return true;
    }

    return user.count < FREE_DAILY_LIMIT;
}

// Увеличение счётчика
function incrementUsage(userId) {
    const today = new Date().toISOString().slice(0, 10);
    db.get('users')
        .find({ id: userId })
        .assign({ count: _.get(db.get('users').find({ id: userId }).value(), 'count', 0) + 1 })
        .write();
}

// При /start
bot.start((ctx) => {
    ctx.reply(`Привет! 👋 Я умный ИИ-бот на базе DeepSeek.

Бесплатно: до ${FREE_DAILY_LIMIT} сообщений в день.
Премиум-подписка (безлимит + бонусы): ${PREMIUM_PRICE_STARS} ⭐ на месяц.

Пиши любой вопрос!`);
});

// Команда /premium — показывает кнопку оплаты
bot.command('premium', (ctx) => {
    ctx.replyWithInvoice({
        title: 'Премиум-подписка на месяц',
        description: 'Безлимитные запросы к ИИ, приоритетные ответы и будущие плюшки 🚀',
        payload: `premium_${ctx.from.id}`, // уникальный payload
        provider_token: '', // для Stars оставляем пустым
        currency: 'XTR', // Telegram Stars
        prices: [{ label: 'Подписка на месяц', amount: PREMIUM_PRICE_STARS * 100 }], // amount в минимальных единицах
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false
    });
});

// Обработка успешной оплаты
bot.on('successful_payment', (ctx) => {
    if (ctx.message.successful_payment.invoice_payload.startsWith('premium_')) {
        const monthLater = new Date();
        monthLater.setMonth(monthLater.getMonth() + 1);

        db.get('users')
            .find({ id: ctx.from.id })
            .assign({ premiumUntil: monthLater.toISOString() })
            .write();

        ctx.reply('Спасибо за покупку! 🔥 Теперь у тебя безлимитный премиум на месяц. Пиши сколько угодно!');
    }
});

// Основной обработчик сообщений
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;

    if (!canUseFree(userId)) {
        return ctx.reply(`Лимит бесплатных сообщений на сегодня исчерпан 😔\n\nКупи премиум за ${PREMIUM_PRICE_STARS} ⭐ и пользуйся без ограничений! /premium`);
    }

    incrementUsage(userId);

    await ctx.replyWithChatAction('typing');

    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "Ты — полезный и остроумный помощник. Отвечай на русском языке." },
                { role: "user", content: ctx.message.text }
            ],
            stream: false
        }, {
            headers: {
                'Authorization': 'Bearer sk-free',
                'Content-Type': 'application/json'
            }
        });

        const answer = response.data.choices[0].message.content;
        await ctx.reply(answer);

    } catch (error) {
        console.error(error);
        await ctx.reply('Извини, что-то пошло не так 😔 Попробуй позже.');
    }
});

// Запуск на webhook
bot.launch({
    webhook: {
        domain: WEBHOOK_URL,
        port: process.env.PORT || 3000
    }
}).then(() => console.log('Бот запущен с монетизацией!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
