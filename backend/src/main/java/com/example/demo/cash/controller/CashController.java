package com.example.demo.cash.controller;

import com.example.demo.cash.dto.CloseCashRequest;
import com.example.demo.cash.dto.CashRegisterResponse;
import com.example.demo.cash.dto.OpenCashRequest;
import com.example.demo.cash.service.CashService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cash")
@RequiredArgsConstructor
public class CashController {

    private final CashService cashService;


    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public CashRegisterResponse openCash(
            @Valid @RequestBody OpenCashRequest request) {

        return cashService.openCash(request);
    }


    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    public CashRegisterResponse currentCash() {

        return cashService.currentCash();
    }


    @PostMapping("/close")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CashRegisterResponse closeCash(
            @Valid @RequestBody CloseCashRequest request) {

        return cashService.closeCash(request);
    }
}