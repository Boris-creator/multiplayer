package main

import (
	"fmt"
	"log"
	"os"
	"path"
	"shooter/controllers"
	"shooter/models"
	"shooter/socket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	dir, _ := os.Getwd()
	port := os.Getenv("APP_PORT")
	models.ConnectDataBase()
	r := gin.Default()
	r.LoadHTMLGlob(path.Join(dir, "./templates/*.*"))

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3001"}
	r.Use(cors.New(corsConfig))

	hub := socket.NewHub()
	go hub.Run()

	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
	})

	r.GET("/ws", func(c *gin.Context) {
		controllers.WS(c, hub)
	})

	public := r.Group("/api")

	public.POST("/register", controllers.Register)
	public.POST("/login", controllers.Login)

	r.Run(fmt.Sprintf("localhost:%s", port))
}
