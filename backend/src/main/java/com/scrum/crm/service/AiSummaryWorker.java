package com.scrum.crm.service;

import com.scrum.crm.entity.AiAuditLog;
import com.scrum.crm.entity.InteractionNote;
import com.scrum.crm.entity.InteractionSummary;
import com.scrum.crm.exception.ResourceNotFoundException;
import com.scrum.crm.repository.AiAuditLogRepository;
import com.scrum.crm.repository.InteractionNoteRepository;
import com.scrum.crm.repository.InteractionSummaryCommandRepository;
import com.scrum.crm.repository.InteractionSummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AiSummaryWorker {

    private final InteractionNoteRepository interactionNoteRepository;
    private final InteractionSummaryRepository interactionSummaryRepository;
    private final InteractionSummaryCommandRepository interactionSummaryCommandRepository;
    private final AiAuditLogRepository aiAuditLogRepository;
    private final AiSummaryGenerator aiSummaryGenerator;

    @Async
    @Transactional
    public void processSummary(Long noteId, Long summaryId) {
        long startedAt = System.currentTimeMillis();
        interactionSummaryCommandRepository.markSummaryProcessing(summaryId);
        interactionSummaryCommandRepository.markNoteProcessing(noteId);

        InteractionSummary summaryRef = interactionSummaryRepository.findById(summaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Interaction summary not found with id: " + summaryId));

        try {
            InteractionNote note = interactionNoteRepository.findById(noteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Interaction note not found with id: " + noteId));

            AiSummaryGenerator.GenerationResult generationResult = aiSummaryGenerator.generate(note);
            AiSummaryGenerator.StructuredSummary structured = generationResult.summary();

            interactionSummaryCommandRepository.markSummaryCompleted(
                    summaryId,
                    generationResult.rawResponse(),
                    structured.conversationSummary(),
                    structured.customerNeeds(),
                    structured.painPoints(),
                    structured.commitments(),
                    structured.nextSteps(),
                    structured.riskFlags(),
                    generationResult.tokensUsed()
            );
            interactionSummaryCommandRepository.markNoteCompleted(noteId);
            saveAuditLog(summaryRef, generationResult.promptSent(), generationResult.rawResponse(), startedAt);
        } catch (Exception ex) {
            interactionSummaryCommandRepository.markSummaryFailed(summaryId, ex.getMessage(), null);
            interactionSummaryCommandRepository.markNoteFailed(noteId);
            saveAuditLog(summaryRef, "generation_failed", ex.getMessage(), startedAt);
        }
    }

    private void saveAuditLog(InteractionSummary summary, String promptSent, String response, long startedAt) {
        AiAuditLog log = new AiAuditLog();
        log.setSummary(summary);
        log.setPromptSent(promptSent);
        log.setResponse(response);
        log.setDurationMs((int) (System.currentTimeMillis() - startedAt));
        aiAuditLogRepository.save(log);
    }
}
