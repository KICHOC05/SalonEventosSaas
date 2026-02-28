package com.example.demo.branch.repository;

import com.example.demo.branch.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    // 🔎 Buscar por UUID y tenant (seguro multi-tenant)
    Optional<Branch> findByPublicIdAndTenant_Id(String publicId, Long tenantId);

    // 🔎 Buscar por ID interno y tenant (para validaciones internas)
    Optional<Branch> findByIdAndTenant_Id(Long id, Long tenantId);

    // 🔎 Listar todas las sucursales del tenant
    List<Branch> findAllByTenant_Id(Long tenantId);

    // 🔎 Validar nombre único dentro del tenant (opcional pero recomendado)
    boolean existsByTenant_IdAndName(Long tenantId, String name);
}