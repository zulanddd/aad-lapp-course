package com.example.drainadoption.repository;
import com.example.drainadoption.model.ReportUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReportUpdateRepository extends JpaRepository<ReportUpdate,Long> {
    List<ReportUpdate> findByReportIdOrderByCreatedAtAsc(String reportId);
}
