#!/bin/sh

if [ $# -eq 0 ]
then
	docker-compose -f ./docker-compose.yaml up --build --force-recreate -d
elif [ $1 == "show" ]
then
	docker-compose -f ./docker-compose.yaml up --build --force-recreate
fi
