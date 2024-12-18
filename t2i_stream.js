const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { exec } = require('child_process');
const express = require('express');
const serveIndex = require('serve-index');
const ffmpeg = require('fluent-ffmpeg'); // Import fluent-ffmpeg
require('./secret');

const PORT = process.env.PORT || 5000;
const url = `https://api.telegram.org/bot${TOKEN}/getFile?file_id=`;
const urlFile = `https://api.telegram.org/file/bot${TOKEN}/`;
const app = express();

// HARDCODED HOST URL
const host = 'https://manakai.wildone.ch';

// Stream configuration
const STREAM_PASSCODE = 'scream'; // Replace with a secure passcode
let streamInProgress = false;
let streamProcess = null;

const dirs = ['video', 'audio', 'texto', 'foto', 'documentos'];

// Utility Functions
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

function generateHyperlink(filePath) {
    const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
    return `${host}/${relativePath}`;
}

// Function to transcode .oga files to .mp3
async function transcodeOgaToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .on('end', () => {
                console.log('Transcoding succeeded!');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Transcoding failed:', err);
                reject(err);
            })
            .save(outputPath);
    });
}

// Server Setup Function
async function startServer() {
    try {
        // Create directories
        for (const dir of dirs) {
            const fullPath = path.join(__dirname, dir);
            await fs.mkdir(fullPath, { recursive: true, mode: 0o755 }).catch(err => {
                if (err.code !== 'EEXIST') console.error(`Error creating directory ${fullPath}:`, err);
            });
        }

        // Middleware
        app.use(express.json());
        app.use(express.static(__dirname));

        // Static file serving for each directory
        dirs.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            app.use(`/${dir}`, express.static(fullPath));
            app.use(`/${dir}`, serveIndex(fullPath, { 'icons': true }));
        });

        // Root route with server status
        app.get('/', (req, res) => {
            res.send(`
                <html>
                    <head>
                        <title>Telegram Bot Server</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                text-align: center;
                            }
                            h1 { color: #333; }
                            .status {
                                margin-top: 20px;
                                padding: 10px;
                                background-color: #f0f0f0;
                                border-radius: 5px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Telegram Bot Server</h1>
                        <div class="status">
                            <p>Server is running</p>
                            <p>Stream Status: ${streamInProgress ? 'Active' : 'Inactive'}</p>
                        </div>
                    </body>
                </html>
            `);
        });

        // Status API endpoint
        app.get('/status', (req, res) => {
            res.json({
                serverRunning: true,
                streamActive: streamInProgress,
                directories: dirs
            });
        });

        // Logging middleware
        app.use((req, res, next) => {
            console.log(`Request received: ${req.method} ${req.url}`);
            next();
        });

        // 404 handler
        app.use((req, res, next) => {
            res.status(404).send("Sorry, that route doesn't exist.");
        });

        // Error handler
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).send('Something broke!');
        });

        // Start server
        return new Promise((resolve, reject) => {
            const server = app.listen(PORT, '0.0.0.0', () => {
                console.log(`========================`);
                console.log(`Server Details:`);
                console.log(`Port: ${PORT}`);
                console.log(`Full URL: ${host}`);
                console.log(`========================`);
                resolve(server);
            }).on('error', (err) => {
                console.error('Error starting server:', err);
                reject(err);
            });
        });
    } catch (err) {
        console.error("Error setting up server:", err);
        process.exit(1);
    }
}

