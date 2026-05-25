package com.scrum.crm.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "customers", schema = "public", uniqueConstraints = {
        @UniqueConstraint(name = "uq_customers_email", columnNames = "email")
}, indexes = {
        @Index(name = "idx_customers_full_name", columnList = "full_name"),
        @Index(name = "idx_customers_phone", columnList = "phone"),
        @Index(name = "idx_customers_email", columnList = "email"),
        @Index(name = "idx_customers_is_active", columnList = "is_active"),
        @Index(name = "idx_customers_customer_stage", columnList = "customer_stage")
})
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Giá trị khóa chính id sẽ được database tự động tạo ra khi
                                                        // thêm record mới.
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, length = 150, unique = true)
    private String email;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "company", length = 150)
    private String company;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Enumerated(EnumType.STRING) // Khi lưu enum xuống database, lưu bằng tên của enum, không lưu bằng số thứ
                                 // tự.
    @Column(name = "customer_stage", nullable = false, length = 20)
    private CustomerStage customerStage;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // mối quan hệ 1 - n
    @JoinColumn(name = "created_by", nullable = false)
    // Trong bảng hiện tại sẽ có một cột khóa ngoại tên là created_by, dùng để liên
    // kết tới bảng users, và cột này không được phép null.
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist // Method này sẽ tự động chạy ngay trước khi entity được lưu lần đầu vào
                // database
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
        if (customerStage == null) {
            customerStage = CustomerStage.LEAD;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate // sẽ tự động chạy ngay trước khi entity được update xuống database
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
