DOCKER_CONTAINER_NAME = web
DOCKER = /usr/bin/docker

up:
	${DOCKER} compose up -d
	@echo "Container ip:" 
	@docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' api-web-1

build:
	${DOCKER} compose up --build -d
	@docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' api-web-1

down:
	${DOCKER} compose down

logs:
	${DOCKER} compose logs -f

run:
	${DOCKER} compose run \
    -it \
    --remove-orphans \
    ${DOCKER_CONTAINER_NAME} \
    /bin/bash

docs:
	${DOCKER} compose run \
		-it \
		--remove-orphans \
		${DOCKER_CONTAINER_NAME} \
		rake doc:export

create:
	-${DOCKER} compose run \
		-it \
		--remove-orphans \
		${DOCKER_CONTAINER_NAME} \
		rake db:create

migrate:
	-${DOCKER} compose run \
		-it \
		--remove-orphans \
		${DOCKER_CONTAINER_NAME} \
		rake db:migrate

seed: create migrate
	-${DOCKER} compose run \
		-it \
		--remove-orphans \
		${DOCKER_CONTAINER_NAME} \
		rake db:seed

drop:
	-${DOCKER} compose run \
		-it \
		--remove-orphans \
		${DOCKER_CONTAINER_NAME} \
		rake db:drop

test:
	-${DOCKER} compose run \
		-it \
		--remove-orphans \
		${DOCKER_CONTAINER_NAME} \
		bundle exec rspec $(filter-out $@,$(MAKECMDGOALS))

console:
	${DOCKER} compose run \
		${DOCKER_CONTAINER_NAME} \
		irb -r ./config/environment.rb

re: down build re_db

re_db: drop create migrate

.PHONY: docs test migrate
