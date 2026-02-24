package com.example.demo.branch.repository;

import com.example.demo.branch.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByPublicIdAndTenantId(String publicId, Long tenantId);

    List<Branch> findAllByTenantId(Long tenantId);
}