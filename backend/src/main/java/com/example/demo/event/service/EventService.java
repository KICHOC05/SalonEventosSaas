package com.example.demo.event.service;

import com.example.demo.branch.model.Branch;
import com.example.demo.branch.repository.BranchRepository;
import com.example.demo.event.dto.EventUpdateRequest;
import com.example.demo.common.enums.EventStatus;
import com.example.demo.common.enums.ProductType;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.event.dto.*;
import com.example.demo.event.model.Event;
import com.example.demo.event.repository.EventPaymentRepository;
import com.example.demo.event.repository.EventRepository;
import com.example.demo.product.model.Product;
import com.example.demo.product.repository.ProductRepository;
import com.example.demo.security.TenantContext;
import com.example.demo.tenant.model.Tenant;
import com.example.demo.tenant.repository.TenantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventPaymentRepository eventPaymentRepository;
    private final ProductRepository productRepository;
    private final TenantRepository tenantRepository;
    private final BranchRepository branchRepository;

    @Transactional
    public EventResponse createEvent(EventRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Long branchId = TenantContext.getBranchId();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));

        Product packageProduct = productRepository
                .findByPublicIdAndTenant_IdAndActiveTrue(request.getPackagePublicId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        if (packageProduct.getType() != ProductType.PACKAGE) {
            throw new BusinessException("El producto debe ser tipo PACKAGE");
        }

        if (request.getEventDate().isBefore(LocalDate.now())) {
            throw new BusinessException("No se permiten fechas pasadas");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }

        validateNoOverlap(tenantId, request.getEventDate(), request.getStartTime(), request.getEndTime(), null);

        Event event = new Event();
        event.setTenant(tenant);
        event.setBranch(branch);
        event.setPackageProduct(packageProduct);
        event.setCustomerName(request.getCustomerName());
        event.setChildName(request.getChildName());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setGuestCount(request.getGuestCount());
        event.setNotes(request.getNotes());
        event.setTotalAmount(packageProduct.getPrice());
        event.setPaidAmount(BigDecimal.ZERO);
        event.setPendingAmount(packageProduct.getPrice());
        event.setStatus(EventStatus.PENDING);

        eventRepository.save(event);
        return mapToResponse(event);
    }

    public List<EventResponse> getDayEvents(LocalDate date) {
        Long tenantId = TenantContext.getTenantId();
        return eventRepository.findAllByTenant_IdAndEventDateOrderByStartTime(tenantId, date)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<EventResponse> getMonthEvents(int year, int month) {
        Long tenantId = TenantContext.getTenantId();
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return eventRepository.findAllByTenantIdAndDateRange(tenantId, start, end)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public EventDetailResponse getEventDetail(String publicId) {
        Long tenantId = TenantContext.getTenantId();
        Event event = getEventEntity(publicId, tenantId);

        EventDetailResponse response = mapToDetailResponse(event);

        List<EventPaymentResponse> payments = eventPaymentRepository
                .findAllByEvent_IdOrderByCreatedAtAsc(event.getId())
                .stream()
                .map(p -> {
                    EventPaymentResponse r = new EventPaymentResponse();
                    r.setPublicId(p.getPublicId());
                    r.setAmount(p.getAmount());
                    r.setPaymentMethod(p.getPaymentMethod().name());
                    r.setPaymentType(p.getPaymentType().name());
                    r.setReference(p.getReference());
                    r.setCreatedAt(p.getCreatedAt());
                    return r;
                })
                .toList();

        response.setPayments(payments);
        return response;
    }

    @Transactional
    public EventResponse reschedule(String publicId, EventRescheduleRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Event event = getEventEntity(publicId, tenantId);

        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessException("No se puede reprogramar un evento COMPLETED");
        }

        if (request.getEventDate().isBefore(LocalDate.now())) {
            throw new BusinessException("No se permiten fechas pasadas");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BusinessException("La hora de inicio debe ser anterior a la hora de fin");
        }

        validateNoOverlap(tenantId, request.getEventDate(), request.getStartTime(), request.getEndTime(), event.getId());

        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());

        eventRepository.save(event);
        return mapToResponse(event);
    }

    @Transactional
    public EventResponse cancel(String publicId) {
        Long tenantId = TenantContext.getTenantId();
        Event event = getEventEntity(publicId, tenantId);

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessException("El evento ya está cancelado");
        }
        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessException("No se puede cancelar un evento COMPLETED");
        }

        long daysUntilEvent = ChronoUnit.DAYS.between(LocalDate.now(), event.getEventDate());
        if (daysUntilEvent < 7) {
            BigDecimal fee = event.getTotalAmount()
                    .multiply(BigDecimal.valueOf(0.10))
                    .setScale(2, RoundingMode.HALF_UP);
            event.setCancellationFee(fee);
            event.setRefundedAmount(event.getPaidAmount().subtract(fee).max(BigDecimal.ZERO));
        } else {
            event.setRefundedAmount(event.getPaidAmount());
        }

        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
        return mapToResponse(event);
    }

    @Transactional
    public EventResponse complete(String publicId) {
        Long tenantId = TenantContext.getTenantId();
        Event event = getEventEntity(publicId, tenantId);

        if (event.getStatus() != EventStatus.CONFIRMED) {
            throw new BusinessException("Solo eventos CONFIRMED pueden completarse");
        }

        event.setStatus(EventStatus.COMPLETED);
        eventRepository.save(event);
        return mapToResponse(event);
    }

    public EventReportResponse getReport(LocalDate startDate, LocalDate endDate,
                                           EventStatus status, Long branchId) {
        Long tenantId = TenantContext.getTenantId();

        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        List<Event> events;
        if (status != null && branchId != null) {
            events = eventRepository.findAllByTenant_IdAndEventDateBetweenAndStatus(tenantId, startDate, endDate, status)
                    .stream()
                    .filter(e -> e.getBranch().getId().equals(branchId))
                    .toList();
        } else if (status != null) {
            events = eventRepository.findAllByTenant_IdAndEventDateBetweenAndStatus(tenantId, startDate, endDate, status)
                    .stream()
                    .toList();
        } else if (branchId != null) {
            events = eventRepository.findAllByTenant_IdAndEventDateBetween(tenantId, startDate, endDate)
                    .stream()
                    .filter(e -> e.getBranch().getId().equals(branchId))
                    .toList();
        } else {
            events = eventRepository.findAllByTenant_IdAndEventDateBetween(tenantId, startDate, endDate)
                    .stream()
                    .toList();
        }

        long totalEvents = events.size();
        long confirmedEvents = events.stream()
                .filter(e -> e.getStatus() == EventStatus.CONFIRMED || e.getStatus() == EventStatus.COMPLETED)
                .count();
        long cancelledEvents = events.stream()
                .filter(e -> e.getStatus() == EventStatus.CANCELLED)
                .count();

        BigDecimal pendingBalance = events.stream()
                .filter(e -> e.getStatus() != EventStatus.CANCELLED && e.getStatus() != EventStatus.COMPLETED)
                .map(Event::getPendingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenue = events.stream()
                .filter(e -> e.getStatus() == EventStatus.COMPLETED || e.getStatus() == EventStatus.CONFIRMED)
                .map(Event::getPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        EventReportResponse report = new EventReportResponse();
        report.setTotalEvents(totalEvents);
        report.setConfirmedEvents(confirmedEvents);
        report.setCancelledEvents(cancelledEvents);
        report.setPendingBalance(pendingBalance);
        report.setRevenue(revenue);
        return report;
    }

    @Transactional
    public EventResponse update(String publicId, EventUpdateRequest request) {
        Long tenantId = TenantContext.getTenantId();
        Event event = getEventEntity(publicId, tenantId);

        event.setCustomerName(request.getCustomerName());
        event.setChildName(request.getChildName());
        event.setGuestCount(request.getGuestCount());
        event.setNotes(request.getNotes());

        eventRepository.save(event);
        return mapToResponse(event);
    }

    public void updateEventStatus(Event event) {
        if (event.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
            event.setStatus(EventStatus.PENDING);
        } else if (event.getPaidAmount().compareTo(event.getTotalAmount()) >= 0) {
            event.setStatus(EventStatus.CONFIRMED);
        } else {
            event.setStatus(EventStatus.PARTIAL);
        }
        eventRepository.save(event);
    }

    Event getEventEntity(String publicId, Long tenantId) {
        return eventRepository.findByPublicIdAndTenant_Id(publicId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Evento no encontrado"));
    }

    private void validateNoOverlap(Long tenantId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeEventId) {
        List<Event> overlapping = eventRepository.findOverlapping(tenantId, date, startTime, endTime);
        if (excludeEventId != null) {
            overlapping = overlapping.stream()
                    .filter(e -> !e.getId().equals(excludeEventId))
                    .toList();
        }
        if (!overlapping.isEmpty()) {
            throw new BusinessException("Horario no disponible");
        }
    }

    EventResponse mapToResponse(Event event) {
        EventResponse response = new EventResponse();
        response.setPublicId(event.getPublicId());
        response.setPackagePublicId(event.getPackageProduct().getPublicId());
        response.setPackageName(event.getPackageProduct().getName());
        response.setCustomerName(event.getCustomerName());
        response.setChildName(event.getChildName());
        response.setEventDate(event.getEventDate());
        response.setStartTime(event.getStartTime());
        response.setEndTime(event.getEndTime());
        response.setGuestCount(event.getGuestCount());
        response.setNotes(event.getNotes());
        response.setTotalAmount(event.getTotalAmount());
        response.setPaidAmount(event.getPaidAmount());
        response.setPendingAmount(event.getPendingAmount());
        response.setCancellationFee(event.getCancellationFee());
        response.setRefundedAmount(event.getRefundedAmount());
        response.setStatus(event.getStatus());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());
        return response;
    }

    private EventDetailResponse mapToDetailResponse(Event event) {
        EventDetailResponse response = new EventDetailResponse();
        response.setPublicId(event.getPublicId());
        response.setPackagePublicId(event.getPackageProduct().getPublicId());
        response.setPackageName(event.getPackageProduct().getName());
        response.setPackageDescription(event.getPackageProduct().getDescription());
        response.setPackagePrice(event.getPackageProduct().getPrice());
        response.setCustomerName(event.getCustomerName());
        response.setChildName(event.getChildName());
        response.setEventDate(event.getEventDate());
        response.setStartTime(event.getStartTime());
        response.setEndTime(event.getEndTime());
        response.setGuestCount(event.getGuestCount());
        response.setNotes(event.getNotes());
        response.setTotalAmount(event.getTotalAmount());
        response.setPaidAmount(event.getPaidAmount());
        response.setPendingAmount(event.getPendingAmount());
        response.setCancellationFee(event.getCancellationFee());
        response.setRefundedAmount(event.getRefundedAmount());
        response.setStatus(event.getStatus());
        response.setCreatedAt(event.getCreatedAt());
        response.setUpdatedAt(event.getUpdatedAt());
        return response;
    }
}
