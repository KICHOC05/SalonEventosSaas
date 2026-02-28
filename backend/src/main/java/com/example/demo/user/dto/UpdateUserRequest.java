package com.example.demo.user.dto;

import com.example.demo.common.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {

    private String name;

    private Long branchId;

    private UserRole role;

    private Boolean active;
}