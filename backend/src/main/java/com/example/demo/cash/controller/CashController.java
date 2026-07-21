package com.example.demo.cash.controller;

import com.example.demo.cash.dto.CashSettingsRequest;
import com.example.demo.cash.dto.CashSettingsResponse;
import com.example.demo.cash.dto.CloseCashRequest;
import com.example.demo.cash.dto.CashRegisterResponse;
import com.example.demo.cash.dto.OpenCashRequest;
import com.example.demo.cash.service.CashService;
import com.example.demo.cash.service.CashSettingsService;
import com.example.demo.security.TenantContext;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cash")
@RequiredArgsConstructor
public class CashController {

    private final CashService cashService;
    private final CashSettingsService cashSettingsService;


    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER','EMPLOYEE')")
    public CashRegisterResponse openCash(
            @Valid @RequestBody OpenCashRequest request) {

        return cashService.openCash(request);
    }


    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER','EMPLOYEE')")
    public CashRegisterResponse currentCash() {

        return cashService.currentCash();
    }


    @PostMapping("/close")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CashRegisterResponse closeCash(
            @Valid @RequestBody CloseCashRequest request) {

        return cashService.closeCash(request);
    }


    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER','EMPLOYEE')")
    public CashSettingsResponse getSettings() {
        return cashSettingsService.getSettings(
                TenantContext.getTenantId(),
                TenantContext.getBranchId());
    }


    @PutMapping("/settings/opening-amount")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CashSettingsResponse updateOpeningAmount(
            @Valid @RequestBody CashSettingsRequest request) {
        return cashSettingsService.updateOpeningAmount(
                TenantContext.getTenantId(),
                TenantContext.getBranchId(),
                TenantContext.getUserId(),
                request.getDefaultOpeningAmount());
    }
}