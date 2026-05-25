package com.scrum.crm.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.scrum.crm.dto.dashboard.DashboardStatsResponse;
import com.scrum.crm.dto.dashboard.RecentActivityResponse;
import com.scrum.crm.entity.Customer;
import com.scrum.crm.entity.InteractionNote;
import com.scrum.crm.entity.InteractionType;
import com.scrum.crm.repository.CustomerRepository;
import com.scrum.crm.repository.InteractionNoteRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InteractionNoteRepository interactionNoteRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getStatsIncludesRecentInteractionCountAndRecentActivities() {
        LocalDateTime sevenDaysAgoBeforeCall = LocalDateTime.now().minusDays(7).minusSeconds(1);
        LocalDateTime interactionTime = LocalDateTime.of(2026, 5, 25, 9, 0);
        Customer customer = new Customer();
        customer.setId(42L);
        customer.setFullName("Nguyen Van A");
        customer.setCompany("Acme CRM");

        InteractionNote note = new InteractionNote();
        note.setId(99L);
        note.setCustomer(customer);
        note.setInteractionType(InteractionType.EMAIL);
        note.setInteractionTime(interactionTime);
        note.setTitle("Follow-up email");
        note.setDescription("Sent support update");

        when(customerRepository.countByActiveStatus()).thenReturn(List.of(
                new Object[] {true, 2L},
                new Object[] {false, 1L}
        ));
        when(interactionNoteRepository.countByCreatedAtGreaterThanEqual(any(LocalDateTime.class))).thenReturn(3L);
        when(interactionNoteRepository.countByInteractionType()).thenReturn(List.<Object[]>of(
                new Object[] {InteractionType.EMAIL, 2L}
        ));
        when(interactionNoteRepository.findRecentActivities(any(Pageable.class))).thenReturn(List.of(note));

        DashboardStatsResponse stats = dashboardService.getStats();

        assertThat(stats.totalCustomers()).isEqualTo(3L);
        assertThat(stats.recentInteractionsCount()).isEqualTo(3L);
        assertThat(stats.recentActivities()).hasSize(1);

        RecentActivityResponse activity = stats.recentActivities().get(0);
        assertThat(activity.id()).isEqualTo(99L);
        assertThat(activity.customerId()).isEqualTo(42L);
        assertThat(activity.customerName()).isEqualTo("Nguyen Van A");
        assertThat(activity.companyName()).isEqualTo("Acme CRM");
        assertThat(activity.interactionType()).isEqualTo(InteractionType.EMAIL);
        assertThat(activity.interactionTime()).isEqualTo(interactionTime);
        assertThat(activity.title()).isEqualTo("Follow-up email");
        assertThat(activity.description()).isEqualTo("Sent support update");

        ArgumentCaptor<LocalDateTime> cutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(interactionNoteRepository).countByCreatedAtGreaterThanEqual(cutoffCaptor.capture());
        assertThat(cutoffCaptor.getValue())
                .isAfterOrEqualTo(sevenDaysAgoBeforeCall)
                .isBeforeOrEqualTo(LocalDateTime.now().minusDays(7).plusSeconds(1));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(interactionNoteRepository).findRecentActivities(pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(5);
    }
}
