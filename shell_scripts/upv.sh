#!/bin/sh

/usr/local/bin/ia upload vidBot /home/pi/Telegram2Icecast/video/*.mp4 --metadata="key:radiolibre"

#echo uploaded

mv /home/pi/Telegram2Icecast/video/*.mp4 /home/pi/Telegram2Icecast/video/uploaded/

exit
