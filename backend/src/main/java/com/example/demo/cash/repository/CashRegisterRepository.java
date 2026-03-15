package com.example.demo.cash.repository;

import com.example.demo.cash.model.CashRegister;
import com.example.demo.common.enums.CashStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CashRegisterRepository extends JpaRepository<CashRegister, Long> {

    Optional<CashRegister> findByPublicIdAndTenant_Id(String publicId, Long tenantId);

    Optional<CashRegister> findByBranch_IdAndStatus(Long branchId, CashStatus status);

}