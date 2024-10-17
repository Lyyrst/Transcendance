#!/bin/bash

while ! bash -c "PGPASSWORD='$DB_PASS' psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME <<< '\q'" > /dev/null 2> /dev/null; do
	echo "Waiting for PostgreSQL...";
	sleep 1;
done;

python manage.py makemigrations
python manage.py migrate

exec python manage.py runserver 0.0.0.0:8000