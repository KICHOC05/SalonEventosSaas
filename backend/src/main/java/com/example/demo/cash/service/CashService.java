package com.example.demo.cash.service;

import com.example.demo.cash.dto.*;
import com.example.demo.cash.model.CashRegister;
import com.example.demo.cash.repository.CashRegisterRepository;
import com.example.demo.common.enums.CashStatus;
import com.example.demo.payment.repository.PaymentRepository;
import com.example.demo.security.TenantContext;
import com.example.demo.branch.model.Branch;
import com.example.demo.branch.repository.BranchRepository;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CashService {

    private final CashRegisterRepository cashRegisterRepository;
    private final PaymentRepository paymentRepository;

    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    // =========================
    // OPEN CASH REGISTER
    // =========================

    public CashRegisterResponse openCash(OpenCashRequest request) {

        if (request.getOpeningAmount() == null) {
            throw new IllegalArgumentException("openingAmount es obligatorio");
        }

        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();
        Long userId = TenantContext.getUserId();

        cashRegisterRepository
                .findByBranch_IdAndStatus(branchId, CashStatus.OPEN)
                .ifPresent(c -> {
                    throw new IllegalStateException("Ya existe una caja abierta");
                });

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        CashRegister cash = new CashRegister();

        cash.setTenant(tenant);
        cash.setBranch(branch);
        cash.setOpenedBy(user);
        cash.setOpeningAmount(request.getOpeningAmount());
        cash.setOpenedAt(LocalDateTime.now());
        cash.setStatus(CashStatus.OPEN);

        cashRegisterRepository.save(cash);

        return mapToResponse(cash, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    // =========================
    // CURRENT CASH STATUS
    // =========================

    public CashRegisterResponse currentCash() {

        CashRegister cash = getOpenCashRegister();

        BigDecimal sales = calculateSales(cash);

        BigDecimal expected = cash.getOpeningAmount().add(sales);

        return mapToResponse(cash, sales, expected);
    }

    // =========================
    // CLOSE CASH
    // =========================

    public CashRegisterResponse closeCash(CloseCashRequest request) {

        if (request.getCountedCash() == null) {
            throw new IllegalArgumentException("countedCash es obligatorio");
        }

        Long userId = TenantContext.getUserId();

        CashRegister cash = getOpenCashRegister();

        BigDecimal sales = calculateSales(cash);

        BigDecimal expected = cash.getOpeningAmount().add(sales);

        BigDecimal difference = request.getCountedCash().subtract(expected);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        cash.setClosingAmount(request.getCountedCash());
        cash.setExpectedAmount(expected);
        cash.setDifference(difference);

        cash.setClosedAt(LocalDateTime.now());
        cash.setClosedBy(user);
        cash.setStatus(CashStatus.CLOSED);

        cashRegisterRepository.save(cash);

        return mapToResponse(cash, sales, expected);
    }

    // =========================
    // PRIVATE METHODS
    // =========================

    private CashRegister getOpenCashRegister() {

        Long branchId = TenantContext.getBranchId();

        return cashRegisterRepository
                .findByBranch_IdAndStatus(branchId, CashStatus.OPEN)
                .orElseThrow(() -> new IllegalStateException("No hay caja abierta"));
    }

    private BigDecimal calculateSales(CashRegister cash) {

        BigDecimal sales = paymentRepository.sumCashPayments(
                cash.getBranch().getId(),
                cash.getOpenedAt(),
                LocalDateTime.now());

        return sales != null ? sales : BigDecimal.ZERO;
    }

    // =========================
    // MAPPER
    // =========================

    private CashRegisterResponse mapToResponse(
            CashRegister cash,
            BigDecimal sales,
            BigDecimal expected) {

        CashRegisterResponse response = new CashRegisterResponse();

        response.setPublicId(cash.getPublicId());
        response.setOpeningAmount(cash.getOpeningAmount());

        response.setSalesTotal(sales);
        response.setExpectedAmount(expected);

        response.setCountedAmount(cash.getClosingAmount());
        response.setDifference(cash.getDifference());

        response.setOpenedAt(cash.getOpenedAt());
        response.setClosedAt(cash.getClosedAt());

        response.setStatus(cash.getStatus().name());

        return response;
    }
}