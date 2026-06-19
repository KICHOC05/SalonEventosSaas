package com.example.demo.event.controller;

import com.example.demo.common.enums.EventStatus;
import com.example.demo.event.dto.*;
import com.example.demo.event.service.EventPaymentService;
import com.example.demo.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventPaymentService eventPaymentService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping
    public EventResponse createEvent(@Valid @RequestBody EventRequest request) {
        return eventService.createEvent(request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    @GetMapping("/day")
    public List<EventResponse> getDayEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return eventService.getDayEvents(date);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    @GetMapping("/month")
    public List<EventResponse> getMonthEvents(
            @RequestParam int year,
            @RequestParam int month) {
        return eventService.getMonthEvents(year, month);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    @GetMapping("/{publicId}")
    public EventDetailResponse getEventDetail(@PathVariable String publicId) {
        return eventService.getEventDetail(publicId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PutMapping("/{publicId}")
    public EventResponse update(
            @PathVariable String publicId,
            @Valid @RequestBody EventUpdateRequest request) {
        return eventService.update(publicId, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PutMapping("/{publicId}/reschedule")
    public EventResponse reschedule(
            @PathVariable String publicId,
            @Valid @RequestBody EventRescheduleRequest request) {
        return eventService.reschedule(publicId, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping("/{publicId}/cancel")
    public EventResponse cancel(@PathVariable String publicId) {
        return eventService.cancel(publicId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping("/{publicId}/complete")
    public EventResponse complete(@PathVariable String publicId) {
        return eventService.complete(publicId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','EMPLOYEE')")
    @PostMapping("/{publicId}/payments")
    public EventPaymentResponse registerPayment(
            @PathVariable String publicId,
            @Valid @RequestBody EventPaymentRequest request) {
        return eventPaymentService.registerPayment(publicId, request);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/report")
    public EventReportResponse getReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) Long branchId) {
        return eventService.getReport(startDate, endDate, status, branchId);
    }
}
