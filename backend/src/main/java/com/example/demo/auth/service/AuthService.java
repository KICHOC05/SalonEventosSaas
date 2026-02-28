package com.example.demo.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.auth.dto.*;
import com.example.demo.branch.model.Branch;
import com.example.demo.branch.repository.BranchRepository;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.security.JwtService;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // ============================================================
    // LOGIN (SaaS real: tenantPublicId + email)
    // ============================================================
    public LoginResponse login(LoginRequest request) {

        // 1️⃣ Buscar tenant por UUID público
        Tenant tenant = tenantRepository
                .findByPublicId(request.getTenantPublicId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant no encontrado"));

        // 2️⃣ Buscar usuario dentro del tenant
        User user = userRepository
                .findByEmailAndTenant_Id(request.getEmail(), tenant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // 3️⃣ Validar password manualmente
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Credenciales inválidas");
        }

        if (!user.getActive()) {
            throw new BusinessException("Usuario desactivado");
        }

        // 4️⃣ Generar JWT con UUID y enum real
        String token = jwtService.generateToken(
                user.getPublicId(),
                user.getEmail(),
                tenant.getId(),
                user.getBranch().getId(),
                user.getRole()
        );

        return LoginResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .userPublicId(user.getPublicId())
                .tenantId(tenant.getId())
                .branchId(user.getBranch().getId())
                .businessName(tenant.getBusinessName())
                .branchName(user.getBranch().getName())
                .build();
    }

    // ============================================================
    // REGISTER (ADMIN del tenant)
    // ============================================================
    @Transactional
    public LoginResponse register(RegisterRequest request, Long tenantId) {

        if (userRepository.existsByTenant_IdAndEmail(tenantId, request.getEmail())) {
            throw new BusinessException("El email ya existe en este tenant");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant no encontrado"));

        Branch branch = branchRepository
                .findByIdAndTenant_Id(request.getBranchId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Sucursal no válida"));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole()); // Enum directo
        user.setTenant(tenant);
        user.setBranch(branch);
        user.setActive(true);

        user = userRepository.save(user);

        String token = jwtService.generateToken(
                user.getPublicId(),
                user.getEmail(),
                tenant.getId(),
                branch.getId(),
                user.getRole()
        );

        return LoginResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .userPublicId(user.getPublicId())
                .tenantId(tenant.getId())
                .branchId(branch.getId())
                .businessName(tenant.getBusinessName())
                .branchName(branch.getName())
                .build();
    }
}