package com.example.drainadoption.repository;

import com.example.drainadoption.model.PublicLocation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PublicLocationRepository extends JpaRepository<PublicLocation, Long> {
    List<PublicLocation> findAllByPublishedTrueOrderByObservedOnDescIdDesc();
    List<PublicLocation> findAllByOrderByObservedOnDescIdDesc();
    Optional<PublicLocation> findByIdAndPublishedTrue(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select location from PublicLocation location where location.id = :id")
    Optional<PublicLocation> findForUpdate(@Param("id") Long id);
}
