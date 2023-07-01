package socket

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"shooter/game"

	"github.com/go-redis/redis/v8"
	"golang.org/x/exp/maps"
	"golang.org/x/exp/slices"
)

func handleSocketPayloadEvents(client *Client, socketEventPayload SocketEventStruct) {
	ctx := context.Background()
	redisGameKey := "game"

	var socketEventResponse SocketEventStruct
	if !validateEvent(socketEventPayload) {
		return
	}
	switch socketEventPayload.EventName {
	case "join":
		log.Printf("Join Event triggered")
		var eventPayload map[string]interface{}

		joinDisconnectPayload := JoinDisconnectPayload{
			UserID: client.clientID,
			Users:  getAllConnectedUsers(client.hub),
		}
		marshalled, _ := json.Marshal(joinDisconnectPayload)
		json.Unmarshal(marshalled, &eventPayload)

		BroadcastSocketEventToAllClient(client.hub, SocketEventStruct{
			EventName:    socketEventPayload.EventName,
			EventPayload: eventPayload,
		})

	case "disconnect":
		log.Printf("Disconnect Event triggered")

		var eventPayload map[string]interface{}
		disconnectPayload := JoinDisconnectPayload{
			UserID: client.clientID,
			Users:  getAllConnectedUsers(client.hub),
		}
		marshalled, _ := json.Marshal(disconnectPayload)
		json.Unmarshal(marshalled, &eventPayload)

		BroadcastSocketEventToAllClient(client.hub, SocketEventStruct{
			EventName:    socketEventPayload.EventName,
			EventPayload: eventPayload,
		})

	case "joinGame":
		log.Printf("Game Join Event triggered")

		hub := client.hub
		hubGame := game.NewGame()
		savedGameState, err := hub.db.Get(ctx, redisGameKey).Result()
		if err != redis.Nil {
			hubGame.UnmarshalBinary([]byte(savedGameState))
		}
		if slices.Contains(maps.Keys(hubGame.Locations), client.clientID) {
			return
		}

		hubGame.Locations[client.clientID], _ = hubGame.RandomLocation()

		saved, _ := hubGame.MarshalBinary()
		saveError := hub.db.Set(ctx, redisGameKey, saved, 0)
		if saveError.Err() != nil {
			fmt.Println(saveError)
		}

		var eventPayload map[string]interface{}

		joinGameCommonPayload := JoinDisconnectGameCommonPayload{
			Joining: []UserGameLocation{
				{
					User: UserStruct{
						ClientID: client.clientID,
						UserID:   client.userID,
						UserName: client.userName,
					},
					Position: hubGame.Locations[client.clientID],
				},
			},
			Disconnecting: []UserStruct{},
		}
		var connected = []UserGameLocation{}
		for clientId, position := range hubGame.Locations {
			connected = append(connected, UserGameLocation{
				User:     getUserByClientID(hub, clientId),
				Position: position,
			})
		}
		joinGameGuestPayload := JoinDisconnectGameGuestPayload{
			Connected: connected,
		}

		marshalledCommon, _ := json.Marshal(joinGameCommonPayload)
		json.Unmarshal(marshalledCommon, &eventPayload)
		BroadcastSocketEventToAllExceptOne(client.hub, SocketEventStruct{
			EventName:    socketEventPayload.EventName,
			EventPayload: eventPayload,
		},
			client.clientID)
		marshalledForGuest, _ := json.Marshal(joinGameGuestPayload)
		eventPayload = map[string]interface{}{}
		json.Unmarshal(marshalledForGuest, &eventPayload)
		EmitToSpecificClient(client.hub, SocketEventStruct{
			EventName:    "gameState",
			EventPayload: eventPayload,
		}, client.clientID)

	case "message":

		log.Printf("Message Event triggered")
		selectedUserID := socketEventPayload.EventPayload["userID"].(string)
		socketEventResponse.EventName = "message response"
		socketEventResponse.EventPayload = map[string]interface{}{
			"userID":   getUserByClientID(client.hub, selectedUserID).UserID,
			"message":  socketEventPayload.EventPayload["message"],
			"clientID": selectedUserID,
			"fromID":   client.userID,
		}
		EmitToSpecificClient(client.hub, socketEventResponse, selectedUserID)

	case "move":
		log.Printf("Move Event triggered")

		hubGame := game.NewGame()
		savedGameState, err := client.hub.db.Get(ctx, redisGameKey).Result()
		if err != redis.Nil {
			hubGame.UnmarshalBinary([]byte(savedGameState))
		}
		stepX := int(socketEventPayload.EventPayload["x"].(float64))
		stepY := int(socketEventPayload.EventPayload["y"].(float64))
		_, isInGame := hubGame.Locations[client.clientID]
		if !isInGame {
			return
		}

		updatedPosition := hubGame.MovePlayer(client.clientID, game.Position{X: stepX, Y: stepY})

		saved, _ := hubGame.MarshalBinary()
		saveError := client.hub.db.Set(ctx, redisGameKey, saved, 0)
		if saveError.Err() != nil {
			fmt.Println(saveError)
		}

		socketEventResponse.EventName = "move"
		socketEventResponse.EventPayload = map[string]interface{}{
			"x":        updatedPosition.X,
			"y":        updatedPosition.Y,
			"clientID": client.clientID,
			"userName": client.userName,
		}
		BroadcastSocketEventToAllClient(client.hub, SocketEventStruct{
			EventName:    socketEventResponse.EventName,
			EventPayload: socketEventResponse.EventPayload,
		})
	}
}
