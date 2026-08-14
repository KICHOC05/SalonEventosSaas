package com.example.demo.cash.service;

import com.example.demo.cash.dto.*;
import com.example.demo.cash.model.CashMovement;
import com.example.demo.cash.model.CashRegister;
import com.example.demo.cash.repository.CashMovementRepository;
import com.example.demo.cash.repository.CashRegisterRepository;
import com.example.demo.common.enums.CashMovementType;
import com.example.demo.common.enums.CashStatus;
import com.example.demo.common.enums.PaymentMethod;
import com.example.demo.event.repository.EventPaymentRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CashService {

    private final CashRegisterRepository cashRegisterRepository;
    private final CashMovementRepository cashMovementRepository;
    private final PaymentRepository paymentRepository;
    private final EventPaymentRepository eventPaymentRepository;
    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CashSettingsService cashSettingsService;

    private record CashSummary(
            BigDecimal openingAmount,
            BigDecimal posCashSales,
            BigDecimal eventCashPayments,
            BigDecimal cashSales,
            BigDecimal posCardSales,
            BigDecimal eventCardPayments,
            BigDecimal cardSales,
            BigDecimal posTransferSales,
            BigDecimal eventTransferPayments,
            BigDecimal transferSales,
            BigDecimal depositTotal,
            BigDecimal withdrawalTotal,
            BigDecimal expectedCash) {
    }

    @Transactional
    public CashRegisterResponse openCash(OpenCashRequest request) {

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
        cash.setOpeningAmount(cashSettingsService.getDefaultOpeningAmount(branchId));
        cash.setOpenedAt(LocalDateTime.now());
        cash.setStatus(CashStatus.OPEN);

        cashRegisterRepository.save(cash);

        CashSummary summary = calculateCashSummary(cash);
        return buildResponse(cash, summary);
    }

    public CashRegisterResponse currentCash() {
        CashRegister cash = getOpenCashRegister();
        CashSummary summary = calculateCashSummary(cash);
        return buildResponse(cash, summary);
    }

    @Transactional
    public CashRegisterResponse closeCash(CloseCashRequest request) {

        if (request.getCountedCash() == null) {
            throw new IllegalArgumentException("countedCash es obligatorio");
        }

        Long userId = TenantContext.getUserId();
        CashRegister cash = getOpenCashRegisterForUpdate();

        CashSummary summary = calculateCashSummary(cash);

        BigDecimal difference = request.getCountedCash().subtract(summary.expectedCash());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        cash.setClosingAmount(request.getCountedCash());
        cash.setExpectedAmount(summary.expectedCash());
        cash.setDifference(difference);
        cash.setClosedAt(LocalDateTime.now());
        cash.setClosedBy(user);
        cash.setStatus(CashStatus.CLOSED);

        cashRegisterRepository.save(cash);

        return buildResponse(cash, summary);
    }

    @Transactional
    public CashMovementResponse withdraw(CashMovementRequest request) {
        return createMovement(request, CashMovementType.WITHDRAWAL);
    }

    @Transactional
    public CashMovementResponse deposit(CashMovementRequest request) {
        return createMovement(request, CashMovementType.DEPOSIT);
    }

    @Transactional
    public CashMovementResponse voidMovement(String publicId, CashMovementVoidRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();
        Long userId = TenantContext.getUserId();

        CashMovement movement = cashMovementRepository
                .findByPublicIdAndTenant_IdAndBranch_Id(publicId, tenantId, branchId)
                .orElseThrow(() -> new EntityNotFoundException("Movimiento no encontrado"));

        if (Boolean.TRUE.equals(movement.getVoided())) {
            throw new IllegalStateException("El movimiento ya está anulado");
        }

        if (movement.getCashRegister().getStatus() == CashStatus.CLOSED) {
            throw new IllegalStateException(
                    "No se pueden anular movimientos de una caja cerrada");
        }

        User voidedBy = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        movement.setVoided(true);
        movement.setVoidedAt(LocalDateTime.now());
        movement.setVoidedBy(voidedBy);
        movement.setVoidReason(request.getReason());

        cashMovementRepository.save(movement);

        return mapMovementToResponse(movement);
    }

    public CashMovementResponse getMovementDetail(String publicId) {
        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();

        CashMovement movement = cashMovementRepository
                .findByPublicIdAndTenant_IdAndBranch_Id(publicId, tenantId, branchId)
                .orElseThrow(() -> new EntityNotFoundException("Movimiento no encontrado"));

        return mapMovementToResponse(movement);
    }

    private CashMovementResponse createMovement(CashMovementRequest request, CashMovementType type) {
        CashRegister cash = getOpenCashRegisterForUpdate();

        if (type == CashMovementType.WITHDRAWAL) {
            CashSummary summary = calculateCashSummary(cash);

            if (request.getAmount().compareTo(summary.expectedCash()) > 0) {
                throw new IllegalStateException(
                        "Fondos insuficientes. Disponible: " + summary.expectedCash());
            }
        }

        Long userId = TenantContext.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        CashMovement movement = new CashMovement();
        movement.setTenant(cash.getTenant());
        movement.setBranch(cash.getBranch());
        movement.setCashRegister(cash);
        movement.setUser(user);
        movement.setType(type);
        movement.setAmount(request.getAmount());
        movement.setReason(request.getReason());
        movement.setNotes(request.getNotes());
        movement.setVoided(false);

        cashMovementRepository.save(movement);

        return mapMovementToResponse(movement);
    }

    public List<CashMovementResponse> getCurrentMovements() {
        CashRegister cash = getOpenCashRegister();
        return cashMovementRepository.findByCashRegister_IdOrderByCreatedAtDesc(cash.getId())
                .stream()
                .map(this::mapMovementToResponse)
                .collect(Collectors.toList());
    }

    public Page<CashMovementResponse> getMovementHistory(
            int page, int size,
            CashMovementType type, Boolean voided,
            String userPublicId,
            LocalDateTime from, LocalDateTime to) {

        Long branchId = TenantContext.getBranchId();
        Pageable pageable = PageRequest.of(page, size);

        return cashMovementRepository.findHistoryByBranch(
                        branchId, type, voided, userPublicId, from, to, pageable)
                .map(this::mapMovementToResponse);
    }

    public Page<CashRegisterHistoryResponse> getCashRegisterHistory(
            int page, int size,
            CashStatus status, String openedByPublicId,
            LocalDateTime from, LocalDateTime to) {

        Long branchId = TenantContext.getBranchId();
        Pageable pageable = PageRequest.of(page, size);

        return cashRegisterRepository.findHistoryByBranch(
                        branchId, status, openedByPublicId, from, to, pageable)
                .map(this::mapToCashRegisterHistoryResponse);
    }

    public CashRegisterDetailResponse getCashRegisterDetail(String publicId) {
        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();

        CashRegister cash = cashRegisterRepository
                .findByPublicIdAndTenant_IdAndBranch_Id(publicId, tenantId, branchId)
                .orElseThrow(() -> new EntityNotFoundException("Caja no encontrada"));

        return mapToCashRegisterDetailResponse(cash);
    }

    private CashRegisterHistoryResponse mapToCashRegisterHistoryResponse(CashRegister cash) {
        CashSummary summary = calculateCashSummary(cash);
        long movementCount = cashMovementRepository.countByCashRegister_Id(cash.getId());
        long orderCount = 0; // simplified; could count orders in the period if needed

        return CashRegisterHistoryResponse.builder()
                .publicId(cash.getPublicId())
                .status(cash.getStatus().name())
                .openingAmount(cash.getOpeningAmount())
                .closingAmount(cash.getClosingAmount())
                .expectedAmount(cash.getExpectedAmount())
                .difference(cash.getDifference())
                .openedAt(cash.getOpenedAt())
                .closedAt(cash.getClosedAt())
                .openedByName(cash.getOpenedBy().getName())
                .closedByName(cash.getClosedBy() != null
                        ? cash.getClosedBy().getName() : null)
                .orderCount(orderCount)
                .movementCount((int) movementCount)
                .build();
    }

    private CashRegisterDetailResponse mapToCashRegisterDetailResponse(CashRegister cash) {
        CashSummary summary = calculateCashSummary(cash);
        BigDecimal totalSales = summary.cashSales()
                .add(summary.cardSales())
                .add(summary.transferSales());
        long movementCount = cashMovementRepository.countByCashRegister_Id(cash.getId());

        return CashRegisterDetailResponse.builder()
                .publicId(cash.getPublicId())
                .status(cash.getStatus().name())
                .openingAmount(cash.getOpeningAmount())
                .cashSales(summary.cashSales())
                .cardSales(summary.cardSales())
                .transferSales(summary.transferSales())
                .posCashSales(summary.posCashSales())
                .eventCashPayments(summary.eventCashPayments())
                .posCardSales(summary.posCardSales())
                .eventCardPayments(summary.eventCardPayments())
                .posTransferSales(summary.posTransferSales())
                .eventTransferPayments(summary.eventTransferPayments())
                .salesTotal(totalSales)
                .depositTotal(summary.depositTotal())
                .withdrawalTotal(summary.withdrawalTotal())
                .expectedCash(summary.expectedCash())
                .countedCash(cash.getClosingAmount())
                .difference(cash.getDifference())
                .openedAt(cash.getOpenedAt())
                .closedAt(cash.getClosedAt())
                .openedByName(cash.getOpenedBy().getName())
                .closedByName(cash.getClosedBy() != null
                        ? cash.getClosedBy().getName() : null)
                .orderCount(0)
                .movementCount((int) movementCount)
                .build();
    }


    private CashSummary calculateCashSummary(CashRegister cash) {
        LocalDateTime start = cash.getOpenedAt();
        LocalDateTime end = cash.getClosedAt() != null
                ? cash.getClosedAt()
                : LocalDateTime.now();
        Long branchId = cash.getBranch().getId();

        BigDecimal posCashSales = safe(paymentRepository.sumCashPayments(branchId, start, end));
        BigDecimal posCardSales = safe(paymentRepository.sumCardPayments(branchId, start, end));
        BigDecimal posTransferSales = safe(paymentRepository.sumTransferPayments(branchId, start, end));

        BigDecimal eventCashPayments = safe(eventPaymentRepository.sumByCashRegisterAndPaymentMethod(
                cash.getId(), PaymentMethod.CASH));
        BigDecimal eventCardPayments = safe(eventPaymentRepository.sumByCashRegisterAndPaymentMethod(
                cash.getId(), PaymentMethod.CARD));
        BigDecimal eventTransferPayments = safe(eventPaymentRepository.sumByCashRegisterAndPaymentMethod(
                cash.getId(), PaymentMethod.TRANSFER));

        BigDecimal cashSales = posCashSales.add(eventCashPayments);
        BigDecimal cardSales = posCardSales.add(eventCardPayments);
        BigDecimal transferSales = posTransferSales.add(eventTransferPayments);

        BigDecimal depositTotal = safe(cashMovementRepository.sumByCashRegisterAndType(
                cash.getId(), CashMovementType.DEPOSIT));
        BigDecimal withdrawalTotal = safe(cashMovementRepository.sumByCashRegisterAndType(
                cash.getId(), CashMovementType.WITHDRAWAL));

        BigDecimal expectedCash = cash.getOpeningAmount()
                .add(cashSales)
                .add(depositTotal)
                .subtract(withdrawalTotal);

        return new CashSummary(
                cash.getOpeningAmount(),
                posCashSales,
                eventCashPayments,
                cashSales,
                posCardSales,
                eventCardPayments,
                cardSales,
                posTransferSales,
                eventTransferPayments,
                transferSales,
                depositTotal,
                withdrawalTotal,
                expectedCash);
    }

    private CashRegister getOpenCashRegister() {
        Long branchId = TenantContext.getBranchId();
        return cashRegisterRepository
                .findByBranch_IdAndStatus(branchId, CashStatus.OPEN)
                .orElseThrow(() -> new IllegalStateException("No hay caja abierta"));
    }

    private CashRegister getOpenCashRegisterForUpdate() {
        Long branchId = TenantContext.getBranchId();
        return cashRegisterRepository
                .findByBranch_IdAndStatusForUpdate(branchId, CashStatus.OPEN)
                .orElseThrow(() -> new IllegalStateException("No hay caja abierta"));
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private CashRegisterResponse buildResponse(CashRegister cash, CashSummary summary) {
        BigDecimal totalSales = summary.cashSales()
                .add(summary.cardSales())
                .add(summary.transferSales());

        CashRegisterResponse response = new CashRegisterResponse();
        response.setPublicId(cash.getPublicId());
        response.setOpeningAmount(cash.getOpeningAmount());

        response.setCashSales(summary.cashSales());
        response.setCardSales(summary.cardSales());
        response.setTransferSales(summary.transferSales());
        response.setPosCashSales(summary.posCashSales());
        response.setEventCashPayments(summary.eventCashPayments());
        response.setPosCardSales(summary.posCardSales());
        response.setEventCardPayments(summary.eventCardPayments());
        response.setPosTransferSales(summary.posTransferSales());
        response.setEventTransferPayments(summary.eventTransferPayments());

        response.setSalesTotal(totalSales);
        response.setExpectedCash(summary.expectedCash());
        response.setExpectedAmount(cash.getOpeningAmount().add(totalSales));

        response.setDepositTotal(summary.depositTotal());
        response.setWithdrawalTotal(summary.withdrawalTotal());

        response.setCountedAmount(cash.getClosingAmount());
        response.setDifference(cash.getDifference());

        response.setOpenedAt(cash.getOpenedAt());
        response.setClosedAt(cash.getClosedAt());
        response.setStatus(cash.getStatus().name());

        return response;
    }

    private CashMovementResponse mapMovementToResponse(CashMovement movement) {
        return CashMovementResponse.builder()
                .publicId(movement.getPublicId())
                .type(movement.getType().name())
                .amount(movement.getAmount())
                .reason(movement.getReason())
                .notes(movement.getNotes())
                .userName(movement.getUser().getName())
                .createdAt(movement.getCreatedAt())
                .voided(movement.getVoided())
                .voidedAt(movement.getVoidedAt())
                .voidedByName(movement.getVoidedBy() != null
                        ? movement.getVoidedBy().getName() : null)
                .voidReason(movement.getVoidReason())
                .build();
    }
}
