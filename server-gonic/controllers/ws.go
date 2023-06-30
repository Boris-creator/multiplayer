package controllers

import (
	"log"
	"net/http"
	"shooter/socket"
	jwt_token "shooter/utils/jwt"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func WS(c *gin.Context, hub *socket.Hub) {

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	// Upgrading the HTTP connection socket connection
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	connection, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}

	userData, err := jwt_token.ExtractTokenData(c)
	if err != nil {
		log.Println(err)
		return
	}
	socket.CreateNewSocketUser(hub, connection, int(userData.UserId), userData.UserName)

}
