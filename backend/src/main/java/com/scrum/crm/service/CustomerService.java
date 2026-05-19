package com.scrum.crm.service;

import com.scrum.crm.dto.customer.CustomerCreateRequest;
import com.scrum.crm.dto.customer.CustomerResponse;
import com.scrum.crm.dto.customer.CustomerUpdateRequest;
import com.scrum.crm.entity.Customer;
import com.scrum.crm.entity.User;
import com.scrum.crm.exception.ConflictException;
import com.scrum.crm.exception.ResourceNotFoundException;
import com.scrum.crm.repository.CustomerRepository;
import com.scrum.crm.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public List<CustomerResponse> searchCustomers(String keyword) {
        List<Customer> customers = customerRepository.searchCustomers(keyword);
        return customers.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already exists: " + request.getEmail());
        }

        User creator = userRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getCreatedById()));

        Customer customer = new Customer();
        customer.setFullName(request.getFullName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setCompany(request.getCompany());
        customer.setAddress(request.getAddress());
        customer.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
        customer.setCreatedBy(creator);

        Customer savedCustomer = customerRepository.save(customer);
        return toResponse(savedCustomer);
    }

    public List<CustomerResponse> getCustomers() {
        return customerRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));

        if (customerRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new ConflictException("Email already exists: " + request.getEmail());
        }

        customer.setFullName(request.getFullName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setCompany(request.getCompany());
        customer.setAddress(request.getAddress());
        customer.setIsActive(request.getIsActive());

        Customer savedCustomer = customerRepository.save(customer);
        return toResponse(savedCustomer);
    }

    @Transactional
    public CustomerResponse deactivateCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));

        customer.setIsActive(false);
        Customer savedCustomer = customerRepository.save(customer);
        return toResponse(savedCustomer);
    }

    private CustomerResponse toResponse(Customer customer) {
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
                customer.getUpdatedAt());
    }
}
