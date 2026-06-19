package com.example.demo.event.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class EventReportResponse {

    private long totalEvents;
    private long confirmedEvents;
    private long cancelledEvents;
    private BigDecimal pendingBalance;
    private BigDecimal revenue;
}
