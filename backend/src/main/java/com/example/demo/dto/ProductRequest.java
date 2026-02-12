package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio") String name,
        String description,
        @Positive(message = "El precio debe ser positivo") Double price) {
}