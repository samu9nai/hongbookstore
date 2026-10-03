package com.hongik.books.domain.wanted.repository;

import com.hongik.books.domain.wanted.domain.Wanted;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WantedRepository extends JpaRepository<Wanted, Long>, JpaSpecificationExecutor<Wanted> {
}
