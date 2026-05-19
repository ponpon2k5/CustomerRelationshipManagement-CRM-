package com.scrum.crm.service;

import com.scrum.crm.dto.customer.CustomerResponse;
import com.scrum.crm.entity.Customer;
import com.scrum.crm.repository.CustomerRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<CustomerResponse> searchCustomers(String keyword) {

        List<Customer> customers =
                customerRepository.searchCustomers(keyword);

        return customers.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CustomerResponse mapToResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getCompany(),
                customer.getAddress(),
                customer.getIsActive(),
                customer.getCreatedBy().getId(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}