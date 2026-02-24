package com.example.demo.product.controller;

import com.example.demo.product.dto.ProductRequest;
import com.example.demo.product.dto.ProductResponse;
import com.example.demo.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @GetMapping
    public List<ProductResponse> findAll() {
        return productService.findAll();
    }

    @GetMapping("/{publicId}")
    public ProductResponse findByPublicId(@PathVariable String publicId) {
        return productService.findByPublicId(publicId);
    }

    @PutMapping("/{publicId}")
    public ProductResponse update(
            @PathVariable String publicId,
            @Valid @RequestBody ProductRequest request) {
        return productService.update(publicId, request);
    }

    @DeleteMapping("/{publicId}")
    public void delete(@PathVariable String publicId) {
        productService.delete(publicId);
    }
}