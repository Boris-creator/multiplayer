package socket

import (
	"shooter/game"

	"github.com/go-redis/redis/v8"
)

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	clients    map[*Client]bool
	game       game.GameState
	db         redis.Client
	register   chan *Client
	unregister chan *Client
}

// NewHub will will give an instance of an Hub
func NewHub(db redis.Client) *Hub {
	return &Hub{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		game:       *game.NewGame(),
		db:         db,
	}
}

// Run will execute Go Routines to check incoming Socket events
func (hub *Hub) Run() {
	for {
		select {
		case client := <-hub.register:
			HandleUserRegisterEvent(hub, client)

		case client := <-hub.unregister:
			HandleUserDisconnectEvent(hub, client)
		}
	}
}
