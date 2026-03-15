package com.example.demo.order.repository;

import com.example.demo.order.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByPublicIdAndTenant_Id(String publicId, Long tenantId);

    List<Order> findAllByTenant_IdOrderByCreatedAtDesc(Long tenantId);

    
}