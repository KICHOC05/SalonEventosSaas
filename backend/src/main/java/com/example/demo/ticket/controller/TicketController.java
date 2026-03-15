package com.example.demo.ticket.controller;

import com.example.demo.ticket.service.TicketService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/{orderPublicId}/ticket")
    public String getTicket(@PathVariable String orderPublicId) {
        return ticketService.generateTicket(orderPublicId);
    }

}