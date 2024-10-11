
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



## **LiquidIce** es un software que, instalado en una raspberryPi o computador personal, nos permite crear un archivo colectivo conformado a partir de audios, fotos, documentos y videos compartidos via **Telegram**. Con los audios generamos una transmisión radial a través de http://red.radiolibre.cc

Todos los aportes que realicemos detro de un grupo de chat en Telegram pasaran a conformar un archivo de un proceso grupal o individual. 

**LiquidIce** es útil para trabajos grupales y colaborativos. Asambleas y juntanzas o para llevar una bitácora personal.

### Imagine un canal que conecta mensajes desde un grupo en **Telegram** al sistema de tranmision de radio online (http://red.radiolibre.cc) creando de paso un archivo en **Archive.org**. Y todo funcionando desde una pequeña **RaspberryPi** conectada en su casa.


**LiquidIce** permite distribuir contenidos, por ejemplo: 
1. Los archivos de audio enviados al grupo (al presionar el icono de microfono de Telegram son transmitidos en tiempo real a todos los participantes del grupo como tambien por una emisora en Internet (via Icecast) --> https://live.radiolibre.cc/bot.mp3
Los audios son enviados, en orden de llegada a un streaming en Icecast<br> usando LiquidSoap, de ahi el nombre: LiquidIce


2. Las imagenes enviadas a traves de Telegram son archivadas en archive.org, por ejemplo: https://archive.org/details/fotoBot
Igualmente almacena Texto, Documentos, Videos y Audios en archive.org https://archive.org/details/@wiki-opdlv <br>

El código base para la integracion del bot de **Telegram** fue escrito por [Néstor Andrés Peña](http://www.nestorandres.com) para el laboratorio #TodoEsRadio realizado en CKWEB bajo la dirección de [alejoduque](https://github.com/alejoduque) con ayudas, aportes y comentarios en desarrollo de [Juan kalashikov](https://github.com/kalashnikov2). Esta rama fue modificada por aduque para utilizar **LiquidSoap**, descartando cVLC de la version inicial ya que consumia todos los recursos de la **raspberryPi v3b** haciendola inestable. Igualmente se realizaron multiples cambios en el archivo que corre node y una actualizacion gracias a claude.ai.

```bash
uptime
 18:49:01 up 3 days, 20:29,  2 users,  load average: 0.48, 0.38, 0.36

                                           
                                           
.                          . --.--         
|   o               o      |   |           
|   .   .-., .  .   .   .-.|   |   .-. .-. 
|   |  (   | |  |   |  (   |   |  (   (.-' 
`--' `- `-'| `--`--' `- `-'`---'-- `-' `--'
          -|-                              
           '                               


```

<img src="https://i.pinimg.com/originals/fb/af/14/fbaf1432d8db6ba159a61173ea21b957.gif" width="440" height="280"/> <br>
### Corre desde una raspberryPi v3b en adelante:

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
