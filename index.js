console.clear();
console.log('Starting...');
require('./setting/settings');
const { 
    default: makeWASocket, 
    prepareWAMessageMedia, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    generateWAMessageFromContent, 
    generateWAMessageContent, 
    jidDecode, 
    proto, 
    relayWAMessage, 
    getContentType, 
    getAggregateVotesInPollMessage, 
    downloadContentFromMessage, 
    fetchLatestWaWebVersion, 
    InteractiveMessage, 
    makeCacheableSignalKeyStore, 
    Browsers, 
    generateForwardMessageContent, 
    MessageRetryMap 
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const chalk = require("chalk");
const { Boom } = require('@hapi/boom');
const { color } = require('./lib/color');
const { smsg, sendGmail, formatSize, isUrl, generateMessageTag, getBuffer, getSizeMedia, runtime, fetchJson, sleep } = require('./lib/myfunction');

const usePairingCode = true;
const question = (text) => {
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
return new Promise((resolve) => { rl.question(text, resolve) });
}
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

// Whatsapp Connect
async function ConnetToWhatsapp() {
const { state, saveCreds } = await useMultiFileAuthState('./session');
const zyn = makeWASocket({
logger: pino({ level: "silent" }),
printQRInTerminal: !usePairingCode,
auth: state,
browser: ["Ubuntu", "Chrome", "20.0.04"]
});
if (usePairingCode && !zyn.authState.creds.registered) {
const phoneNumber = await question(chalk.cyan.bold('Enter Your Number\nNumber : '));
const code = await zyn.requestPairingCode(phoneNumber.trim());
console.log(chalk.green.bold(`Code : ${code}`));
}

store.bind(zyn.ev);
zyn.ev.on("messages.upsert", async (chatUpdate, msg) => {
 try {
const mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!zyn.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
if (mek.key.id.startsWith('FatihArridho_')) return;
const m = smsg(zyn, mek, store)
require("./JinZo")(zyn, m, chatUpdate, store)
 } catch (err) {
 console.log(err)
 }
});

    zyn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    zyn.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = zyn.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });

    zyn.public = true

    zyn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(color(lastDisconnect.error, 'deeppink'));
            if (lastDisconnect.error == 'Error: Stream Errored (unknown)') {
                process.exit();
            } else if (reason === DisconnectReason.badSession) {
                console.log(color(`Bad Session File, Please Delete Session and Scan Again`));
                process.exit();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(color('[SYSTEM]', 'white'), color('Connection closed, reconnecting...', 'deeppink'));
                process.exit();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log(color('[SYSTEM]', 'white'), color('Connection lost, trying to reconnect', 'deeppink'));
                process.exit();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log(color('Connection Replaced, Another New Session Opened, Please Close Current Session First'));
                zyn.logout();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(color(`Device Logged Out, Please Scan Again And Run.`));
                zyn.logout();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(color('Restart Required, Restarting...'));
                await ConnetToWhatsapp();
            } else if (reason === DisconnectReason.timedOut) {
                console.log(color('Connection TimedOut, Reconnecting...'));
                ConnetToWhatsapp();
            }
        } else if (connection === "connecting") {
            console.log(color('connecting . . . '));
        } else if (connection === "open") {
            console.log(color('Bot Connected Successfully'));
        }
    });

    zyn.sendText = (jid, text, quoted = '', options) => zyn.sendMessage(jid, { text: text, ...options }, { quoted });
    
    zyn.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
return buffer
    } 
    
    zyn.ev.on('creds.update', saveCreds);
    return zyn;
}

ConnetToWhatsapp();

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});
