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

const dirs = ['video', 'audio', 'texto', 'foto', 'documentos'];

async function setupDirectories() {
    for (const dir of dirs) {
        const fullPath = path.join(__dirname, dir, 'uploaded');
        try {
            await fs.mkdir(fullPath, { recursive: true, mode: 0o755 });
        } catch (err) {
            if (err.code !== 'EEXIST') console.error(`Error creating directory ${fullPath}:`, err);
        }
    }
}

app.set('port', (process.env.PORT || 5000));

setupDirectories().then(() => {
    // Serve static files from the root directory
    app.use(express.static(__dirname));

    // Set up static file serving and directory listings for each directory
    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        app.use(`/${dir}`, express.static(fullPath));
        app.use(`/${dir}`, serveIndex(path.join(fullPath, 'uploaded'), {'icons': true}));
    });

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    // Add a catch-all route for debugging
    app.use((req, res, next) => {
        console.log(`Request received: ${req.method} ${req.url}`);
        next();
    });

    app.listen(app.get('port'), () => {
        console.log(`Running on port: ${app.get('port')}`);
        console.log(`Server is accessible at: http://${ip.address()}:${app.get('port')}`);
    }).on('error', (err) => {
        console.error('Error starting server:', err);
    });
}).catch(err => {
    console.error("Error setting up directories:", err);
    process.exit(1);
});

const bot = new TelegramBot(TOKEN, {polling: true});

async function ensureDir(dirpath) {
    try {
        await fs.mkdir(dirpath, { recursive: true, mode: 0o755 });
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
            return path.join(carpeta, 'uploaded', 
`${msg.from.id}_${msg.from.first_name}_${msg.date}_${msg.message_id}.${ext}`);
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

                console.log(`File saved to: ${filePath}`);

                if (carpeta === 'audio' && paquete.file_size < 57000) {
                    pendientes.push(`audio/off/${filePath}`);
                    if (!sonando) {
                        // Uncomment the next line if you want to enable audio playback
                        // reproducirStream();
                    }
                    bot.sendMessage(chatId, 'Los audios se escuchan en 2min por aqui: https://live.radiolibre.cc:8000/bot.mp3');
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

                console.log(`File saved to: ${filePath}`);

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
    // ... (reproducirStream function remains the same)
}
