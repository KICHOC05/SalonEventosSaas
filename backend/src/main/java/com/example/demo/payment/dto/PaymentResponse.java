// src/main/java/com/example/demo/payment/dto/PaymentResponse.java
package com.example.demo.payment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PaymentResponse {

    private BigDecimal orderTotal;
    private BigDecimal totalPaid;
    private BigDecimal remainingAmount;
    private BigDecimal change;

    // Detalle del pago actual
    private BigDecimal amountReceived;   // Lo que dio el cliente
    private BigDecimal amountApplied;    // Lo que se registró
    private String paymentMethod;        // CASH, CARD, TRANSFER
}