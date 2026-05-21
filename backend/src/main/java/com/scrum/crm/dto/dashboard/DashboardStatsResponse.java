package com.scrum.crm.dto.dashboard;

import java.util.List;

public record DashboardStatsResponse(
        long totalCustomers,
        List<CustomerStatusCountResponse> customersByStatus,
        long recentInteractionsCount,
        List<InteractionTypeCountResponse> interactionsByType,
        List<RecentActivityResponse> recentActivities
) {
}
