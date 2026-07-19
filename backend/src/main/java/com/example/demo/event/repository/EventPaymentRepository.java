package com.example.demo.event.repository;

import com.example.demo.event.model.EventPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventPaymentRepository extends JpaRepository<EventPayment, Long> {

    List<EventPayment> findByEventBooking_PublicIdAndTenant_IdOrderByPaidAtDesc(
            String eventPublicId, Long tenantId
    );
}
