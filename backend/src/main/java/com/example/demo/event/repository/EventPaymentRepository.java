package com.example.demo.event.repository;

import com.example.demo.event.model.EventPayment;
import com.example.demo.common.enums.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventPaymentRepository extends JpaRepository<EventPayment, Long> {

    List<EventPayment> findByEventBooking_PublicIdAndTenant_IdOrderByPaidAtDesc(
            String eventPublicId, Long tenantId
    );

    Optional<EventPayment> findByPublicIdAndEventBooking_PublicIdAndTenant_Id(
            String paymentPublicId, String eventPublicId, Long tenantId
    );

    List<EventPayment> findByEventBooking_PublicIdAndTenant_IdOrderByPaidAtAscIdAsc(
            String eventPublicId, Long tenantId
    );

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM EventPayment p
        WHERE p.cashRegister.id = :cashRegisterId
          AND p.paymentMethod = :paymentMethod
    """)
    java.math.BigDecimal sumByCashRegisterAndPaymentMethod(
            @Param("cashRegisterId") Long cashRegisterId,
            @Param("paymentMethod") PaymentMethod paymentMethod
    );
}
