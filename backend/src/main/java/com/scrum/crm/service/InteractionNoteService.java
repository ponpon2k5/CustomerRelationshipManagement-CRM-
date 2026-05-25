package com.scrum.crm.service;

import com.scrum.crm.dto.interaction.InteractionNoteCreateRequest;
import com.scrum.crm.dto.interaction.InteractionIssueResponse;
import com.scrum.crm.dto.interaction.InteractionNoteResponse;
import com.scrum.crm.dto.interaction.InteractionNoteUpdateRequest;
import com.scrum.crm.dto.interaction.InteractionSummaryResponse;
import com.scrum.crm.entity.AiSummaryStatus;
import com.scrum.crm.entity.Customer;
import com.scrum.crm.entity.InteractionNote;
import com.scrum.crm.entity.User;
import com.scrum.crm.entity.UserRole;
import com.scrum.crm.exception.ResourceNotFoundException;
import com.scrum.crm.exception.UnauthorizedException;
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
    private final AiSummaryService aiSummaryService;

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
        note.setIsDone(Boolean.TRUE.equals(request.getIsDone()));

        InteractionNote savedNote = interactionNoteRepository.save(note);
        aiSummaryService.createAndQueueSummary(savedNote.getId());
        return mapToResponse(savedNote);
    }

    @Transactional(readOnly = true)
    public List<InteractionNoteResponse> listByCustomer(Long customerId, Long actorId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }

        User actor = requireActiveActor(actorId);
        List<InteractionNote> notes;
        if (actor.getRole() == UserRole.ADMIN) {
            notes = interactionNoteRepository.findByCustomer_IdOrderByInteractionTimeDesc(customerId);
        } else {
            notes = interactionNoteRepository.findByCustomer_IdAndCreatedBy_IdOrderByInteractionTimeDesc(customerId, actor.getId());
        }

        return notes.stream()
                .map(this::mapToResponse)
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
                        note.getIsDone(),
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
        if (request.getIsDone() != null) {
            note.setIsDone(request.getIsDone());
        }
        InteractionNote saved = interactionNoteRepository.save(note);
        return mapToResponse(saved);
    }

    private InteractionNoteResponse mapToResponse(InteractionNote note) {
        InteractionSummaryResponse latestSummary = aiSummaryService.findLatestSummaryOrNull(note.getId());
        AiSummaryStatus status = latestSummary != null ? latestSummary.status() : AiSummaryStatus.PENDING;
        return InteractionNoteMapper.toResponse(note, status, latestSummary);
    }

    private User requireActiveActor(Long actorId) {
        if (actorId == null) {
            throw new UnauthorizedException("Missing actorId.");
        }
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + actorId));
        if (!Boolean.TRUE.equals(actor.getIsActive())) {
            throw new UnauthorizedException("User account is inactive.");
        }
        return actor;
    }
}
