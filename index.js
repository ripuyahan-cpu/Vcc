const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const bot = new Telegraf('8578271054:AAF8NtbAQ4pEUZpzfbNzdC8Iw-pK6BZ9Glw');

// --- Helper Functions ---
const luhnChecksum = (code) => {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
        let d = parseInt(code[i]);
        if (i % 2 === (code.length % 2)) d *= 2;
        if (d > 9) d -= 9;
        sum += d;
    }
    return sum % 10;
};

const generateVCC = (bin) => {
    let card = bin.toString();
    while (card.length < 15) card += Math.floor(Math.random() * 10);
    card += (10 - (luhnChecksum(card + '0') % 10)) % 10;
    return {
        no: card,
        date: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${Math.floor(Math.random() * 6) + 2025}`,
        cvv: Math.floor(Math.random() * 899) + 100
    };
};

const checkBin = async (bin) => {
    try {
        const response = await axios.get(`https://lookup.binlist.net/${bin}`);
        return response.data;
    } catch (e) { return null; }
};

// সিমুলেটেড ভ্যালিডেশন চেক (Live/Dead/Invalid)
const simulateValidation = (binData) => {
    if (!binData) return '❌ INVALID';
    
    // BIN ডেটা থাকলে Live/Dead সিমুলেশন
    const random = Math.random();
    if (random > 0.7) return '🟢 LIVE';
    else if (random > 0.3) return '🟡 DEAD';
    else return '⚠️ INVOLVED'; // অথবা Invalid
};

// --- Commands & Interface ---

bot.start((ctx) => {
    const firstName = ctx.from.first_name || 'User';
    ctx.replyWithMarkdown(` হাই *${firstName}*\\! VCC Master Bot-এ আপনাকে স্বাগতম\\।\nনিচের বাটনগুলো ব্যবহার করুন:`, 
        Markup.keyboard([
            [' CC Generator (Bulk)', '️ BIN Lookup'],
            [' Fake Address', ' IP Checker']
        ]).resize()
    );
});

// বাল্ক জেনারেটর কমান্ড
bot.hears(' CC Generator (Bulk)', (ctx) => {
    ctx.reply('একসাথে একাধিক কার্ড জেনারেট করতে টাইপ করুন: `/gen_bulk <BIN> <সংখ্যা>`\nউদাহরণ: `/gen_bulk 440393 5`');
});

bot.command('gen_bulk', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const bin = args[1], count = parseInt(args[2]) || 1;

    if (!bin || bin.length < 6 || count < 1 || count > 10) {
        return ctx.reply('❌ সঠিক ফরম্যাট ব্যবহার করুন: /gen_bulk <BIN> <সংখ্যা (1-10)>');
    }

    let response = ` **Bulk CC List** (${count} Cards)\n━━━━━━━━━━━━━━\n`;
    const binData = await checkBin(bin);
    const validationStatus = simulateValidation(binData);

    for (let i = 0; i < count; i++) {
        const card = generateVCC(bin);
        response += `\`${card.no} | ${card.date} | ${card.cvv}\` ➡️ *${validationStatus}*\n`;
    }
    
    response += `\n **Bank:** ${binData?.bank?.name || 'Unknown'}`;
    ctx.replyWithMarkdown(response);
});

// অন্যান্য কমান্ড (Address, IP, Check) আগের মতোই থাকবে...
bot.hears(' Fake Address', (ctx) => { /* ... */ });
bot.hears('️ BIN Lookup', (ctx) => { /* ... */ });
bot.hears(' IP Checker', (ctx) => { /* ... */ });
bot.command('check', async (ctx) => { /* ... */ });
bot.command('ip', async (ctx) => { /* ... */ });


bot.launch().then(() => console.log('Pro Bot is Live!'));
