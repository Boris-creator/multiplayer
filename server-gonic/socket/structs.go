package socket

import (
	"shooter/game"

	"github.com/gorilla/websocket"
)

// UserStruct is used for sending users with socket id
type UserStruct struct {
	ClientID string `json:"clientId"`
	UserID   int    `json:"userId"`
	UserName string `json:"userName"`
}

type UserGameLocation struct {
	User     UserStruct     `json:"user"`
	Position *game.Position `json:"position"`
}

// SocketEventStruct struct of socket events
type SocketEventStruct struct {
	EventName    string                 `json:"eventName"`
	EventPayload map[string]interface{} `json:"eventPayload"`
}

type MessageEventPayload struct {
	UserID  int    `json:"userID"`
	Message string `json:"message"`
}

type PositionEventPayload struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub                 *Hub
	webSocketConnection *websocket.Conn
	send                chan SocketEventStruct
	clientId            string
	userID              int
	userName            string
}

// JoinDisconnectPayload will have struct for payload of join disconnect
type JoinDisconnectPayload struct {
	Users  []UserStruct `json:"users"`
	UserID string       `json:"clientId"`
}

type JoinDisconnectGameCommonPayload struct {
	Joining       []UserGameLocation `json:"joining"`
	Disconnecting []UserStruct       `json:"disconnecting"`
}

type JoinDisconnectGameGuestPayload struct {
	Connected []UserGameLocation `json:"connected"`
}
