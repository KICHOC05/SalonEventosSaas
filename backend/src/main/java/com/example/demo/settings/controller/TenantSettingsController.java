package com.example.demo.settings.controller;

import com.example.demo.common.enums.InventoryMode;
import com.example.demo.settings.dto.InventoryModeRequest;
import com.example.demo.settings.model.TenantSettings;
import com.example.demo.settings.service.TenantSettingsService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class TenantSettingsController {

    private final TenantSettingsService service;

    // =========================
    // GET SETTINGS
    // =========================

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public TenantSettings getSettings() {

        return service.getSettings();
    }

    // =========================
    // UPDATE INVENTORY MODE
    // =========================

  @PutMapping("/inventory-mode")
    @PreAuthorize("hasRole('ADMIN')")
    public InventoryMode updateInventoryMode(
        @RequestBody InventoryModeRequest request) {

    return service.updateInventoryMode(request.getInventoryMode());
}

}