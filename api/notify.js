"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
async function handler(req, res) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_ID;
    const text = "🚨 **REMINDER JENSET** 🚨\nHalo tim, sudah waktunya menyalakan jenset. Tolong klik tombol di bawah jika jenset sudah menyala!";
    const replyMarkup = {
        inline_keyboard: [[
                { text: "✅ Sudah Dinyalakan", callback_data: "genset_on" }
            ]]
    };
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
                reply_markup: replyMarkup
            }),
        });
        res.status(200).json({ success: true, message: 'Notification sent' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Failed to send telegram message'
        });
    }
}
