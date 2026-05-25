package com.scrum.crm.controller;

import com.scrum.crm.dto.interaction.AiSummaryBatchRequest;
import com.scrum.crm.dto.interaction.AiSummaryBatchResponse;
import com.scrum.crm.dto.interaction.AiSummaryRegenerateResponse;
import com.scrum.crm.dto.interaction.InteractionNoteCreateRequest;
import com.scrum.crm.dto.interaction.InteractionIssueResponse;
import com.scrum.crm.dto.interaction.InteractionNoteResponse;
import com.scrum.crm.dto.interaction.InteractionSummaryResponse;
import com.scrum.crm.dto.interaction.InteractionNoteUpdateRequest;
import com.scrum.crm.service.AiSummaryService;
import com.scrum.crm.service.InteractionNoteService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InteractionNoteController {

    private final InteractionNoteService interactionNoteService;
    private final AiSummaryService aiSummaryService;

    @PostMapping("/customers/{customerId}/interactions")
    public ResponseEntity<InteractionNoteResponse> create(
            @PathVariable Long customerId,
            @Valid @RequestBody InteractionNoteCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interactionNoteService.create(customerId, request));
    }

    @GetMapping("/customers/{customerId}/interactions")
    public ResponseEntity<List<InteractionNoteResponse>> listByCustomer(
            @PathVariable Long customerId,
            @RequestParam Long actorId) {
        return ResponseEntity.ok(interactionNoteService.listByCustomer(customerId, actorId));
    }

    @GetMapping("/interactions/issues")
    public ResponseEntity<List<InteractionIssueResponse>> listIssues(
            @RequestParam(defaultValue = "200") int limit) { // Nếu client không truyền query parameter đó lên URL,
                                                             // Spring Boot sẽ tự dùng giá trị mặc định là "200".
        return ResponseEntity.ok(interactionNoteService.listIssues(limit));
    }

    @PutMapping("/interactions/{id}")
    public ResponseEntity<InteractionNoteResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InteractionNoteUpdateRequest request) {
        return ResponseEntity.ok(interactionNoteService.update(id, request));
    }

    @GetMapping("/interactions/{id}/summary")
    public ResponseEntity<InteractionSummaryResponse> getLatestSummary(@PathVariable Long id) {
        return ResponseEntity.ok(aiSummaryService.getLatestSummary(id));
    }

    @PatchMapping("/notes/{id}/regenerate-summary")
    public ResponseEntity<AiSummaryRegenerateResponse> regenerateSummary(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(aiSummaryService.regenerateSummary(id));
    }

    @PostMapping("/notes/summaries/batch")
    public ResponseEntity<AiSummaryBatchResponse> processBatchSummary(
            @Valid @RequestBody AiSummaryBatchRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(aiSummaryService.processBatch(request));
    }
}
