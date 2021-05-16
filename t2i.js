const TelegramBot = require('node-telegram-bot-api');
var request = require('request');
const fs = require('fs');
const download = require('download');
const { spawn } = require('child_process');
const ip = require('ip');
const serveIndex = require('serve-index');
require('./secret');

var url = "https://api.telegram.org/bot" + TOKEN + "/getFile?file_id=";
var urlFile = "https://api.telegram.org/file/bot" + TOKEN + "/";

var express = require('express')
var app = express()

var reproducidos = [];
var pendientes = [];
var sonando = false;

app.set('port', (process.env.PORT || 5000))

app.use(express.static(__dirname))
app.use('/video', serveIndex(__dirname + '/video/uploaded'));
app.use('/audio', serveIndex(__dirname + '/audio/uploaded'));
app.use('/texto', serveIndex(__dirname + '/texto'));
app.use('/foto', serveIndex(__dirname + '/foto/uploaded'));
app.use('/documentos', serveIndex(__dirname + '/documentos/uploaded'));

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
})

app.listen(app.get('port'), function() {
  console.log("corriendo en el puerto:" + app.get('port'))
})

const bot = new TelegramBot(TOKEN, {polling: true});

// Maximo de tamaño de 20 megas

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  let rawjson = fs.readFileSync('datos.json');
  let parsedjson = JSON.parse(rawjson);
  let obj = {
    message_id: msg.message_id,
    from_id: msg.from.id,
    from_name: msg.from.first_name + ' ' + msg.from.last_name,
    date: msg.date,
    type: '',
    file: ''
  };

  console.log(msg);

    if(msg.voice != null){
        obj.type = 'audio';
        descargaMedia(msg.voice, 'audio', 'oga', 'audio descargado');
    } else if(msg.photo != null){
        obj.type = 'foto';
        descargaMedia(msg.photo, 'foto', 'jpg', 'foto descargada');
    } else if(msg.video != null){
        obj.type = 'video';
        descargaMedia(msg.video, 'video', 'mp4', 'video descargado');
    } else if(msg.document != null){
        descargaDocumento(msg.document, 'documentos', '');
    } else if(msg.text != null){
        obj.type = 'texto';
        obj.file = msg.text;
        fs.writeFileSync( darStringArchivo('texto', 'txt'), msg.text);
        parsedjson.push(obj);
        fs.writeFileSync('datos.json', JSON.stringify(parsedjson));
//        bot.sendMessage(chatId, 'archive.org/details/radiolibrecc');
    }

    function darStringArchivo(carpeta, ext) {
        return carpeta + '/' + msg.from.id + '_' + msg.from.first_name + '_' + msg.date + '_' + msg.message_id + '.' + ext;
    }

    function descargaMedia(paquete, carpeta, ext, msj_confirmacion){
        var newUrl;
        if(carpeta == 'foto') newUrl = url + paquete[2].file_id;
        else newUrl = url + paquete.file_id;

        
        request.get({
            url: newUrl,
            json: true,
            headers: {'User-Agent': 'request'}
        }, (err, res, data) => {
            if (err) {
            console.log('Error:', err);
            } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
            } else {
                var fileUrl = urlFile + data.result.file_path;
                download(fileUrl).then(data => {
                    fs.writeFileSync(darStringArchivo(carpeta, ext), data);
                    if(carpeta == 'audio' && msg.voice.file_size < 57000){
                        pendientes.push('audio/off/' + darStringArchivo(carpeta, ext));
                        if(!sonando){
//                            reproducirStream();
                        }
                        bot.sendMessage(chatId, 'Puedes escuchar el audio en unos 5 minutos (dale recargar a la pagina): live.radiolibre.cc:8000/bot.mp3');
                    }
                    obj.file = darStringArchivo(carpeta, ext);
                    parsedjson.push(obj);
                    fs.writeFileSync('datos.json', JSON.stringify(parsedjson));
                    bot.sendMessage(chatId, 'rx');
                }).catch((err) => {console.log(err)});

            }
        });
    }

    function descargaDocumento(paquete, carpeta, msj_confirmacion){
        var newUrl;
        newUrl = url + paquete.file_id;
        
        request.get({
            url: newUrl,
            json: true,
            headers: {'User-Agent': 'request'}
        }, (err, res, data) => {
            if (err) {
            console.log('Error:', err);
            } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
            } else {
                var fileUrl = urlFile + data.result.file_path;
                download(fileUrl).then(data => {
                    fs.writeFileSync(darStringArchivo(carpeta, paquete.file_name), data);
                    obj.file = darStringArchivo(carpeta, paquete.file_name);
                    parsedjson.push(obj);
                    fs.writeFileSync('datos.json', JSON.stringify(parsedjson));
                    bot.sendMessage(chatId, 'ip local para revisar el historial: ' + ip.address() + ':' + app.get('port'));
                }).catch((err) => {console.log(err)});

            }
        });
    }
    
});

function reproducirStream() {
    if(pendientes.length > 0){
        sonando = true;
        var play = spawn('cvlc', ['--no-video', '--play-and-exit' , pendientes[0]]);
        play.on('exit', function() {
            reproducidos.push(pendientes[0]);
            pendientes = pendientes.slice(1);
            sonando = false;
            reproducirStream();
        });
    } else if(reproducidos.length > 0){
        sonando = true;
        var random = Math.floor(Math.random() * reproducidos.length);
        var play = spawn('cvlc', ['--no-video', '--play-and-exit' , reproducidos[random]]);
        play.on('exit', function() {
            sonando = false;
            reproducirStream();
        });
    }
}
