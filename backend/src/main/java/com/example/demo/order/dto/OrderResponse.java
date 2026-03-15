package com.example.demo.order.dto;

import com.example.demo.common.enums.OrderStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class OrderResponse {

    private String publicId;

    private OrderStatus status;

    private String customerName;

    private String childName;

    private BigDecimal totalAmount;
    private BigDecimal subtotal;
    private BigDecimal tax;


    private LocalDateTime createdAt;

    private LocalDateTime closedAt;

    private List<OrderItemResponse> items;

}