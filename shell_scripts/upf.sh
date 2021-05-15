#!/bin/sh

/usr/local/bin/ia upload fotoBot /home/pi/Telegram2Icecast/foto/*.jpg --metadata="key:radiolibre"

#echo uploaded

mv /home/pi/Telegram2Icecast/foto/*.jpg /home/pi/Telegram2Icecast/foto/uploaded/

exit
