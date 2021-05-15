#!/bin/sh

/usr/local/bin/ia upload docBot /home/pi/Telegram2Icecast/documentos/*.pdf --metadata="key:radiolibre"

#echo uploaded

mv /home/pi/Telegram2Icecast/documentos/*.pdf /home/pi/Telegram2Icecast/documentos/uploaded/

exit
