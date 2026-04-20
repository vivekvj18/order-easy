package com.ordereasy.auth_service.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    // Login identifier: can be phone number OR email (both supported)
    private String phoneNumber;
    private String email;
    private String password;
}
