package com.example.demo.event.repository;

import com.example.demo.event.model.EventPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface EventPaymentRepository extends JpaRepository<EventPayment, Long> {

    List<EventPayment> findAllByEvent_IdOrderByCreatedAtAsc(Long eventId);

    @Query("SELECT COALESCE(SUM(ep.amount), 0) FROM EventPayment ep WHERE ep.event.id = :eventId")
    BigDecimal sumPaymentsByEventId(@Param("eventId") Long eventId);

    @Query("""
        SELECT COALESCE(SUM(ep.amount), 0)
        FROM EventPayment ep
        WHERE ep.branch.id = :branchId
          AND ep.createdAt BETWEEN :start AND :end
          AND ep.paymentMethod = com.example.demo.common.enums.PaymentMethod.CASH
    """)
    BigDecimal sumCashEventPayments(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
        SELECT COALESCE(SUM(ep.amount), 0)
        FROM EventPayment ep
        WHERE ep.branch.id = :branchId
          AND ep.createdAt BETWEEN :start AND :end
          AND ep.paymentMethod = com.example.demo.common.enums.PaymentMethod.CARD
    """)
    BigDecimal sumCardEventPayments(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
        SELECT COALESCE(SUM(ep.amount), 0)
        FROM EventPayment ep
        WHERE ep.branch.id = :branchId
          AND ep.createdAt BETWEEN :start AND :end
          AND ep.paymentMethod = com.example.demo.common.enums.PaymentMethod.TRANSFER
    """)
    BigDecimal sumTransferEventPayments(
            @Param("branchId") Long branchId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
