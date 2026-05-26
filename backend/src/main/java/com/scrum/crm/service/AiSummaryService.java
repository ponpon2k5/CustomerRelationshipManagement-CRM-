package com.scrum.crm.service;

import com.scrum.crm.dto.interaction.AiSummaryBatchItemResponse;
import com.scrum.crm.dto.interaction.AiSummaryBatchRequest;
import com.scrum.crm.dto.interaction.AiSummaryBatchResponse;
import com.scrum.crm.dto.interaction.AiSummaryRegenerateResponse;
import com.scrum.crm.dto.interaction.InteractionSummaryResponse;
import com.scrum.crm.entity.AiSummaryStatus;
import com.scrum.crm.entity.InteractionSummary;
import com.scrum.crm.exception.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import com.scrum.crm.repository.InteractionNoteRepository;
import com.scrum.crm.repository.InteractionSummaryCommandRepository;
import com.scrum.crm.repository.InteractionSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class AiSummaryService {

    private final InteractionNoteRepository interactionNoteRepository;
    private final InteractionSummaryRepository interactionSummaryRepository;
    private final InteractionSummaryCommandRepository interactionSummaryCommandRepository;
    private final AiSummaryWorker aiSummaryWorker;

    @Value("${crm.ai.prompt-version:v1.0}")
    private String promptVersion;

    @Value("${crm.ai.gemini.model:gemini-2.5-flash}")
    private String modelUsed;

    @Transactional
    public Long createAndQueueSummary(Long noteId) {
        if (!interactionNoteRepository.existsById(noteId)) {
            throw new ResourceNotFoundException("Interaction note not found with id: " + noteId);
        }

        interactionSummaryCommandRepository.markNotePending(noteId); // update trạng thái note sang PENDING cho AI
                                                                     // summary.
        // insert một record mới vào bảng summary với trạng thái pending cho noteId.
        Long summaryId = interactionSummaryCommandRepository.createPendingSummary(noteId, promptVersion, modelUsed);
        triggerAfterCommit(noteId, summaryId);
        return summaryId;
    }

    @Transactional
    public AiSummaryRegenerateResponse regenerateSummary(Long noteId) {
        Long summaryId = createAndQueueSummary(noteId);
        return new AiSummaryRegenerateResponse(noteId, summaryId, AiSummaryStatus.PENDING.value());
    }

    @Transactional
    public AiSummaryBatchResponse processBatch(AiSummaryBatchRequest request) {
        String action = normalizeAction(request.action());
        boolean regenerate = "regenerate".equals(action);
        List<Long> uniqueNoteIds = new ArrayList<>(new LinkedHashSet<>(request.noteIds()));
        List<AiSummaryBatchItemResponse> results = new ArrayList<>();
        int accepted = 0;

        for (Long noteId : uniqueNoteIds) {
            if (noteId == null) {
                results.add(new AiSummaryBatchItemResponse(null, "skipped", null, "invalid_note_id"));
                continue;
            }
            if (!interactionNoteRepository.existsById(noteId)) {
                results.add(new AiSummaryBatchItemResponse(noteId, "skipped", null, "note_not_found"));
                continue;
            }

            InteractionSummaryResponse latest = findLatestSummaryOrNull(noteId);
            if (latest != null
                    && (latest.status() == AiSummaryStatus.PENDING || latest.status() == AiSummaryStatus.PROCESSING)) {
                results.add(new AiSummaryBatchItemResponse(noteId, "skipped", null, "summary_in_progress"));
                continue;
            }
            if (!regenerate && latest != null && latest.status() == AiSummaryStatus.COMPLETED) {
                results.add(new AiSummaryBatchItemResponse(noteId, "skipped", latest.id(), "already_completed"));
                continue;
            }

            try {
                Long summaryId = createAndQueueSummary(noteId);
                accepted++;
                results.add(new AiSummaryBatchItemResponse(noteId, "accepted", summaryId, "queued"));
            } catch (Exception ex) {
                results.add(new AiSummaryBatchItemResponse(noteId, "skipped", null, "queue_failed"));
            }
        }

        return new AiSummaryBatchResponse(
                action,
                uniqueNoteIds.size(),
                accepted,
                uniqueNoteIds.size() - accepted,
                results);
    }

    @Transactional(readOnly = true)
    public InteractionSummaryResponse getLatestSummary(Long noteId) {
        if (!interactionNoteRepository.existsById(noteId)) {
            throw new ResourceNotFoundException("Interaction note not found with id: " + noteId);
        }
        InteractionSummary summary = interactionSummaryRepository.findFirstByNote_IdOrderByCreatedAtDesc(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No summary found for interaction note id: " + noteId));
        return toResponse(summary);
    }

    @Transactional(readOnly = true)
    public InteractionSummaryResponse findLatestSummaryOrNull(Long noteId) {
        return interactionSummaryRepository.findFirstByNote_IdOrderByCreatedAtDesc(noteId)
                .map(this::toResponse)
                .orElse(null);
    }

    public InteractionSummaryResponse toResponse(InteractionSummary summary) {
        return new InteractionSummaryResponse(
                summary.getId(),
                summary.getNote().getId(),
                AiSummaryStatus.fromValue(summary.getStatus()),
                summary.getConversationSummary(),
                summary.getCustomerNeeds(),
                summary.getPainPoints(),
                summary.getCommitments(),
                summary.getNextSteps(),
                summary.getRiskFlags(),
                summary.getPromptVersion(),
                summary.getModelUsed(),
                summary.getTokensUsed(),
                summary.getErrorMessage(),
                summary.getCreatedAt(),
                summary.getCompletedAt());
    }

    private void triggerAfterCommit(Long noteId, Long summaryId) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            aiSummaryWorker.processSummary(noteId, summaryId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiSummaryWorker.processSummary(noteId, summaryId);
            }
        });
    }

    private String normalizeAction(String rawAction) {
        if (rawAction == null || rawAction.isBlank()) {
            return "generate";
        }
        String action = rawAction.trim().toLowerCase();
        return "regenerate".equals(action) ? "regenerate" : "generate";
    }
}
