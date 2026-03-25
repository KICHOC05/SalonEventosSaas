package com.example.demo.order.repository;

import com.example.demo.order.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findAllByOrder_Id(Long orderId);

    Optional<OrderItem> findByPublicId(String publicId);

    Optional<OrderItem> findByPublicIdAndOrder_PublicId(String publicId, String orderPublicId);


    @Query("""
                SELECT oi.product.publicId, oi.product.name,
                       SUM(oi.quantity), SUM(oi.subtotal)
                FROM OrderItem oi
                WHERE oi.order.tenant.id = :tenantId
                  AND oi.order.status = com.example.demo.common.enums.OrderStatus.CLOSED
                  AND oi.status = 'ACTIVE'
                  AND oi.order.createdAt BETWEEN :start AND :end
                  AND oi.product.type = com.example.demo.common.enums.ProductType.PRODUCT
                GROUP BY oi.product.publicId, oi.product.name
                ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> topProductsByTenant(
            @Param("tenantId") Long tenantId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);


    @Query("""
                SELECT oi.product.publicId, oi.product.name,
                       SUM(oi.quantity), SUM(oi.subtotal)
                FROM OrderItem oi
                WHERE oi.order.tenant.id = :tenantId
                  AND oi.order.status = com.example.demo.common.enums.OrderStatus.CLOSED
                  AND oi.status = 'ACTIVE'
                  AND oi.order.createdAt BETWEEN :start AND :end
                  AND oi.product.type = com.example.demo.common.enums.ProductType.PACKAGE
                GROUP BY oi.product.publicId, oi.product.name
                ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> topPackagesByTenant(
            @Param("tenantId") Long tenantId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);


    @Query("""
                SELECT oi.product.publicId, oi.product.name,
                       SUM(oi.quantity), SUM(oi.subtotal)
                FROM OrderItem oi
                WHERE oi.order.tenant.id = :tenantId
                  AND oi.order.status = com.example.demo.common.enums.OrderStatus.CLOSED
                  AND oi.status = 'ACTIVE'
                  AND oi.order.createdAt BETWEEN :start AND :end
                GROUP BY oi.product.publicId, oi.product.name
                ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> allItemsSoldByTenant(
            @Param("tenantId") Long tenantId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
       List<OrderItem> findByActiveTrueAndSessionEndBeforeAndOrder_Tenant_Id(
            LocalDateTime now,
            Long tenantId
       );

}
