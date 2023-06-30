package socket

import (
	"encoding/json"
	"log"
	"shooter/game"

	"golang.org/x/exp/maps"
	"golang.org/x/exp/slices"
)

func handleSocketPayloadEvents(client *Client, socketEventPayload SocketEventStruct) {
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
		if slices.Contains(maps.Keys(hub.game.Locations), client.clientID) {
			return
		}

		hub.game.Locations[client.clientID], _ = hub.game.RandomLocation()

		var eventPayload map[string]interface{}

		joinGameCommonPayload := JoinDisconnectGameCommonPayload{
			Joining: []UserGameLocation{
				{
					User: UserStruct{
						ClientID: client.clientID,
						UserID:   client.userID,
						UserName: client.userName,
					},
					Position: hub.game.Locations[client.clientID],
				},
			},
			Disconnecting: []UserStruct{},
		}
		var connected = []UserGameLocation{}
		for clientId, position := range hub.game.Locations {
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

		stepX := int(socketEventPayload.EventPayload["x"].(float64))
		stepY := int(socketEventPayload.EventPayload["y"].(float64))
		_, isInGame := client.hub.game.Locations[client.clientID]
		if !isInGame {
			return
		}

		updatedPosition := client.hub.game.MovePlayer(client.clientID, game.Position{X: stepX, Y: stepY})
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
