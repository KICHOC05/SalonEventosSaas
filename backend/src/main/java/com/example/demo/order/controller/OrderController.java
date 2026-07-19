package com.example.demo.order.controller;

import com.example.demo.order.dto.*;
import com.example.demo.order.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER','EMPLOYEE')")
    public OrderResponse createOrder(
            @Valid @RequestBody OrderCreateRequest request) {

        return orderService.createOrder(request);
    }

    @PostMapping("/{orderPublicId}/items")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER','EMPLOYEE')")
    public OrderResponse addItem(
            @PathVariable String orderPublicId,
            @Valid @RequestBody OrderItemRequest request) {

        return orderService.addItem(orderPublicId, request);
    }

    @PostMapping("/{orderPublicId}/items/{itemPublicId}/void")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    public OrderResponse voidItem(
            @PathVariable String orderPublicId,
            @PathVariable String itemPublicId) {

        return orderService.voidItem(orderPublicId, itemPublicId);
    }

    @PutMapping("/{orderPublicId}/items/{itemPublicId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    public OrderResponse updateItemQuantity(
            @PathVariable String orderPublicId,
            @PathVariable String itemPublicId,
            @Valid @RequestBody UpdateOrderItemRequest request) {

        return orderService.updateItemQuantity(orderPublicId, itemPublicId, request);
    }

    @GetMapping("/{orderPublicId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER','EMPLOYEE')")
    public OrderResponse getOrder(
            @PathVariable String orderPublicId) {

        return orderService.getOrder(orderPublicId);
    }

    @PostMapping("/{orderPublicId}/close")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    public OrderResponse closeOrder(
            @PathVariable String orderPublicId) {

        return orderService.closeOrder(orderPublicId);
    }

    @PostMapping("/{orderPublicId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public OrderResponse cancelOrder(
            @PathVariable String orderPublicId) {

        return orderService.cancelOrder(orderPublicId);
    }
}