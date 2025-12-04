const { Telegraf } = require('telegraf');
const axios = require('axios');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const _ = require('lodash');

const BOT_TOKEN = '8456865406:AAGqqDLt4PpMf5QrDEPr7dDXymtTb_eN1_o';
const WEBHOOK_URL = 'https://qfox-bot-1.onrender.com';
const OPENROUTER_KEY = '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';

const PREMIUM_PRICE_STARS = 500;
const FREE_DAILY_LIMIT = 15;

db.defaults({ users: {} }).write();

const bot = new Telegraf(BOT_TOKEN);

// Проверка лимита и премиума
function canUseFree(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const user = db.get('users').find({ id: userId }).value() || { id: userId, count: 0, date: null, premiumUntil: null };

    if (user.premiumUntil && new Date(user.premiumUntil) > new Date()) return true;

    if (user.date !== today) {
        db.get('users').remove({ id: userId }).write();
        db.get('users').push({ id: userId, count: 0, date: today }).write();
        return true;
    }
    return user.count < FREE_DAILY_LIMIT;
}

function incrementUsage(userId) {
    db.get('users').find({ id: userId }).assign({ count: _.get(db.get('users').find({ id: userId }).value(), 'count', 0) + 1 }).write();
}

// Команды
bot.start((ctx) => {
    ctx.reply(`Привет! 🦊 Я Quantum Fox Empire — умный ИИ-бот.

Бесплатно: до ${FREE_DAILY_LIMIT} сообщений в день.
Премиум: ${PREMIUM_PRICE_STARS} ⭐ на месяц (безлимит + бонусы).

Пиши любой вопрос!`);
});

bot.command('premium', (ctx) => {
    ctx.replyWithInvoice({
        title: 'Премиум-подписка на месяц',
        description: 'Безлимитные запросы к ИИ и будущие плюшки 🚀',
        payload: `premium_${ctx.from.id}`,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: 'Подписка на месяц', amount: PREMIUM_PRICE_STARS * 100 }],
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false
    });
});

bot.on('successful_payment', (ctx) => {
    if (ctx.message.successful_payment.invoice_payload.startsWith('premium_')) {
        const monthLater = new Date();
        monthLater.setMonth(monthLater.getMonth() + 1);
        db.get('users').find({ id: ctx.from.id }).assign({ premiumUntil: monthLater.toISOString() }).write();
        ctx.reply('Спасибо! 🔥 Премиум на месяц активирован — теперь безлимит!');
    }
});

// Основная обработка сообщений с ИИ
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;

    if (!canUseFree(userId)) {
        return ctx.reply(`Лимит на сегодня исчерпан 😔\nКупи премиум: /premium`);
    }

    incrementUsage(userId);
    await ctx.replyWithChatAction('typing');

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "qwen/qwen-2.5-72b-instruct:free",  // 100% рабочая бесплатная модель декабря 2025
            messages: [
                { role: "system", content: "Ты — Quantum Fox, остроумный и полезный ИИ-помощник. Отвечай на русском языке в дружелюбном стиле." },
                { role: "user", content: ctx.message.text }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://quantum-fox-empire.com',
                'X-Title': 'Quantum Fox Empire Bot'
            }
        });

        const answer = response.data.choices[0].message.content;
        await ctx.reply(answer);

    } catch (error) {
        console.error(error.response?.data || error);
        await ctx.reply('Извини, ИИ временно недоступен 😔 Попробуй через пару минут.');
    }
});

// Запуск бота через webhook
bot.launch({
    webhook: {
        domain: WEBHOOK_URL,
        port: process.env.PORT || 3000
    }
}).then(() => console.log('Бот запущен!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
