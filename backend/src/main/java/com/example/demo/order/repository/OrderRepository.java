package com.example.demo.order.repository;

import com.example.demo.common.enums.OrderStatus;
import com.example.demo.order.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

        Optional<Order> findByPublicIdAndTenant_Id(String publicId, Long tenantId);

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

        @Query("""
                        SELECT o FROM Order o
                        WHERE o.tenant.id = :tenantId
                          AND (:status IS NULL OR o.status = :status)
                          AND (:createdAtFrom IS NULL OR o.createdAt >= :createdAtFrom)
                          AND (:createdAtTo IS NULL OR o.createdAt <= :createdAtTo)
                          AND (:search IS NULL
                               OR LOWER(COALESCE(o.customerName,'')) LIKE LOWER(CONCAT('%',:search,'%'))
                               OR LOWER(COALESCE(o.user.name,'')) LIKE LOWER(CONCAT('%',:search,'%')))
                        ORDER BY o.createdAt DESC
                    """)
        Page<Order> findHistoryByTenant(
                        @Param("tenantId") Long tenantId,
                        @Param("status") OrderStatus status,
                        @Param("createdAtFrom") LocalDateTime createdAtFrom,
                        @Param("createdAtTo") LocalDateTime createdAtTo,
                        @Param("search") String search,
                        Pageable pageable);
}
