const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { spawn } = require('child_process');
const ip = require('ip');
const express = require('express');
const serveIndex = require('serve-index');
require('./secret');

const url = `https://api.telegram.org/bot${TOKEN}/getFile?file_id=`;
const urlFile = `https://api.telegram.org/file/bot${TOKEN}/`;

const app = express();

let reproducidos = [];
let pendientes = [];
let sonando = false;

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname));
app.use('/video', serveIndex(__dirname + '/video/uploaded'));
app.use('/audio', serveIndex(__dirname + '/audio/uploaded'));
app.use('/texto', serveIndex(__dirname + '/texto'));
app.use('/foto', serveIndex(__dirname + '/foto/uploaded'));
app.use('/documentos', serveIndex(__dirname + '/documentos/uploaded'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(app.get('port'), () => {
    console.log(`Running on port: ${app.get('port')}`);
});

const bot = new TelegramBot(TOKEN, {polling: true});

// Function to ensure a directory exists
async function ensureDir(dirpath) {
    try {
        await fs.mkdir(dirpath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        let parsedjson = [];
        try {
            const rawjson = await fs.readFile('datos.json', 'utf8');
            if (rawjson.trim() === '') {
                console.log('datos.json is empty. Initializing with an empty array.');
                parsedjson = [];
            } else {
                parsedjson = JSON.parse(rawjson);
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('datos.json not found. Creating a new one.');
                await fs.writeFile('datos.json', '[]');
            } else if (error instanceof SyntaxError) {
                console.log('Invalid JSON in datos.json. Initializing with an empty array.');
                parsedjson = [];
            } else {
                throw error;
            }
        }

        let obj = {
            message_id: msg.message_id,
            from_id: msg.from.id,
            from_name: `${msg.from.first_name} ${msg.from.last_name || ''}`.trim(),
            date: msg.date,
            type: '',
            file: ''
        };

        console.log(msg);

        if (msg.voice) {
            obj.type = 'audio';
            await descargaMedia(msg.voice, 'audio', 'oga', 'audio descargado');
        } else if (msg.photo) {
            obj.type = 'foto';
            await descargaMedia(msg.photo[msg.photo.length - 1], 'foto', 'jpg', 'foto descargada');
        } else if (msg.video) {
            obj.type = 'video';
            await descargaMedia(msg.video, 'video', 'mp4', 'video descargado');
        } else if (msg.document) {
            await descargaDocumento(msg.document, 'documentos', '');
        } else if (msg.text) {
            obj.type = 'texto';
            obj.file = msg.text;
            const filePath = darStringArchivo('texto', 'txt');
            await ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, msg.text);
            parsedjson.push(obj);
            await fs.writeFile('datos.json', JSON.stringify(parsedjson));
            bot.sendMessage(chatId, 'Texto recibido y guardado.');
        }

        function darStringArchivo(carpeta, ext) {
            return `${carpeta}/${msg.from.id}_${msg.from.first_name}_${msg.date}_${msg.message_id}.${ext}`;
        }

        async function descargaMedia(paquete, carpeta, ext, msj_confirmacion) {
            const fileId = carpeta === 'foto' ? paquete.file_id : paquete.file_id;
            const newUrl = `${url}${fileId}`;

            try {
                const response = await axios.get(newUrl);
                const fileUrl = `${urlFile}${response.data.result.file_path}`;
                const filePath = darStringArchivo(carpeta, ext);
                
                await ensureDir(path.dirname(filePath));
                
                const writer = createWriteStream(filePath);
                
                const downloadResponse = await axios({
                    method: 'get',
                    url: fileUrl,
                    responseType: 'stream'
                });

                downloadResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                if (carpeta === 'audio' && paquete.file_size < 57000) {
                    pendientes.push(`audio/off/${filePath}`);
                    if (!sonando) {
                        // Uncomment the next line if you want to enable audio playback
                        // reproducirStream();
                    }
                    bot.sendMessage(chatId, 'Los audios se emiten aqui (en 3 min): live.radiolibre.cc:8000/bot.mp3');
                }

                obj.file = filePath;
                parsedjson.push(obj);
                await fs.writeFile('datos.json', JSON.stringify(parsedjson));
                bot.sendMessage(chatId, `${msj_confirmacion}`);
            } catch (error) {
                console.error('Error:', error);
                bot.sendMessage(chatId, 'An error occurred while processing your file.');
            }
        }

        async function descargaDocumento(paquete, carpeta, msj_confirmacion) {
            const newUrl = `${url}${paquete.file_id}`;

            try {
                const response = await axios.get(newUrl);
                const fileUrl = `${urlFile}${response.data.result.file_path}`;
                const filePath = darStringArchivo(carpeta, paquete.file_name);
                
                await ensureDir(path.dirname(filePath));
                
                const writer = createWriteStream(filePath);
                
                const downloadResponse = await axios({
                    method: 'get',
                    url: fileUrl,
                    responseType: 'stream'
                });

                downloadResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                obj.file = filePath;
                parsedjson.push(obj);
                await fs.writeFile('datos.json', JSON.stringify(parsedjson));
                bot.sendMessage(chatId, `Local IP to check history: ${ip.address()}:${app.get('port')}`);
            } catch (error) {
                console.error('Error:', error);
                bot.sendMessage(chatId, 'An error occurred while processing your document.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, 'An error occurred while processing your message.');
    }
});

function reproducirStream() {
    if (pendientes.length > 0) {
        sonando = true;
        const play = spawn('cvlc', ['--no-video', '--play-and-exit', pendientes[0]]);
        play.on('exit', () => {
            reproducidos.push(pendientes[0]);
            pendientes = pendientes.slice(1);
            sonando = false;
            reproducirStream();
        });
    } else if (reproducidos.length > 0) {
        sonando = true;
        const random = Math.floor(Math.random() * reproducidos.length);
        const play = spawn('cvlc', ['--no-video', '--play-and-exit', reproducidos[random]]);
        play.on('exit', () => {
            sonando = false;
            reproducirStream();
        });
    }
}
