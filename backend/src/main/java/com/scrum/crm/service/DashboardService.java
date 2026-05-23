package com.scrum.crm.service;

import com.scrum.crm.dto.dashboard.CustomerStatusCountResponse;
import com.scrum.crm.dto.dashboard.DashboardStatsResponse;
import com.scrum.crm.dto.dashboard.InteractionTypeCountResponse;
import com.scrum.crm.dto.dashboard.RecentActivityResponse;
import com.scrum.crm.entity.InteractionNote;
import com.scrum.crm.entity.InteractionType;
import com.scrum.crm.repository.CustomerRepository;
import com.scrum.crm.repository.InteractionNoteRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final int RECENT_DAYS = 7;
    private static final int RECENT_ACTIVITY_LIMIT = 5;
    private static final long CACHE_TTL_MILLIS = 15_000;

    private final CustomerRepository customerRepository;
    private final InteractionNoteRepository interactionNoteRepository;
    private volatile DashboardStatsResponse cachedStats;
    private volatile long cacheExpiresAtMillis;

    public DashboardStatsResponse getStats() {
        long now = System.currentTimeMillis();
        DashboardStatsResponse snapshot = cachedStats;
        if (snapshot != null && now < cacheExpiresAtMillis) {
            return snapshot;
        }

        synchronized (this) {
            snapshot = cachedStats;
            now = System.currentTimeMillis();
            if (snapshot != null && now < cacheExpiresAtMillis) {
                return snapshot;
            }

            DashboardStatsResponse freshStats = buildStats();
            cachedStats = freshStats;
            cacheExpiresAtMillis = now + CACHE_TTL_MILLIS;
            return freshStats;
        }
    }

    private DashboardStatsResponse buildStats() {
        List<Object[]> customerStatusRows = customerRepository.countByActiveStatus();
        long activeCustomers = countCustomers(customerStatusRows, true);
        long inactiveCustomers = countCustomers(customerStatusRows, false);
        long totalCustomers = activeCustomers + inactiveCustomers;
        long recentInteractionsCount = interactionNoteRepository.countByInteractionTimeGreaterThanEqual(
                LocalDateTime.now().minusDays(RECENT_DAYS)
        );

        List<CustomerStatusCountResponse> customersByStatus = List.of(
                new CustomerStatusCountResponse("Active", activeCustomers),
                new CustomerStatusCountResponse("Inactive", inactiveCustomers)
        );

        List<InteractionTypeCountResponse> interactionsByType = interactionNoteRepository.countByInteractionType()
                .stream()
                .map(row -> new InteractionTypeCountResponse((InteractionType) row[0], (Long) row[1]))
                .toList();

        List<RecentActivityResponse> recentActivities = interactionNoteRepository
                .findRecentActivities(PageRequest.of(0, RECENT_ACTIVITY_LIMIT))
                .stream()
                .map(this::toRecentActivity)
                .toList();

        return new DashboardStatsResponse(
                totalCustomers,
                customersByStatus,
                recentInteractionsCount,
                interactionsByType,
                recentActivities
        );
    }

    private long countCustomers(List<Object[]> rows, boolean active) {
        return rows.stream()
                .filter(row -> Boolean.valueOf(active).equals(row[0]))
                .mapToLong(row -> (Long) row[1])
                .findFirst()
                .orElse(0L);
    }

    private RecentActivityResponse toRecentActivity(InteractionNote note) {
        return new RecentActivityResponse(
                note.getId(),
                note.getCustomer().getId(),
                note.getCustomer().getFullName(),
                note.getCustomer().getCompany(),
                note.getInteractionType(),
                note.getInteractionTime(),
                note.getTitle(),
                note.getDescription()
        );
    }
}
