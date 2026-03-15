package com.example.demo.payment.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PaymentResponse {

    private BigDecimal orderTotal;
    private BigDecimal totalPaid;
    private BigDecimal remainingAmount;
    private BigDecimal change;

}