// Stream Management Functions
function stopStream() {
    return new Promise((resolve, reject) => {
        if (streamProcess) {
            exec('pkill -f liquidsoap', (error) => {
                if (error) {
                    console.error('Error stopping stream:', error);
                    reject(error);
                } else {
                    streamProcess = null;
                    streamInProgress = false;
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

function startStream() {
    return new Promise((resolve, reject) => {
        const streamCommand = `liquidsoap 'output.icecast(%mp3, host="88.99.123.96",port=8000,password="xxxxxxxx",mount="21n.mp3",mksafe(playlist(mode="normal","/home/pi/Telegram2Icecast/audio/1.m3u",reload_mode="watch")))'`;

        streamProcess = exec(streamCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('Stream start error:', error);
                reject(error);
                return;
            }
            console.log('Stream started successfully');
            streamInProgress = true;
            resolve();
        });
    });
}

// Main Bot Initialization
async function initializeBot() {
    const bot = new TelegramBot(TOKEN, { polling: true });

    // Stream authentication tracking
    const userStreamAttempts = {};

    // Stream commands
    bot.onText(/\/startStream/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        userStreamAttempts[userId] = {
            attempts: 0,
            awaitingPasscode: true
        };

        bot.sendMessage(chatId, 'Please enter the stream start passcode:');
    });

    // IP command
    bot.onText(/\/ip/, (msg) => {
        const chatId = msg.chat.id;

        exec('curl ifconfig.co', (error, stdout, stderr) => {
            if (error) {
                console.error('Error getting IP:', error);
                bot.sendMessage(chatId, 'Failed to retrieve public IP address.');
                return;
            }

            const publicIP = stdout.trim();
            bot.sendMessage(chatId, `🌐 Public IP Address: ${publicIP}`);
        });
    });

    // Passcode verification
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        // Stream authentication process
        if (userStreamAttempts[userId] && userStreamAttempts[userId].awaitingPasscode) {
            if (msg.text === STREAM_PASSCODE) {
                try {
                    await stopStream();
                    await startStream();
                    delete userStreamAttempts[userId];
                    bot.sendMessage(chatId, 'Stream started successfully! 🎶');
                } catch (error) {
                    bot.sendMessage(chatId, 'Failed to start stream. Please try again.');
                }
            } else {
                userStreamAttempts[userId].attempts++;

                if (userStreamAttempts[userId].attempts >= 3) {
                    delete userStreamAttempts[userId];
                    bot.sendMessage(chatId, 'Too many incorrect attempts. Authentication cancelled.');
                } else {
                    bot.sendMessage(chatId, 'Incorrect passcode. Please try again.');
                }
            }
            return;
        }

        // Original file handling logic
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

            // Ensure we have a valid message object
            if (!msg || !msg.from) {
                console.log('Received invalid message, skipping');
                return;
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
                const fileId = paquete.file_id;
                const newUrl = `${url}${fileId}`;

                try {
                    const response = await axios.get(newUrl);
                    const fileUrl = `${urlFile}${response.data.result.file_path}`;
                    const filePath = path.join(__dirname, carpeta, `${msg.from.id}_${msg.from.first_name}_${msg.date}_${msg.message_id}.${ext}`);

                    console.log(`Downloading file from URL: ${fileUrl}`);
                    console.log(`Saving file to path: ${filePath}`);

                    // Ensure directory exists
                    await fs.mkdir(path.dirname(filePath), { recursive: true });

                    const writer = createWriteStream(filePath);
                    const downloadResponse = await axios({ method: 'get', url: fileUrl, responseType: 'stream' });

                    downloadResponse.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    console.log(`File saved to: ${filePath}`);

                    // Transcode .oga to .mp3 if necessary
                    if (ext === 'oga') {
                        const mp3Path = filePath.replace('.oga', '.mp3');
                        await transcodeOgaToMp3(filePath, mp3Path);
                        console.log(`File transcoded to: ${mp3Path}`);
                        obj.file = generateHyperlink(mp3Path);
                    } else {
                        obj.file = generateHyperlink(filePath);
                    }

                    obj.type = carpeta;

                    parsedjson.push(obj);

                    await fs.writeFile('datos.json', JSON.stringify(parsedjson, null, 2));

                    // Send a hyperlink to the uploaded file
                    bot.sendMessage(chatId, `${msj_confirmacion}. Puedes acceder al archivo aquí: ${obj.file}`);

                } catch (error) {
                    console.error('Error in descargaMedia:', error);
                    bot.sendMessage(chatId, 'An error occurred while processing your file.');
                }
            }

            // Handle different types of messages
            if (msg.voice) {
                await descargaMedia(msg.voice[msg.voice.length - 1] || msg.voice, 'audio', 'oga', 'Audio archivado');
            } else if (msg.photo) {
                await descargaMedia(msg.photo[msg.photo.length - 1], 'foto', 'jpg', 'Foto archivada');
            } else if (msg.video) {
                await descargaMedia(msg.video, 'video', 'mp4', 'Video archivado');
            } else if (msg.document) {
                console.log(`Processing document: ${msg.document.file_name}`);
                const fileExt = path.extname(msg.document.file_name).slice(1);
                console.log(`Extracted file extension: ${fileExt}`);
                await descargaMedia(msg.document, 'documentos', fileExt, 'Documento archivado');
            } else if (msg.text) {
                // Only log text messages that aren't empty or just whitespace
                if (msg.text.trim()) {
                    obj.type = 'texto';
                    obj.file = await convertUrlsToHtml(msg.text);

                    parsedjson.push(obj);
                    await fs.writeFile('datos.json', JSON.stringify(parsedjson, null, 2));
                }
            }

        } catch (error) {
            console.error('Error processing message:', error);
            bot.sendMessage(chatId, 'An error occurred while processing your message.');
        }
    });

    return bot;
}

// Main Execution
startServer()
    .then(async () => {
        await initializeBot();
        console.log("Server and Bot initialized successfully");
    })
    .catch(err => {
        console.error("Failed to start server or initialize bot:", err);
    });
