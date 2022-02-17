#!/bin/sh

if [ $# -eq 0 ]
then
	docker-compose -f ./docker-compose.yaml up --build --force-recreate -d
elif [ $1 == "show" ]
then
	docker-compose -f ./docker-compose.yaml up --build --force-recreate
elif [ $1 == "local" ]
then
	docker-compose -f ./docker-compose.local.yaml up --build --force-recreate
fi
