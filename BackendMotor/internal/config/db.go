package config

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var DB *pgxpool.Pool

func InitDB() error {
	err := godotenv.Load()
	if err != nil {
		return fmt.Errorf("Error cargando .env: %w", err)
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return fmt.Errorf("Error creando pool de conexión: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("No se pudo conectar a la base de datos: %w", err)
	}

	DB = pool
	return nil

}

func GetDB() *pgxpool.Pool {
	return DB
}
