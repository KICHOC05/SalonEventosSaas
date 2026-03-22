// src/main/java/com/example/demo/cash/dto/CashRegisterResponse.java
package com.example.demo.cash.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CashRegisterResponse {

    private String publicId;
    private BigDecimal openingAmount;

    // 🔥 Desglose por método de pago
    private BigDecimal cashSales; // Solo efectivo
    private BigDecimal cardSales; // Solo tarjeta
    private BigDecimal transferSales; // Solo transferencia

    // Totales
    private BigDecimal salesTotal; // cashSales + cardSales + transferSales
    private BigDecimal expectedCash; // openingAmount + cashSales (solo efectivo cuenta)
    private BigDecimal expectedAmount; // openingAmount + salesTotal (referencia)

    private BigDecimal countedAmount; // Lo que se contó al cerrar
    private BigDecimal difference; // countedAmount - expectedCash

    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private String status;
}