package com.example.demo.payment.dto;

import com.example.demo.common.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PaymentRequest {

    private BigDecimal amount;

    private PaymentMethod paymentMethod;

    private String reference;

}