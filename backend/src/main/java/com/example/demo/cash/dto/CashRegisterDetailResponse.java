package com.example.demo.cash.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CashRegisterDetailResponse {

    private String publicId;
    private String status;
    private BigDecimal openingAmount;
    private BigDecimal cashSales;
    private BigDecimal cardSales;
    private BigDecimal transferSales;
    private BigDecimal salesTotal;
    private BigDecimal depositTotal;
    private BigDecimal withdrawalTotal;
    private BigDecimal expectedCash;
    private BigDecimal countedCash;
    private BigDecimal difference;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String openedByName;
    private String closedByName;
    private long orderCount;
    private int movementCount;
}
