// src/main/java/com/example/demo/payment/repository/PaymentRepository.java
package com.example.demo.payment.repository;

import com.example.demo.payment.model.Payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

        List<Payment> findAllByOrder_Id(Long orderId);

        // ═══════════════════════════════════════
        // SUM POR ORDEN
        // ═══════════════════════════════════════

        @Query("""
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM Payment p
                            WHERE p.order.id = :orderId
                        """)
        BigDecimal sumPaymentsByOrderId(@Param("orderId") Long orderId);

        // ═══════════════════════════════════════
        // VENTAS TOTALES POR BRANCH
        // ═══════════════════════════════════════

        @Query("""
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM Payment p
                            WHERE p.branch.id = :branchId
                              AND p.createdAt BETWEEN :start AND :end
                        """)
        BigDecimal sumTotalPayments(
                        @Param("branchId") Long branchId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // ═══════════════════════════════════════
        // VENTAS TOTALES POR TENANT
        // ═══════════════════════════════════════

        @Query("""
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM Payment p
                            WHERE p.tenant.id = :tenantId
                              AND p.createdAt BETWEEN :start AND :end
                        """)
        BigDecimal sumTotalPaymentsByTenant(
                        @Param("tenantId") Long tenantId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // ═══════════════════════════════════════
        // VENTAS EFECTIVO (por branch - para caja)
        // ═══════════════════════════════════════

        @Query("""
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM Payment p
                            WHERE p.branch.id = :branchId
                              AND p.paymentMethod = com.example.demo.common.enums.PaymentMethod.CASH
                              AND p.createdAt BETWEEN :start AND :end
                        """)
        BigDecimal sumCashPayments(
                        @Param("branchId") Long branchId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // ═══════════════════════════════════════
        // VENTAS TARJETA (por branch - para caja)
        // ═══════════════════════════════════════

        @Query("""
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM Payment p
                            WHERE p.branch.id = :branchId
                              AND p.paymentMethod = com.example.demo.common.enums.PaymentMethod.CARD
                              AND p.createdAt BETWEEN :start AND :end
                        """)
        BigDecimal sumCardPayments(
                        @Param("branchId") Long branchId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // ═══════════════════════════════════════
        // VENTAS TRANSFERENCIA (por branch - para caja)
        // ═══════════════════════════════════════

        @Query("""
                            SELECT COALESCE(SUM(p.amount), 0)
                            FROM Payment p
                            WHERE p.branch.id = :branchId
                              AND p.paymentMethod = com.example.demo.common.enums.PaymentMethod.TRANSFER
                              AND p.createdAt BETWEEN :start AND :end
                        """)
        BigDecimal sumTransferPayments(
                        @Param("branchId") Long branchId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // ═══════════════════════════════════════
        // VENTAS DIARIAS (para gráficas)
        // ═══════════════════════════════════════

        @Query(value = """
                            SELECT DATE(p.created_at) as sale_date,
                                   COALESCE(SUM(p.amount), 0) as total
                            FROM payments p
                            WHERE p.tenant_id = :tenantId
                              AND p.created_at BETWEEN :start AND :end
                            GROUP BY DATE(p.created_at)
                            ORDER BY DATE(p.created_at)
                        """, nativeQuery = true)
        List<Object[]> dailySalesByTenant(
                        @Param("tenantId") Long tenantId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        // ═══════════════════════════════════════
        // DESGLOSE POR MÉTODO DE PAGO (tenant)
        // ═══════════════════════════════════════

        @Query(value = """
                            SELECT
                                COALESCE(SUM(CASE WHEN p.payment_method = 'CASH' THEN p.amount ELSE 0 END), 0) as cash_total,
                                COALESCE(SUM(CASE WHEN p.payment_method = 'CARD' THEN p.amount ELSE 0 END), 0) as card_total,
                                COALESCE(SUM(CASE WHEN p.payment_method = 'TRANSFER' THEN p.amount ELSE 0 END), 0) as transfer_total
                            FROM payments p
                            WHERE p.tenant_id = :tenantId
                              AND p.created_at BETWEEN :start AND :end
                        """, nativeQuery = true)
        Object[] paymentBreakdownByTenant(
                        @Param("tenantId") Long tenantId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);
}