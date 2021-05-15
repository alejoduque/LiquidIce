#!/bin/sh

/usr/local/bin/ia upload audioBot /home/pi/Telegram2Icecast/audio/*.mp3 --metadata="key:radiolibre"

#echo uploaded

mv /home/pi/Telegram2Icecast/audio/*.mp3 /home/pi/Telegram2Icecast/audio/uploaded/

exit
