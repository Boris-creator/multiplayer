package game

import (
	"errors"
	"fmt"
	"math"
	"math/rand"

	"golang.org/x/exp/slices"
)

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}
type GameState struct {
	Locations map[string]*Position
}

const fieldWidth = 9
const fieldHeight = 9

func (state *GameState) MovePlayer(player string, step Position) *Position {
	location := state.Locations[player]
	x := location.X + step.X
	y := location.Y + step.Y

	if x < 0 || x > fieldWidth || y < 0 || y > fieldHeight {
		return location
	}

	for playmate, position := range state.Locations {
		fmt.Println(position, location)
		if playmate == player {
			continue
		}

		if position.X == x && position.Y == y {
			return location
		}
	}
	location.X = x
	location.Y = y
	return location
}

func (state *GameState) RandomLocation() (*Position, error) {
	occupied := []int{}
	open := []int{}
	for _, position := range state.Locations {
		occupied = append(occupied, position.Y*fieldWidth+position.X)
	}
	for i := 0; i < fieldWidth*fieldHeight; i++ {
		if !slices.Contains(occupied, i) {
			open = append(open, i)
		}
	}
	if len(open) == 0 {
		return nil, errors.New("")
	}
	randomIndex := open[rand.Intn(len(open))]
	return &Position{Y: int(math.Floor(float64(randomIndex) / fieldWidth)), X: randomIndex % fieldWidth}, nil
}

func NewGame() *GameState {
	locations := map[string]*Position{}

	return &GameState{Locations: locations}
}
