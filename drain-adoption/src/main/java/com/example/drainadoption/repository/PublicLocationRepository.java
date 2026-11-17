package com.example.drainadoption.repository;

import com.example.drainadoption.model.PublicLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PublicLocationRepository extends JpaRepository<PublicLocation, Long> {
    List<PublicLocation> findAllByPublishedTrueOrderByObservedOnDescIdDesc();
    List<PublicLocation> findAllByOrderByObservedOnDescIdDesc();
    Optional<PublicLocation> findByIdAndPublishedTrue(Long id);
}
