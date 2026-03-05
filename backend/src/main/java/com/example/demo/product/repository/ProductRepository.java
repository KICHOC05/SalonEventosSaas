package com.example.demo.product.repository;

import com.example.demo.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Ya existentes
    Optional<Product> findByPublicIdAndTenant_IdAndActiveTrue(
            String publicId, Long tenantId);

    List<Product> findAllByTenant_IdAndActiveTrue(Long tenantId);

    // ✅ NUEVO: buscar sin filtro de active (para toggle)
    Optional<Product> findByPublicIdAndTenant_Id(
            String publicId, Long tenantId);

    // ✅ NUEVO: traer TODOS (activos e inactivos)
    List<Product> findAllByTenant_Id(Long tenantId);
}