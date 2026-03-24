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

        return mapToResponse(cash, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
    }


    public CashRegisterResponse currentCash() {

        CashRegister cash = getOpenCashRegister();
        return buildResponseWithSales(cash);
    }


    public CashRegisterResponse closeCash(CloseCashRequest request) {

        if (request.getCountedCash() == null) {
            throw new IllegalArgumentException("countedCash es obligatorio");
        }

        Long userId = TenantContext.getUserId();
        CashRegister cash = getOpenCashRegister();

        LocalDateTime start = cash.getOpenedAt();
        LocalDateTime end = LocalDateTime.now();
        Long branchId = cash.getBranch().getId();

        BigDecimal cashSales = safe(paymentRepository.sumCashPayments(branchId, start, end));
        BigDecimal cardSales = safe(paymentRepository.sumCardPayments(branchId, start, end));
        BigDecimal transferSales = safe(paymentRepository.sumTransferPayments(branchId, start, end));

        BigDecimal expectedCash = cash.getOpeningAmount().add(cashSales);

        BigDecimal difference = request.getCountedCash().subtract(expectedCash);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        cash.setClosingAmount(request.getCountedCash());
        cash.setExpectedAmount(expectedCash);
        cash.setDifference(difference);
        cash.setClosedAt(end);
        cash.setClosedBy(user);
        cash.setStatus(CashStatus.CLOSED);

        cashRegisterRepository.save(cash);

        return mapToResponse(cash, cashSales, cardSales, transferSales);
    }


    private CashRegister getOpenCashRegister() {
        Long branchId = TenantContext.getBranchId();
        return cashRegisterRepository
                .findByBranch_IdAndStatus(branchId, CashStatus.OPEN)
                .orElseThrow(() -> new IllegalStateException("No hay caja abierta"));
    }

    private CashRegisterResponse buildResponseWithSales(CashRegister cash) {
        LocalDateTime start = cash.getOpenedAt();
        LocalDateTime end = LocalDateTime.now();
        Long branchId = cash.getBranch().getId();

        BigDecimal cashSales = safe(paymentRepository.sumCashPayments(branchId, start, end));
        BigDecimal cardSales = safe(paymentRepository.sumCardPayments(branchId, start, end));
        BigDecimal transferSales = safe(paymentRepository.sumTransferPayments(branchId, start, end));

        return mapToResponse(cash, cashSales, cardSales, transferSales);
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private CashRegisterResponse mapToResponse(
            CashRegister cash,
            BigDecimal cashSales,
            BigDecimal cardSales,
            BigDecimal transferSales) {

        cashSales = safe(cashSales);
        cardSales = safe(cardSales);
        transferSales = safe(transferSales);

        BigDecimal totalSales = cashSales.add(cardSales).add(transferSales);
        BigDecimal expectedCash = cash.getOpeningAmount().add(cashSales);

        CashRegisterResponse response = new CashRegisterResponse();
        response.setPublicId(cash.getPublicId());
        response.setOpeningAmount(cash.getOpeningAmount());

        response.setCashSales(cashSales);
        response.setCardSales(cardSales);
        response.setTransferSales(transferSales);

        response.setSalesTotal(totalSales);
        response.setExpectedCash(expectedCash);
        response.setExpectedAmount(cash.getOpeningAmount().add(totalSales));

        response.setCountedAmount(cash.getClosingAmount());
        response.setDifference(cash.getDifference());

        response.setOpenedAt(cash.getOpenedAt());
        response.setClosedAt(cash.getClosedAt());
        response.setStatus(cash.getStatus().name());

        return response;
    }
}