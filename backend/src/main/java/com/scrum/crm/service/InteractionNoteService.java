package com.scrum.crm.service;

import com.scrum.crm.dto.interaction.InteractionNoteCreateRequest;
import com.scrum.crm.dto.interaction.InteractionIssueResponse;
import com.scrum.crm.dto.interaction.InteractionNoteResponse;
import com.scrum.crm.dto.interaction.InteractionNoteUpdateRequest;
import com.scrum.crm.entity.Customer;
import com.scrum.crm.entity.InteractionNote;
import com.scrum.crm.entity.User;
import com.scrum.crm.exception.ResourceNotFoundException;
import com.scrum.crm.mapper.InteractionNoteMapper;
import com.scrum.crm.repository.CustomerRepository;
import com.scrum.crm.repository.InteractionNoteRepository;
import com.scrum.crm.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InteractionNoteService {

    private final InteractionNoteRepository interactionNoteRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Transactional
    public InteractionNoteResponse create(Long customerId, InteractionNoteCreateRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        User createdBy = userRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + request.getCreatedById()));

        InteractionNote note = new InteractionNote();
        note.setCustomer(customer);
        note.setCreatedBy(createdBy);
        note.setInteractionType(request.getInteractionType());
        note.setInteractionTime(
                request.getInteractionTime() != null ? request.getInteractionTime() : LocalDateTime.now());
        note.setTitle(request.getTitle().trim());
        note.setDescription(request.getDescription().trim());
        note.setPriority(request.getPriority());
        note.setStatus(request.getStatus());

        return InteractionNoteMapper.toResponse(interactionNoteRepository.save(note));
    }

    @Transactional(readOnly = true)
    public List<InteractionNoteResponse> listByCustomer(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }

        return interactionNoteRepository.findByCustomer_IdOrderByInteractionTimeDesc(customerId).stream()
                .map(InteractionNoteMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InteractionIssueResponse> listIssues(int limit) {
        int sanitizedLimit = Math.min(Math.max(limit, 1), 1000);
        return interactionNoteRepository.findIssues(PageRequest.of(0, sanitizedLimit)).stream()
                .map(note -> new InteractionIssueResponse(
                        note.getId(),
                        note.getTitle(),
                        note.getDescription(),
                        note.getInteractionType(),
                        note.getInteractionTime(),
                        note.getPriority(),
                        note.getStatus(),
                        note.getCustomer().getId(),
                        note.getCustomer().getFullName(),
                        note.getCustomer().getEmail(),
                        note.getCustomer().getPhone(),
                        note.getCustomer().getCompany(),
                        note.getCreatedBy().getId(),
                        note.getCreatedBy().getFullName()
                ))
                .toList();
    }

    @Transactional
    public InteractionNoteResponse update(Long id, InteractionNoteUpdateRequest request) {
        InteractionNote note = interactionNoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interaction note not found with id: " + id));

        note.setInteractionType(request.getInteractionType());
        note.setInteractionTime(request.getInteractionTime());
        note.setTitle(request.getTitle().trim());
        note.setDescription(request.getDescription().trim());
        note.setPriority(request.getPriority());
        note.setStatus(request.getStatus());
        return InteractionNoteMapper.toResponse(interactionNoteRepository.save(note));
    }
}
