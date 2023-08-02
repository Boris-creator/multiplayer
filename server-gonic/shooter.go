package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"shooter/controllers"
	"shooter/models"
	seeding "shooter/seeders"
	"shooter/socket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	redis "github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
)

func main() {
	ctx := context.Background()
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	dir, _ := os.Getwd()
	port := os.Getenv("APP_PORT")
	models.ConnectDataBase()
	seeding.Seed()
	r := gin.Default()
	r.LoadHTMLGlob(path.Join(dir, "./templates/*.*"))

	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3001"}
	corsConfig.AllowMethods = []string{http.MethodGet, http.MethodPatch, http.MethodPost, http.MethodHead, http.MethodDelete, http.MethodOptions}
	r.Use(cors.New(corsConfig))

	redisClient := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_PORT"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	if redisClient == nil {
		log.Fatalf("Error connecting Redis")
	}
	redisClient.FlushAll(ctx)
	hub := socket.NewHub(*redisClient)
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

	userRouter := public.Group("/users")
	userRouter.GET("", controllers.GetUsersList)
	userRouter.GET("/:id", controllers.GetUser)

	r.Run(fmt.Sprintf("localhost:%s", port))
}
