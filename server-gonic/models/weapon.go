package models

import (
	"gorm.io/gorm"
)

type Weapon struct {
	gorm.Model
	Title            string         `gorm:"size:255;not null;unique" json:"title"`
	WeaponCategoryId int            `gorm:"not null;"`
	WeaponCategory   WeaponCategory `gorm:"foreignKey:WeaponCategoryId"`
	Users            []User         `gorm:"many2many:user_arsenal;"`
}
