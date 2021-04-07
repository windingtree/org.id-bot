#!/usr/bin/env bash

# Prepare directories
mkdir -p ~/orgidBot/redisData

docker-compose -f $PWD/scripts/servers/docker-compose.yml up
