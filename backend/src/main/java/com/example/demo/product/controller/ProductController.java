package com.example.demo.product.controller;

import com.example.demo.product.dto.ProductRequest;
import com.example.demo.product.dto.ProductResponse;
import com.example.demo.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // 👑 ADMIN y MANAGER pueden crear
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    // 👑 ADMIN, MANAGER y EMPLOYEE pueden ver
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    @GetMapping
    public List<ProductResponse> findAll() {
        return productService.findAll();
    }

    // 👑 ADMIN, MANAGER y EMPLOYEE pueden ver por ID
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    @GetMapping("/{publicId}")
    public ProductResponse findByPublicId(@PathVariable String publicId) {
        return productService.findByPublicId(publicId);
    }

    // 👑 ADMIN y MANAGER pueden editar
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PutMapping("/{publicId}")
    public ProductResponse update(
            @PathVariable String publicId,
            @Valid @RequestBody ProductRequest request) {
        return productService.update(publicId, request);
    }

    // 👑 SOLO ADMIN y MANAGER pueden eliminar
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @DeleteMapping("/{publicId}")
    public void delete(@PathVariable String publicId) {
        productService.delete(publicId);
    }
}