
```bash

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

```



## LiquidIce es un software que instalado en una raspberryPi o computador personal nos permite crear un archivo colectivo al mismo tiempo que generamos, con los audios compartidos, una transmision a traves de una radio online. Todos los aportes que realicemos detro de un grupo de chat en la red de mensajeria instantanea y anonima Telegram: https://t.me/radiolibreCC pasaran a conformar un archivo. Registro de un proceso grupal o individual. Util en las marchas o para llevar una bitacora personal donde quedan fotos, videos, audios y documentos.


### Pienselo como un puente que conecta mensajes desde Telegram al software Icecast de una radio online (http://red.radiolibre.cc) dejando de paso un archivo en Archive.org. Todo funcionando desde una RaspberryPi version 3 (pequeño computador de valor economico y bajo consumo electrico).


LiquidIce permite distribuir contenidos, por ejemplo: 
1. Los archivos de audio enviados al grupo (al undir el icono de microfono de Telegram son transmitidos en tiempo real  a todos los participantes del grupo como tambien por una emisora en Internet (via Icecast) --> https://live.radiolibre.cc/bot.mp3
Los audios son enviados, en orden de llegada a un streaming en Icecast<br> usando LiquidSoap, de ahi el nombre: LiquidIce


2. Las imagenes enviadas a traves de Telegram son archivadas en archive.org, por ejemplo: https://archive.org/details/fotoBot
Igualmente almacena Texto, Documentos, Videos y Audios en archive.org https://archive.org/details/@wiki-opdlv <br>

El código base desarrollado o integracion al bot de Telegram fue escrito por [Néstor Andrés Peña](http://www.nestorandres.com) para el laboratorio #TodoEsRadio realizado en CKWEB bajo la dirección de [alejoduque](https://github.com/alejoduque) con ayudas en desarrollo de [Juan kalashikov](https://github.com/kalashnikov2). Esta rama usa LiquidSoap, descartando la version 1 que usaba VLC y consumia casi todos los recursos de la raspberryPi.


<img src="https://i.pinimg.com/originals/fb/af/14/fbaf1432d8db6ba159a61173ea21b957.gif" width="440" height="280"/> <br>
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


