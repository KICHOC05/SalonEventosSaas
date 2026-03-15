package com.example.demo.payment.repository;

import com.example.demo.payment.model.Payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // =========================
    // PAYMENTS BY ORDER
    // =========================

    List<Payment> findAllByOrder_Id(Long orderId);

    // =========================
    // SUM PAYMENTS BY ORDER
    // =========================

    @Query("""
        SELECT COALESCE(SUM(p.amount),0)
        FROM Payment p
        WHERE p.order.id = :orderId
    """)
    BigDecimal sumPaymentsByOrderId(
            @Param("orderId") Long orderId
    );

    // =========================
    // TOTAL SALES
    // =========================

    @Query("""
        SELECT COALESCE(SUM(p.amount),0)
        FROM Payment p
        WHERE p.branch.id = :branchId
        AND p.createdAt BETWEEN :start AND :end
    """)
    BigDecimal sumTotalPayments(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // =========================
    // CASH SALES
    // =========================

    @Query("""
        SELECT COALESCE(SUM(p.amount),0)
        FROM Payment p
        WHERE p.branch.id = :branchId
        AND p.paymentMethod = 'CASH'
        AND p.createdAt BETWEEN :start AND :end
    """)
    BigDecimal sumCashPayments(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // =========================
    // CARD SALES
    // =========================

    @Query("""
        SELECT COALESCE(SUM(p.amount),0)
        FROM Payment p
        WHERE p.branch.id = :branchId
        AND p.paymentMethod = 'CARD'
        AND p.createdAt BETWEEN :start AND :end
    """)
    BigDecimal sumCardPayments(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

}