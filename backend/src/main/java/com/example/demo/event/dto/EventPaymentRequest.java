package com.example.demo.event.dto;

import com.example.demo.common.enums.EventPaymentType;
import com.example.demo.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class EventPaymentRequest {

    @NotNull
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;

    @NotNull
    private EventPaymentType paymentType;

    private String reference;
}
