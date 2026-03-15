package com.example.demo.settings.service;

import com.example.demo.settings.dto.*;
import com.example.demo.settings.model.TaxSettings;
import com.example.demo.settings.repository.TaxSettingsRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaxSettingsService {

    private final TaxSettingsRepository repository;

    public TaxSettingsResponse getSettings(Long tenantId) {

        TaxSettings settings = repository
                .findByTenant_Id(tenantId)
                .orElseThrow();

        TaxSettingsResponse response = new TaxSettingsResponse();

        response.setTaxEnabled(settings.getTaxEnabled());
        response.setTaxRate(settings.getTaxRate());

        return response;
    }

    public TaxSettingsResponse updateSettings(Long tenantId, TaxSettingsRequest request) {

        TaxSettings settings = repository
                .findByTenant_Id(tenantId)
                .orElseThrow();

        settings.setTaxEnabled(request.getTaxEnabled());
        settings.setTaxRate(request.getTaxRate());

        repository.save(settings);

        return getSettings(tenantId);
    }
}