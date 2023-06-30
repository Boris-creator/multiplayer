FROM postgres:14.8

FROM golang:1.18.1

WORKDIR /app

COPY ./ ./

RUN go build

EXPOSE 8080

CMD [ "./shooter" ]