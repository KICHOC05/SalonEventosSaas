package com.example.demo.common.exception;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        // Entidad no encontrada
        @ExceptionHandler(EntityNotFoundException.class)
        public ResponseEntity<?> handleNotFound(EntityNotFoundException ex) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of(
                                                "timestamp", LocalDateTime.now(),
                                                "status", 404,
                                                "error", "Not Found",
                                                "message", ex.getMessage()));
        }

        // Errores de validación de negocio (imagen inválida, tamaño, etc.)
        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex) {
                return ResponseEntity.badRequest()
                                .body(Map.of(
                                                "timestamp", LocalDateTime.now(),
                                                "status", 400,
                                                "error", "Bad Request",
                                                "message", ex.getMessage()));
        }

        // Archivo demasiado grande
        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<?> handleMaxSize(MaxUploadSizeExceededException ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of(
                                                "timestamp", LocalDateTime.now(),
                                                "status", 400,
                                                "error", "Bad Request",
                                                "message", "El archivo excede el tamaño máximo permitido de 2MB"));
        }

        // Errores de validación de @Valid en DTOs
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
                String message = ex.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .findFirst()
                                .map(error -> error.getDefaultMessage())
                                .orElse("Validation error");

                return ResponseEntity.badRequest().body(Map.of(
                                "timestamp", LocalDateTime.now(),
                                "status", 400,
                                "error", "Bad Request",
                                "message", message));
        }

        // Cualquier otro error genérico
        @ExceptionHandler(Exception.class)
        public ResponseEntity<?> handleGeneral(Exception ex) {
                log.error("Error no manejado: ", ex);

                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Map.of(
                                                "timestamp", LocalDateTime.now(),
                                                "status", 500,
                                                "error", "Internal Server Error",
                                                "message", ex.getMessage()));
        }
}
