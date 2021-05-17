#!/bin/sh
#/usr/bin/rsync -vrlD --ignore-existing --exclude 'secret.js' --exclude 'audios_en_ciclo' --exclude 'liquidice' --exclude 'audio/audios2ice' --exclude 'audio/audios_en_ciclo.sh' -e 'ssh -p 8888' --progress Telegram2Icecast/ root@radiolibre.cc:/var/www/OPDLV
#/usr/bin/rsync -vrlD --existing --exclude 'secret.js' --exclude 'audios_en_ciclo' --exclude 'liquidice' --exclude 'audio/audios2ice' --exclude 'audio/audios_en_ciclo.sh' -e 'ssh -i /home/pi/.ssh/id_rsa -p 8888' --progress Telegram2Icecast/ root@radiolibre.cc:/var/www/OPDLV


/usr/bin/rsync -vrlD --size-only --exclude 'secret.js' --exclude 'audios_en_ciclo' --exclude 'liquidice' --exclude 'audio/audios2ice' --exclude 'audio/audios_en_ciclo.sh' -e 'ssh -i /home/pi/.ssh/id_rsa -p 8888' --progress Telegram2Icecast/ root@radiolibre.cc:/var/www/OPDLV

echo uploaded
exit
