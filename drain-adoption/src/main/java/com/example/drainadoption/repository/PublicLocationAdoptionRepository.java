package com.example.drainadoption.repository;

import com.example.drainadoption.model.PublicLocationAdoption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PublicLocationAdoptionRepository extends JpaRepository<PublicLocationAdoption, Long> {
    @Query("select a.location.id from PublicLocationAdoption a where a.adopter.email = :email and a.location.published = true order by a.location.id")
    List<Long> findPublishedIdsFor(@Param("email") String email);

    boolean existsByAdopterIdAndLocationId(Long adopterId, Long locationId);

    @Modifying
    @Query("delete from PublicLocationAdoption a where a.adopter.id = :adopterId and a.location.id = :locationId")
    void removeForAdopter(@Param("adopterId") Long adopterId, @Param("locationId") Long locationId);

    @Modifying
    @Query("delete from PublicLocationAdoption a where a.location.id = :locationId")
    void removeForLocation(@Param("locationId") Long locationId);
}
