
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



## **LiquidIce**  es un software que, instalado en una raspberryPi o computador personal, nos permite crear un archivo colectivo con los audios, fotos, documentos y videos compartidos a través de un grupo en la red de mensajería instantánea Telegram, al mismo tiempo que generamos con los audios una transmision a través de una radio online.

Todos los aportes que realicemos detro de un grupo de chat en Telegram: https://t.me/radiolibreCC pasaran a conformar un archivo de un proceso grupal o individual. 

**LiquidIce** es útil en las marchas, asambleas o juntanzas o para llevar una bitácora personal: https://liquidice.radiolibre.cc/

### Imagine un canal que conecta mensajes desde un grupo en **Telegram** al sistema de tranmision de radio online (http://red.radiolibre.cc) creando de paso un archivo en **Archive.org**. Y todo funcionando desde una pequeña **RaspberryPi** version 3 conectada en casa.


**LiquidIce** permite distribuir contenidos, por ejemplo: 
1. Los archivos de audio enviados al grupo (al undir el icono de microfono de Telegram son transmitidos en tiempo real  a todos los participantes del grupo como tambien por una emisora en Internet (via Icecast) --> https://live.radiolibre.cc/bot.mp3
Los audios son enviados, en orden de llegada a un streaming en Icecast<br> usando LiquidSoap, de ahi el nombre: LiquidIce


2. Las imagenes enviadas a traves de Telegram son archivadas en archive.org, por ejemplo: https://archive.org/details/fotoBot
Igualmente almacena Texto, Documentos, Videos y Audios en archive.org https://archive.org/details/@wiki-opdlv <br>

El código base desarrollado o integracion al bot de **Telegram** fue escrito por [Néstor Andrés Peña](http://www.nestorandres.com) para el laboratorio #TodoEsRadio realizado en CKWEB bajo la dirección de [alejoduque](https://github.com/alejoduque) con ayudas en desarrollo de [Juan kalashikov](https://github.com/kalashnikov2). Esta rama usa **LiquidSoap**, descartando la de version inicial, el uso de VLC ya que consumia todos los recursos de la **raspberryPi** y no era estable. Al momento de la publicacion de este software y de tener corriendolo sobre la rpi podemos apreciar lo estable que es:

```bash
uptime
 18:49:01 up 3 days, 20:29,  2 users,  load average: 0.48, 0.38, 0.36
```

<img src="https://i.pinimg.com/originals/fb/af/14/fbaf1432d8db6ba159a61173ea21b957.gif" width="440" height="280"/> <br>
### Corre desde una raspberryPi:
node-v8.9.0-linux-armv6l en rPi - https://nodejs.org/dist/v8.9.0/node-v8.9.0-linux-armv6l.tar.gz <br>

## Pasos a seguir para correr una instancia en un computador con Node.js instalado

Solicitar un Token para el bot de **Telegram** usando el botFather oficial de telegram.
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

En el directorio shell_scripts estan los archivos que se necesitan para terminar de configurar el sistema. Sirven como referencia para la ajustar cada uno de los servicios que corren automaticamene. Es necesario instalar LiquiSoap y agregar el .liq asi mismo ubicar los .sh en las carpetas de audio, foto, video, documentos y asegurarse de tener un crontab que los ejecute. En el bashrc estan las rutas a los scripts que ejecutan los servicios arriba mencionado de NodeJS.


```bash
audios2ice  bashrc  crontab_contents  liquidsoapliq  upa.sh  upd.sh  upf.sh  upv.sh
```
