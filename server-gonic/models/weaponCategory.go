package models

import (
	"gorm.io/gorm"
)

type WeaponCategory struct {
	gorm.Model
	Title string `gorm:"size:255;not null;unique" json:"title"`
}
