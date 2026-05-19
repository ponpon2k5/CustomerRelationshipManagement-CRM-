package com.scrum.crm.dto.customer;

import java.util.List;

public record CustomerSearchResponse(
        String message,
        int count,
        List<CustomerResponse> customers
) {
}