package com.example.demo.order.controller;

import com.example.demo.order.dto.*;
import com.example.demo.order.service.OrderService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public OrderResponse createOrder(@RequestBody OrderCreateRequest request) {
        return orderService.createOrder(request);
    }

    @PostMapping("/{orderPublicId}/items")
    public OrderResponse addItem(
            @PathVariable String orderPublicId,
            @RequestBody OrderItemRequest request) {

        return orderService.addItem(orderPublicId, request);
    }

    @PostMapping("/{orderPublicId}/items/{itemPublicId}/void")
    public OrderResponse voidItem(
            @PathVariable String orderPublicId,
            @PathVariable String itemPublicId) {

        return orderService.voidItem(orderPublicId, itemPublicId);
    }

    @PutMapping("/{orderPublicId}/items/{itemPublicId}")
    public OrderResponse updateItemQuantity(
            @PathVariable String orderPublicId,
            @PathVariable String itemPublicId,
            @RequestBody UpdateOrderItemRequest request) {

        return orderService.updateItemQuantity(orderPublicId, itemPublicId, request);
    }

    @GetMapping("/{orderPublicId}")
    public OrderResponse getOrder(@PathVariable String orderPublicId) {
        return orderService.getOrder(orderPublicId);
    }

    @PostMapping("/{orderPublicId}/close")
    public OrderResponse closeOrder(@PathVariable String orderPublicId) {
        return orderService.closeOrder(orderPublicId);
    }

    @PostMapping("/{orderPublicId}/cancel")
    public OrderResponse cancelOrder(@PathVariable String orderPublicId) {
        return orderService.cancelOrder(orderPublicId);
    }
}
