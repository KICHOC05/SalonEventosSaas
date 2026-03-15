package com.example.demo.settings.service;

import com.example.demo.common.enums.InventoryMode;
import com.example.demo.security.TenantContext;
import com.example.demo.settings.model.TenantSettings;
import com.example.demo.settings.repository.TenantSettingsRepository;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TenantSettingsService {

    private final TenantSettingsRepository repository;
    private final TenantRepository tenantRepository;

    public TenantSettings getSettings() {

        Long tenantId = TenantContext.getTenantId();

        return repository
                .findByTenant_Id(tenantId)
                .orElseGet(() -> {

                    Tenant tenant = tenantRepository.findById(tenantId)
                            .orElseThrow();

                    TenantSettings settings = new TenantSettings();
                    settings.setTenant(tenant);

                    return repository.save(settings);
                });
    }

    public InventoryMode updateInventoryMode(InventoryMode mode) {

        TenantSettings settings = getSettings();

        settings.setInventoryMode(mode);

        repository.save(settings);

        return settings.getInventoryMode();
    }

}