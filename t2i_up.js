const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs').promises;
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

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    try {
        const rawjson = await fs.readFile('datos.json', 'utf8');
        let parsedjson = JSON.parse(rawjson);
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
            await fs.writeFile(darStringArchivo('texto', 'txt'), msg.text);
            parsedjson.push(obj);
            await fs.writeFile('datos.json', JSON.stringify(parsedjson));
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
                const writer = createWriteStream(darStringArchivo(carpeta, ext));
                
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
                    pendientes.push(`audio/off/${darStringArchivo(carpeta, ext)}`);
                    if (!sonando) {
                        // Uncomment the next line if you want to enable audio playback
                        // reproducirStream();
                    }
                    bot.sendMessage(chatId, 'You can listen to the audio in about 5 minutes (reload the page): live.radiolibre.cc:8000/bot.mp3');
                }

                obj.file = darStringArchivo(carpeta, ext);
                parsedjson.push(obj);
                await fs.writeFile('datos.json', JSON.stringify(parsedjson));
                bot.sendMessage(chatId, 'rx');
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
                const writer = createWriteStream(darStringArchivo(carpeta, paquete.file_name));
                
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

                obj.file = darStringArchivo(carpeta, paquete.file_name);
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
