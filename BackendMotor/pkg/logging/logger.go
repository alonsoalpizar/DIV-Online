package logging

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func InitLogger() {
	// Crea carpeta si no existe
	_ = os.MkdirAll("/opt/div/logs", os.ModePerm)

	logFile, err := os.OpenFile("/opt/div/logs/div-motor.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		panic("❌ No se pudo abrir archivo de log principal: " + err.Error())
	}

	errorFile, err := os.OpenFile("/opt/div/logs/div-motor-error.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		panic("❌ No se pudo abrir archivo de log de errores: " + err.Error())
	}

	zerolog.TimeFieldFormat = time.RFC3339
	zerolog.TimestampFunc = func() time.Time {
		return time.Now().Local()
	}

	// Salida principal combinada
	multi := zerolog.MultiLevelWriter(os.Stdout, logFile)
	log.Logger = zerolog.New(multi).With().Timestamp().Logger()

	// Logger separado para errores graves
	errorLogger := zerolog.New(errorFile).With().Timestamp().Logger()
	log.Logger = log.Logger.Hook(zerolog.HookFunc(func(e *zerolog.Event, level zerolog.Level, msg string) {
		if level >= zerolog.ErrorLevel {
			errorLogger.WithLevel(level).Msg(msg)
		}
	}))
}
