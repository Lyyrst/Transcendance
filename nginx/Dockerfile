FROM nginx

COPY front/web /usr/share/nginx/html
COPY nginx/conf/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir cert
RUN openssl req -x509 -newkey rsa:2048 -keyout cert/transcendance.key -out cert/transcendance.crt -days 365 -nodes -subj "/C=FR/ST=FRANCE/L=ANGOULEME/CN=KBUTOR-B"
