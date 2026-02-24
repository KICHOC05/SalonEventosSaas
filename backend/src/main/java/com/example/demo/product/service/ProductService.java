package com.example.demo.product.service;

import com.example.demo.common.context.TenantContext;
import com.example.demo.product.dto.ProductRequest;
import com.example.demo.product.dto.ProductResponse;
import com.example.demo.product.model.Product;
import com.example.demo.product.repository.ProductRepository;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final TenantRepository tenantRepository;

    // 🔹 CREATE
    public ProductResponse create(ProductRequest request) {

        Long tenantId = TenantContext.getTenantId();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));

        Product product = new Product();
        product.setTenant(tenant);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setType(request.getType());
        product.setActive(true);

        productRepository.save(product);

        return mapToResponse(product);
    }

    // 🔹 FIND ALL
    public List<ProductResponse> findAll() {

        Long tenantId = TenantContext.getTenantId();

        return productRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // 🔹 FIND BY PUBLIC ID
    public ProductResponse findByPublicId(String publicId) {

        Long tenantId = TenantContext.getTenantId();

        Product product = productRepository
                .findByPublicIdAndTenantId(publicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        return mapToResponse(product);
    }

    // 🔹 UPDATE
    public ProductResponse update(String publicId, ProductRequest request) {

        Long tenantId = TenantContext.getTenantId();

        Product product = productRepository
                .findByPublicIdAndTenantId(publicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setType(request.getType());

        productRepository.save(product);

        return mapToResponse(product);
    }

    // 🔹 DELETE (soft delete recomendado)
    public void delete(String publicId) {

        Long tenantId = TenantContext.getTenantId();

        Product product = productRepository
                .findByPublicIdAndTenantId(publicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        product.setActive(false);

        productRepository.save(product);
    }

    // 🔹 Mapper privado
    private ProductResponse mapToResponse(Product product) {

        ProductResponse response = new ProductResponse();
        response.setPublicId(product.getPublicId());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setStock(product.getStock());
        response.setType(product.getType());
        response.setActive(product.getActive());

        return response;
    }
}