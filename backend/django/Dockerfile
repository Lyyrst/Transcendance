FROM python:3.12

EXPOSE 8000

RUN apt-get update -y && apt-get upgrade -y

RUN apt-get install -y \
    libpq-dev \
    build-essential \
    postgresql-client

RUN mkdir transcendence
WORKDIR /transcendence

COPY requirements /transcendence/.
RUN pip install --no-cache-dir -r requirements

COPY workspace/ .
COPY script.sh .

RUN chmod +x script.sh

CMD ["bash", "/transcendence/script.sh"]
