package com.example.demo.order.repository;

import com.example.demo.order.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findAllByOrder_Id(Long orderId);

    Optional<OrderItem> findByPublicId(String publicId);

    Optional<OrderItem> findByPublicIdAndOrder_PublicId(String publicId, String orderPublicId);

}
