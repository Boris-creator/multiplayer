// @author Shashank Tiwari, modified by me

package socket

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gookit/validate"
	"github.com/gorilla/websocket"
	"golang.org/x/exp/maps"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

// CreateNewSocketUser creates a new socket user
func CreateNewSocketUser(hub *Hub, connection *websocket.Conn, userId int, userName string) {
	uniqueID := uuid.New()
	client := &Client{
		hub:                 hub,
		webSocketConnection: connection,
		send:                make(chan SocketEventStruct),
		userID:              userId,
		userName:            userName,
		clientId:            uniqueID.String(),
	}

	go client.writePump()
	go client.readPump()

	client.hub.register <- client
}

// HandleUserRegisterEvent will handle the Join event for New socket users
func HandleUserRegisterEvent(hub *Hub, client *Client) {
	for connected, online := range hub.clients {
		if connected.userID == client.userID && online {
			return
		}
	}

	hub.clients[client] = true

	handleSocketPayloadEvents(client, SocketEventStruct{
		EventName:    "join",
		EventPayload: map[string]interface{}{"userID": client.userID},
	})
}

// HandleUserDisconnectEvent will handle the Disconnect event for socket users
func HandleUserDisconnectEvent(hub *Hub, client *Client) {
	_, ok := hub.clients[client]
	if ok {
		delete(hub.clients, client)
		close(client.send)

		handleSocketPayloadEvents(client, SocketEventStruct{
			EventName:    "disconnect",
			EventPayload: map[string]interface{}{"userID": client.userID},
		})
	}
}
func BroadcastSocketEventToClients(hub *Hub, payload SocketEventStruct, clients []*Client) {
	for _, client := range clients {
		select {
		case client.send <- payload:
		default:
			close(client.send)
			delete(hub.clients, client)
		}
	}
}

// EmitToSpecificClient will emit the socket event to specific socket user
func EmitToSpecificClient(hub *Hub, payload SocketEventStruct, clientId string) {
	for client := range hub.clients {
		if client.clientId == clientId {
			BroadcastSocketEventToClients(hub, payload, []*Client{client})
			break
		}
	}
}

// BroadcastSocketEventToAllClient will emit the socket events to all socket users
func BroadcastSocketEventToAllClient(hub *Hub, payload SocketEventStruct) {
	BroadcastSocketEventToClients(hub, payload, maps.Keys(hub.clients))
}

func BroadcastSocketEventToAllExceptOne(hub *Hub, payload SocketEventStruct, clientId string) {
	clients := []*Client{}
	for client := range hub.clients {
		if client.clientId != clientId {
			clients = append(clients, client)
		}
	}
	BroadcastSocketEventToClients(hub, payload, clients)
}

func getUserByClientID(hub *Hub, clientId string) UserStruct {
	var user UserStruct
	user.ClientID = clientId
	for client := range hub.clients {
		if client.clientId == clientId {
			user.UserID = client.userID
			user.UserName = client.userName
		}
	}
	return user
}

func getAllConnectedUsers(hub *Hub) []UserStruct {
	var users []UserStruct
	for singleClient := range hub.clients {
		users = append(users, UserStruct{
			UserID:   singleClient.userID,
			ClientID: singleClient.clientId,
			UserName: singleClient.userName,
		})
	}
	return users
}

func validateEvent(e SocketEventStruct) bool {
	validator := validate.Map(e.EventPayload)

	if e.EventName == "message" {
		validator.StringRule("message", "string|required")
		validator.StringRule("userID", "string|required")
		isValid := validator.Validate()
		if !isValid {
			fmt.Println(validator.Errors)
		}
		return isValid
	}
	if e.EventName == "move" {
		validator.StringRule("x", "float|between:-1,1")
		validator.StringRule("y", "float|between:-1,1")
		isValid := validator.Validate()
		if !isValid {
			fmt.Println(validator.Errors)
		}
		return isValid
	}
	return true
}

func (c *Client) readPump() {

	defer unRegisterAndCloseConnection(c)

	setSocketPayloadReadConfig(c)

	for {
		var socketEventPayload SocketEventStruct
		_, payload, err := c.webSocketConnection.ReadMessage()

		decoder := json.NewDecoder(bytes.NewReader(payload))
		decoderErr := decoder.Decode(&socketEventPayload)

		if decoderErr != nil {
			log.Printf("error: %v", decoderErr)
			break
		}

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error ===: %v", err)
			}
			break
		}

		handleSocketPayloadEvents(c, socketEventPayload)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.webSocketConnection.Close()
	}()
	for {
		select {
		case payload, ok := <-c.send:
			reqBodyBytes := new(bytes.Buffer)
			json.NewEncoder(reqBodyBytes).Encode(payload)
			finalPayload := reqBodyBytes.Bytes()

			c.webSocketConnection.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.webSocketConnection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.webSocketConnection.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			w.Write(finalPayload)

			n := len(c.send)
			for i := 0; i < n; i++ {
				json.NewEncoder(reqBodyBytes).Encode(<-c.send)
				w.Write(reqBodyBytes.Bytes())
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.webSocketConnection.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.webSocketConnection.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func unRegisterAndCloseConnection(c *Client) {
	c.hub.unregister <- c
	c.webSocketConnection.Close()
}

func setSocketPayloadReadConfig(c *Client) {
	c.webSocketConnection.SetReadLimit(maxMessageSize)
	c.webSocketConnection.SetReadDeadline(time.Now().Add(pongWait))
	c.webSocketConnection.SetPongHandler(func(string) error { c.webSocketConnection.SetReadDeadline(time.Now().Add(pongWait)); return nil })
}
