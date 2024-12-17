const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const ip = require('ip');
const express = require('express');
const serveIndex = require('serve-index');
require('./secret');

const PORT = process.env.PORT || 5000;
const url = `https://api.telegram.org/bot${TOKEN}/getFile?file_id=`;
const urlFile = `https://api.telegram.org/file/bot${TOKEN}/`;
const app = express();
const localIp = ip.address();
const host = `http://${localIp}:${PORT}`;
let reproducidos = [];
let pendientes = [];
let sonando = false;
const dirs = ['video', 'audio', 'texto', 'foto', 'documentos'];

async function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function convertUrlsToHtml(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
        return `<a href="${url}">${url}</a>`;
    });
}

async function setupDirectories() {
    for (const dir of dirs) {
        const fullPath = path.join(__dirname, dir);
        try {
            await fs.mkdir(fullPath, { recursive: true, mode: 0o755 });
        } catch (err) {
            if (err.code !== 'EEXIST') console.error(`Error creating directory ${fullPath}:`, err);
        }
    }
}

async function startServer() {
    try {
        await setupDirectories();
        app.use(express.static(__dirname));

        dirs.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            app.use(`/${dir}`, express.static(fullPath));
            app.use(`/${dir}`, serveIndex(fullPath, { 'icons': true }));
        });

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });

        app.use((req, res, next) => {
            console.log(`Request received: ${req.method} ${req.url}`);
            next();
        });

        app.use((req, res, next) => {
            res.status(404).send("Sorry, that route doesn't exist.");
        });

        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).send('Something broke!');
        });

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`========================`);
            console.log(`Server Details:`);
            console.log(`Local IP: ${localIp}`);
            console.log(`Port: ${PORT}`);
            console.log(`Full URL: ${host}`);
            console.log(`========================`);
        }).on('error', (err) => {
            console.error('Error starting server:', err);
        });

        return server;
    } catch (err) {
        console.error("Error setting up directories:", err);
        process.exit(1);
    }
}

function generateHyperlink(filePath) {
    const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/'); // Normalize for URLs
    return `${host}/${relativePath}`; // Construct full URL using host
}

// Start the server and initialize the Telegram bot
startServer().then(() => {
    const bot = new TelegramBot(TOKEN, { polling: true });

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

            // Load existing data from datos.json
            try {
                const rawjson = await fs.readFile('datos.json', 'utf8');
                parsedjson = rawjson.trim() ? JSON.parse(rawjson) : [];
            } catch (error) {
                if (error.code === 'ENOENT') {
                    await fs.writeFile('datos.json', '[]');
                } else if (error instanceof SyntaxError) {
                    parsedjson = [];
                } else throw error;
            }

            let obj = {
                message_id: msg.message_id,
                from_id: msg.from.id,
                from_name: `${msg.from.first_name} ${msg.from.last_name || ''}`.trim(),
                date: msg.date,
                type: '',
                file: ''
            };

            async function descargaMedia(paquete, carpeta, ext, msj_confirmacion) {
                const fileId = paquete.file_id; // Use file_id directly
                const newUrl = `${url}${fileId}`;

                try {
                    const response = await axios.get(newUrl);
                    const fileUrl = `${urlFile}${response.data.result.file_path}`;
                    const filePath = path.join(__dirname, carpeta, `${msg.from.id}_${msg.from.first_name}_${msg.date}_${msg.message_id}.${ext}`);

                    await ensureDir(path.dirname(filePath));

                    const writer = createWriteStream(filePath);
                    const downloadResponse = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });

                    downloadResponse.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    console.log(`File saved to: ${filePath}`);

                    obj.type = carpeta;

                    // Generate a public URL for the saved file
                    const publicUrl = generateHyperlink(filePath); // This should give you a URL like http://192.168.1.4:5000/video/filename.mp4
                    obj.file = publicUrl; // Store the public URL instead of local path

                    parsedjson.push(obj);

                    await fs.writeFile('datos.json', JSON.stringify(parsedjson));

                    // Send a hyperlink to the uploaded file
                    bot.sendMessage(chatId, `${msj_confirmacion}. Puedes acceder al archivo aquí: ${publicUrl}`);

                } catch (error) {
                    console.error('Error:', error);
                    bot.sendMessage(chatId, 'An error occurred while processing your file.');
                }
            }

            if (msg.voice) {
                await descargaMedia(msg.voice, 'audio', 'oga', 'Audio archivado');
            } else if (msg.photo) {
                await descargaMedia(msg.photo[msg.photo.length - 1], 'foto', 'jpg', 'Foto archivada');
            } else if (msg.video) {
                await descargaMedia(msg.video, 'video', 'mp4', 'Video archivado');
            } else if (msg.document) {
                // Handle document downloads similarly if needed
                // You can create a similar function for documents if necessary
            } else if (msg.text) {
                obj.type = 'texto';
                obj.file = msg.text; // Handle text messages as before

                parsedjson.push(obj); // Push text message entry
                await fs.writeFile('datos.json', JSON.stringify(parsedjson)); // Update datos.json
            }

        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'An error occurred while processing your message.');
        }
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});
