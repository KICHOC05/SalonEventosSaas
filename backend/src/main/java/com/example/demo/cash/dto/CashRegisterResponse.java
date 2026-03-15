package com.example.demo.cash.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CashRegisterResponse {

    private String publicId;

    private BigDecimal openingAmount;

    private BigDecimal salesTotal;

    private BigDecimal expectedAmount;

    private BigDecimal countedAmount;

    private BigDecimal difference;

    private LocalDateTime openedAt;

    private LocalDateTime closedAt;

    private String status;

}