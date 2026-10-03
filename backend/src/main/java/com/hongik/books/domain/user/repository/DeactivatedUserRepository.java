package com.hongik.books.domain.user.repository;

import com.hongik.books.domain.user.domain.DeactivatedUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DeactivatedUserRepository extends JpaRepository<DeactivatedUser, Long> {
    boolean existsByUserId(Long userId);
    List<DeactivatedUser> findByUserIdIn(Collection<Long> userIds);
}
