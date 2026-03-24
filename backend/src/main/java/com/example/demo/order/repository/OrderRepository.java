package com.example.demo.order.repository;

import com.example.demo.order.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

        Optional<Order> findByPublicIdAndTenant_Id(String publicId, Long tenantId);

        List<Order> findAllByTenant_IdOrderByCreatedAtDesc(Long tenantId);

        @Query("""
                            SELECT COUNT(o)
                            FROM Order o
                            WHERE o.tenant.id = :tenantId
                              AND o.status = com.example.demo.common.enums.OrderStatus.CLOSED
                              AND o.createdAt BETWEEN :start AND :end
                        """)
        Long countClosedOrdersByTenant(
                        @Param("tenantId") Long tenantId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);
}