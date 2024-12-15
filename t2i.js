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
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

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

async function startServer() {
    try {
        await setupDirectories();

        // Serve static files from the root directory
        app.use(express.static(__dirname));

        // Set up static file serving and directory listings for each directory
        dirs.forEach(dir => {
            const fullPath = path.join(__dirname, dir);

            // Serve static files from both the main directory and the 'uploaded' subdirectory
            app.use(`/${dir}`, express.static(fullPath));
            app.use(`/${dir}/uploaded`, express.static(path.join(fullPath, 'uploaded')));

            // Set up directory listing for both the main directory and the 'uploaded' subdirectory
            app.use(`/${dir}`, serveIndex(fullPath, {'icons': true}));
            app.use(`/${dir}/uploaded`, serveIndex(path.join(fullPath, 'uploaded'), {'icons': true}));
        });

        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });

        // Add a catch-all route for debugging
        app.use((req, res, next) => {
            console.log(`Request received: ${req.method} ${req.url}`);
            next();
        });

        // Error handling for 404 - Route Not Found
        app.use((req, res, next) => {
            res.status(404).send("Sorry, that route doesn't exist.");
        });

        // Error handling for 500 - Server Error
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

function reproducirStream() {
    if (pendientes.length === 0) {
        sonando = false;
        return;
    }

    sonando = true;
    const archivo = pendientes.shift();
    reproducidos.push(archivo);

    const ffmpeg = spawn('ffmpeg', [
        '-i', archivo,
        '-acodec', 'libmp3lame',
        '-b:a', '128k',
        '-f', 'mp3',
        'pipe:1'
    ], { stdio: ['ignore', 'pipe', 'ignore'] });

    const fs = require('fs');
    const writeStream = fs.createWriteStream('audio/off/bot.mp3');
    ffmpeg.stdout.pipe(writeStream);

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log('Conversion completada');
            setTimeout(reproducirStream, 120000);
        } else {
            console.log(`Error en conversión: ${code}`);
            sonando = false;
        }
    });
}

function generateHyperlink(filePath) {
    const relativePath = path.relative(__dirname, filePath);
    const urlPath = relativePath.replace(/\\/g, '/');
    return `${host}/${urlPath}`;
}

// Start the server and initialize the Telegram bot
startServer().then(() => {
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
                        bot.sendMessage(chatId, 'Los audios se escucharan en 2min aqui: https://live.radiolibre.cc:8000/bot.mp3');
                    }

                    obj.type = carpeta;
                    obj.file = filePath;
                    parsedjson.push(obj);
                    await fs.writeFile('datos.json', JSON.stringify(parsedjson));

                    // Generate and send a hyperlink to the uploaded file
                    const hyperlink = generateHyperlink(filePath);
                    bot.sendMessage(chatId, `${msj_confirmacion}. Puedes acceder al archivo aquí: ${hyperlink}`);
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

                    obj.type = carpeta;
                    obj.file = filePath;
                    parsedjson.push(obj);
                    await fs.writeFile('datos.json', JSON.stringify(parsedjson));

                    // Generate and send a hyperlink to the uploaded file
                    const hyperlink = generateHyperlink(filePath);
                    bot.sendMessage(chatId, `Documento guardado. Puedes acceder al archivo aquí: ${hyperlink}`);
                } catch (error) {
                    console.error('Error:', error);
                    bot.sendMessage(chatId, 'An error occurred while processing your document.');
                }
            }

            if (msg.voice) {
                await descargaMedia(msg.voice, 'audio', 'oga', 'Audio archivado');
            } else if (msg.photo) {
                await descargaMedia(msg.photo[msg.photo.length - 1], 'foto', 'jpg', 'Foto archivada');
            } else if (msg.video) {
                await descargaMedia(msg.video, 'video', 'mp4', 'Video archivado');
            } else if (msg.document) {
                await descargaDocumento(msg.document, 'documentos', '');
            } else if (msg.text) {
                obj.type = 'texto';
                obj.file = msg.text;
                const filePath = darStringArchivo('texto', 'html');
                await ensureDir(path.dirname(filePath));

                // Check if the message contains a URL
                const hasUrl = await isValidUrl(msg.text);

                if (hasUrl) {
                    // Convert URLs to clickable links
                    const htmlContent = await convertUrlsToHtml(msg.text);
                    await fs.writeFile(filePath, `<!DOCTYPE html>
                      <html>
                      <head>
                          <title>URL Message</title>
                          <style>
                              body {
                                  font-family: Arial, sans-serif;
                                  margin: 20px;
                                  line-height: 1.6;
                                  max-width: 800px;
                                  margin: 0 auto;
                                  padding: 20px;
                                  background-color: #f4f4f4;
                              }
                              .message {
                                  background-color: white;
                                  padding: 20px;
                                  border-radius: 5px;
                                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                                  word-wrap: break-word;
                              }
                              a {
                                  color: #0000EE;
                                  text-decoration: underline;
                                  word-break: break-all;
                              }
                          </style>
                      </head>
                      <body>
                          <div class="message">${htmlContent}</div>
                      </body>
                      </html>`);
                          } else {
                              // For plain text, create a simple HTML file
                              await fs.writeFile(filePath, `<!DOCTYPE html>
                      <html>
                      <head>
                          <title>Text Message</title>
                          <style>
                              body {
                                  font-family: Arial, sans-serif;
                                  margin: 20px;
                                  line-height: 1.6;
                                  max-width: 800px;
                                  margin: 0 auto;
                                  padding: 20px;
                                  background-color: #f4f4f4;
                              }
                              .message {
                                  background-color: white;
                                  padding: 20px;
                                  border-radius: 5px;
                                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                              }
                          </style>
                      </head>
                      <body>
                          <div class="message">${msg.text}</div>
                      </body>
                      </html>`);
                          }

                parsedjson.push(obj);
                await fs.writeFile('datos.json', JSON.stringify(parsedjson));

                // Generate and send a hyperlink to the text file
                const hyperlink = generateHyperlink(filePath);
                bot.sendMessage(chatId, `Texto recibido y archivado. Puedes acceder al archivo aquí: ${hyperlink}`);
            }

        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'An error occurred while processing your message.');
        }
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});
