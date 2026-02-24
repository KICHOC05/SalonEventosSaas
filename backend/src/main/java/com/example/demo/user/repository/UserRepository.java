package com.example.demo.user.repository;

import com.example.demo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPublicIdAndTenantId(String publicId, Long tenantId);

    Optional<User> findByEmailAndTenantId(String email, Long tenantId);

    List<User> findAllByTenantId(Long tenantId);
}