.PHONY: up down logs migrate backup shell-db

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose exec backend alembic upgrade head

backup:
	docker compose exec db pg_dump -U postgres billing > backup_$$(date +%Y%m%d_%H%M%S).sql

shell-db:
	docker compose exec db psql -U postgres billing
