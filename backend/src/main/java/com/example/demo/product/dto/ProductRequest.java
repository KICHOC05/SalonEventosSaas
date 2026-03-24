package com.example.demo.product.dto;

import com.example.demo.common.enums.ProductType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;


@Getter
@Setter
public class ProductRequest {

    @NotBlank
    private String name;

    private String description;

    @NotNull
    private BigDecimal price;

    private Integer stock;

    @NotNull
    private ProductType type;

	@NotNull
	private String department;

    private Integer durationMinutes;

    private Boolean requiresSchedule;
    
}