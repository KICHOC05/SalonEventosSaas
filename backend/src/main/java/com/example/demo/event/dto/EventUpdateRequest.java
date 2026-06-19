package com.example.demo.event.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventUpdateRequest {

    @NotBlank
    private String customerName;

    private String childName;

    private Integer guestCount;

    private String notes;
}
