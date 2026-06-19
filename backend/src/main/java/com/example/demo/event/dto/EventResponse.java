package com.example.demo.event.dto;

import com.example.demo.common.enums.EventStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class EventResponse {

    private String publicId;
    private String packagePublicId;
    private String packageName;
    private String customerName;
    private String childName;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer guestCount;
    private String notes;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private BigDecimal cancellationFee;
    private BigDecimal refundedAmount;
    private EventStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
