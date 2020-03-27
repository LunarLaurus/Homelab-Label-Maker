FROM httpd:alpine
RUN apk add --no-cache git
WORKDIR /
RUN git clone https://github.com/DavidSpek/homelablabelmaker
RUN mv ./homelablabelmaker/* /usr/local/apache2/htdocs/
