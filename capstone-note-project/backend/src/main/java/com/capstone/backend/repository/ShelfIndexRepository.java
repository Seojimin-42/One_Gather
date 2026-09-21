package com.capstone.backend.repository;

import com.capstone.backend.entity.ShelfIndex;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShelfIndexRepository extends JpaRepository<ShelfIndex, Long> {
    Optional<ShelfIndex> findByName(String name);
    boolean existsByName(String name);
}