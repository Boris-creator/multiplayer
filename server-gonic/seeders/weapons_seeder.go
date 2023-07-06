package seeding

import (
	"shooter/models"
)

func Seed() {
	weaponCategories := []models.WeaponCategory{
		{Title: "shotguns"},
	}
	weapons := []models.Weapon{
		{Title: "Remington", WeaponCategoryId: 1},
	}

	transaction := models.DB.Begin()

	queryObject := map[string]interface{}{}
	queryResult := models.DB.Model(models.WeaponCategory{}).Limit(1).Find(&queryObject)

	if queryResult.RowsAffected == 0 {
		transaction.Model(models.WeaponCategory{}).Create(weaponCategories)
	}

	queryResult = transaction.Model(models.Weapon{}).Limit(1).Find(&queryObject)
	if queryResult.RowsAffected == 0 {
		transaction.Model(models.Weapon{}).Create(weapons)
	}
	transaction.Commit()
}
