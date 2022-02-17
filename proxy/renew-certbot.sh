#!/bin/bash

docker run --rm --name noti-certbot -v '/etc/letsencrypt:/etc/letsencrypt' -v '/var/log/letsencrypt:/var/log/letsencrypt' -v '/etc/letsencrypt/data:/var/www/certbot' certbot/certbot renew --server https://acme-v02.api.letsencrypt.org/directory --cert-name noti.42cadet.kr

# add crontab (At 04:00 on Sunday)
# 0 4 * * 0 /path_to_here/renew-certbot.sh
