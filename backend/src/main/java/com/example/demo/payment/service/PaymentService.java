package com.example.demo.payment.service;

import com.example.demo.security.TenantContext;
import com.example.demo.payment.dto.PaymentRequest;
import com.example.demo.payment.dto.PaymentResponse;
import com.example.demo.payment.model.Payment;
import com.example.demo.payment.repository.PaymentRepository;

import com.example.demo.order.model.Order;
import com.example.demo.order.repository.OrderRepository;

import com.example.demo.tenant.repository.TenantRepository;
import com.example.demo.branch.repository.BranchRepository;
import com.example.demo.user.repository.UserRepository;

import com.example.demo.tenant.model.Tenant;
import com.example.demo.branch.model.Branch;
import com.example.demo.user.model.User;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    public PaymentResponse registerPayment(String orderPublicId, PaymentRequest request) {

        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();
        Long userId = TenantContext.getUserId();

        Order order = orderRepository
                .findByPublicIdAndTenant_Id(orderPublicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Payment payment = new Payment();

        payment.setOrder(order);
        payment.setTenant(tenant);
        payment.setBranch(branch);
        payment.setUser(user);

        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setReference(request.getReference());

        paymentRepository.save(payment);

        // 🔥 Calcular pagos
        BigDecimal totalPaid = paymentRepository.sumPaymentsByOrderId(order.getId());

        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        BigDecimal orderTotal = order.getTotalAmount();

        BigDecimal remaining = BigDecimal.ZERO;
        BigDecimal change = BigDecimal.ZERO;

        if (totalPaid.compareTo(orderTotal) < 0) {

            remaining = orderTotal.subtract(totalPaid);

        } else {

            change = totalPaid.subtract(orderTotal);

        }

        PaymentResponse response = new PaymentResponse();

        response.setOrderTotal(orderTotal);
        response.setTotalPaid(totalPaid);
        response.setRemainingAmount(remaining);
        response.setChange(change);

        return response;
    }
}