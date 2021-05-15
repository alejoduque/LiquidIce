      ___                   ___           ___                       ___                       ___           ___     
     /\__\      ___        /\  \         /\__\          ___        /\  \          ___        /\  \         /\  \    
    /:/  /     /\  \      /::\  \       /:/  /         /\  \      /::\  \        /\  \      /::\  \       /::\  \   
   /:/  /      \:\  \    /:/\:\  \     /:/  /          \:\  \    /:/\:\  \       \:\  \    /:/\:\  \     /:/\:\  \  
  /:/  /       /::\__\   \:\~\:\  \   /:/  /  ___      /::\__\  /:/  \:\__\      /::\__\  /:/  \:\  \   /::\~\:\  \ 
 /:/__/     __/:/\/__/    \:\ \:\__\ /:/__/  /\__\  __/:/\/__/ /:/__/ \:|__|  __/:/\/__/ /:/__/ \:\__\ /:/\:\ \:\__\
 \:\  \    /\/:/  /        \:\/:/  / \:\  \ /:/  / /\/:/  /    \:\  \ /:/  / /\/:/  /    \:\  \  \/__/ \:\~\:\ \/__/
  \:\  \   \::/__/          \::/  /   \:\  /:/  /  \::/__/      \:\  /:/  /  \::/__/      \:\  \        \:\ \:\__\  
   \:\  \   \:\__\          /:/  /     \:\/:/  /    \:\__\       \:\/:/  /    \:\__\       \:\  \        \:\ \/__/  
    \:\__\   \/__/         /:/  /       \::/  /      \/__/        \::/__/      \/__/        \:\__\        \:\__\    
     \/__/                 \/__/         \/__/                     ~~                        \/__/         \/__/    




#<img src="#" /> <br>
# Puente de Telegram a Icecast (http://red.radiolibre.cc) pasando por Archive.org

LiquidIce es un Software que permite crear una radio online a partir de los aportes de un grupo de chat que opeara en la red libre de mensajeria instantanea y anonima conocida como Telegram (similar al Whatsapp de FakeBook): https://t.me/radiolibreCC 

LiquidIce permite distribuir contenidos, por ejemplo: 
1. Los archivos de audio enviados al grupo (al undir el icono de microfono de Telegram son transmitidos en tiempo real  a todos los participantes del grupo como tambien por una emisora en Internet (via Icecast) --> https://live.radiolibre.cc/bot.mp3
2. Las imagenes enviadas a traves de Telegram son archivadas en archive.org, por ejemplo: https://archive.org/details/fotoBot


¿Como funciona? Un bot (script) de Telegram captura todo lo que le envias y:

-Alamacena (Text,Docs,Video,Audio) en archive.org https://archive.org/details/@wiki-opdlv <br>
-Los audios son enviados, en orden de llegada a un streaming en icecast<br>

Codigo base desarrollado por [Néstor Andrés Peña](http://www.nestorandres.com) para el laboratorio #TodoEsRadio realizado en CKWEB bajo la direccion de [alejoduque](https://github.com/alejoduque) con ayudas en desarrollo de [Juan kalashikov](https://github.com/kalashnikov2).


### Corre desde una raspberryPi:
node-v8.9.0-linux-armv6l en rPi - https://nodejs.org/dist/v8.9.0/node-v8.9.0-linux-armv6l.tar.gz <br>

## Pasos a seguir para correr una instancia en un computador con Node.js instalado

Solicitar un Token para el bot de Telegram usando el botFather oficial de telegram.
Una vez se haya creado el bot, crear un nuevo archivo secret.js en la carpeta raíz con el siguiente contenido:

```bash
TOKEN = "aca-va-el-token-que-genero-el-botfather"
```

Antes de correr la aplicación por primera vez es necesario instalar las dependecias:

```bash
npm install
```

Con las dependencias instaladas ya se puede correr el script con:

```bash
node t2i.js
```
