package game

type Vector struct {
	X float32
	Y float32
	Z float32
}

type WallWindow struct {
	Base   float32
	Left   float32
	Width  float32
	Height float32
}

type Wall struct {
	Corner  Vector
	Width   float32
	Height  float32
	Thick   float32
	Windows []WallWindow
}

type Building struct {
	Walls []Wall
}
