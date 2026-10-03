package com.hongik.books.domain.user.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "deactivated_users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_deactivated_user_user_id", columnNames = "user_id")
})
public class DeactivatedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "deactivated_at", nullable = false)
    private LocalDateTime deactivatedAt;
}
