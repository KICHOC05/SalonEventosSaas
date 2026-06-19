package com.example.demo.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class EventRequest {

    @NotBlank
    private String packagePublicId;

    @NotBlank
    private String customerName;

    private String childName;

    @NotNull
    private LocalDate eventDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    private Integer guestCount;

    private String notes;
}
