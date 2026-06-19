package com.example.demo.event.service;

import com.example.demo.branch.model.Branch;
import com.example.demo.branch.repository.BranchRepository;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.event.dto.EventPaymentRequest;
import com.example.demo.event.dto.EventPaymentResponse;
import com.example.demo.event.model.Event;
import com.example.demo.event.model.EventPayment;
import com.example.demo.event.repository.EventPaymentRepository;
import com.example.demo.security.TenantContext;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EventPaymentService {

    private final EventPaymentRepository eventPaymentRepository;
    private final EventService eventService;
    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    @Transactional
    public EventPaymentResponse registerPayment(String eventPublicId, EventPaymentRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();
        Long userId = TenantContext.getUserId();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Event event = eventService.getEventEntity(eventPublicId, tenantId);

        if (event.getStatus() == com.example.demo.common.enums.EventStatus.CANCELLED) {
            throw new BusinessException("No se pueden registrar pagos en un evento cancelado");
        }
        if (event.getStatus() == com.example.demo.common.enums.EventStatus.COMPLETED) {
            throw new BusinessException("No se pueden registrar pagos en un evento completado");
        }

        if (request.getAmount().compareTo(event.getPendingAmount()) > 0) {
            throw new BusinessException("El monto no puede exceder el saldo pendiente de $" + event.getPendingAmount());
        }

        EventPayment payment = new EventPayment();
        payment.setEvent(event);
        payment.setTenant(tenant);
        payment.setBranch(branch);
        payment.setUser(user);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentType(request.getPaymentType());
        payment.setReference(request.getReference());

        eventPaymentRepository.save(payment);

        BigDecimal newPaidAmount = event.getPaidAmount().add(request.getAmount());
        BigDecimal newPendingAmount = event.getTotalAmount().subtract(newPaidAmount);

        event.setPaidAmount(newPaidAmount);
        event.setPendingAmount(newPendingAmount.max(BigDecimal.ZERO));

        eventService.updateEventStatus(event);

        EventPaymentResponse response = new EventPaymentResponse();
        response.setPublicId(payment.getPublicId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod().name());
        response.setPaymentType(payment.getPaymentType().name());
        response.setReference(payment.getReference());
        response.setCreatedAt(payment.getCreatedAt());
        return response;
    }
}
