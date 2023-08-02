package controllers

import (
	"net/http"
	"shooter/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

type user struct {
	ID       int             `json:"id"`
	Username string          `json:"username"`
	Weapons  []models.Weapon `gorm:"many2many:user_arsenal;" json:"weapons"`
}

func GetUsersList(c *gin.Context) {
	users := []user{}
	result := models.DB.Model(models.User{}).Find(&users)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error})
	}
	c.JSON(http.StatusOK, users)
}

func GetUser(c *gin.Context) {
	userId, _ := strconv.Atoi(c.Param("id"))
	user := user{}
	result := models.DB.Preload("Weapons").Model(models.User{}).Find(&user, userId)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, user)
	} else {
		c.JSON(http.StatusOK, user)
	}
}
