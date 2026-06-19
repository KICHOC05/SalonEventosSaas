package com.example.demo.event.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class EventPaymentResponse {

    private String publicId;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentType;
    private String reference;
    private LocalDateTime createdAt;
}
