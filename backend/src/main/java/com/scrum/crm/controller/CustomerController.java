package com.scrum.crm.controller;

import com.scrum.crm.dto.customer.CustomerResponse;
import com.scrum.crm.service.CustomerService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/search")
    public List<CustomerResponse> searchCustomers(
            @RequestParam String keyword
    ) {
        return customerService.searchCustomers(keyword);
    }
}