NAME = 42-transcendance
COMPOSE = docker-compose.yml

all: build up

volume:
	@mkdir -p data/postgres
	@mkdir -p data/django

build: volume
	@docker compose -p $(NAME) -f $(COMPOSE) build

up: 
	@docker compose -p $(NAME) -f $(COMPOSE) up

down:
	@docker compose -p $(NAME) -f $(COMPOSE) down --volumes

clean: down
	rm -rf data/postgres
	rm -rf data/django

re: clean all

.PHONY: volume all build up down clean re