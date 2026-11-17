package com.example.drainadoption.controller;

import com.example.drainadoption.model.*;
import com.example.drainadoption.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.*;
import java.time.Instant;
import java.util.*;

@RestController
public class ReportController {
    private final ReportRepository reports;
    private final ReportUpdateRepository updates;
    private final DrainRepository drains;
    private final Path photoRoot;
    private final boolean reportPhotosEnabled;
    private static final Set<String> ISSUES=Set.of("BLOCKED_DRAIN","STANDING_WATER","DAMAGED_DRAIN","OTHER");
    private static final Set<String> STATUSES=Set.of("RECEIVED","UNDER_REVIEW","FEEDBACK_PROVIDED","CLOSED");
    public ReportController(ReportRepository reports, ReportUpdateRepository updates, DrainRepository drains,
            @Value("${aad.upload-directory}") String directory,
            @Value("${aad.report-photos-enabled}") boolean reportPhotosEnabled) {
        this.reports=reports; this.updates=updates; this.drains=drains;
        photoRoot=Path.of(directory).toAbsolutePath().normalize();
        this.reportPhotosEnabled=reportPhotosEnabled;
    }
    public record NewReport(Long drainId,String location,Double latitude,Double longitude,String issueType,
        Instant observedAt,String description,String language,boolean consent) {}
    public record StatusUpdate(String status,String feedback) {}
    public record Receipt(String id,String token,String status,boolean studyPrototype) {}
    public record View(String id,Long drainId,String location,Double latitude,Double longitude,String issueType,
        Instant observedAt,String description,String language,Instant createdAt,String status,boolean hasPhoto,
        boolean studyPrototype,List<ReportUpdate> history) {}

    @PostMapping(value="/api/reports",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Receipt> create(@RequestPart("report") NewReport input,
        @RequestPart(value="photo",required=false) MultipartFile photo) throws IOException {
        if(photo!=null&&!reportPhotosEnabled) bad("REPORT_PHOTOS_DISABLED");
        if(!input.consent()) bad("CONSENT_REQUIRED");
        if(input.location()==null || input.location().isBlank() || input.location().length()>300) bad("LOCATION_REQUIRED");
        if(input.description()==null || input.description().isBlank() || input.description().length()>2000) bad("DESCRIPTION_REQUIRED");
        if(!ISSUES.contains(Objects.toString(input.issueType(),""))) bad("INVALID_ISSUE");
        if(!Set.of("en","fi").contains(Objects.toString(input.language(),""))) bad("INVALID_LANGUAGE");
        if(input.observedAt()==null || input.observedAt().isAfter(Instant.now().plusSeconds(300))) bad("INVALID_TIME");
        if((input.latitude()==null)!=(input.longitude()==null)) bad("INVALID_COORDINATES");
        if(input.latitude()!=null && (!Double.isFinite(input.latitude()) || !Double.isFinite(input.longitude())
            || Math.abs(input.latitude())>90 || Math.abs(input.longitude())>180)) bad("INVALID_COORDINATES");
        if(input.drainId()!=null && !drains.existsById(input.drainId())) bad("UNKNOWN_DRAIN");
        Report r=new Report();r.setId(UUID.randomUUID().toString());
        byte[] secret=new byte[32];new SecureRandom().nextBytes(secret);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        r.setTokenHash(hash(token));r.setDrainId(input.drainId());r.setLocation(input.location().strip());
        r.setLatitude(input.latitude());r.setLongitude(input.longitude());r.setIssueType(input.issueType());
        r.setObservedAt(input.observedAt());r.setDescription(input.description().strip());r.setLanguage(input.language());
        r.setCreatedAt(Instant.now());
        if(photo!=null && !photo.isEmpty()) r.setPhotoFile(savePhoto(photo,r.getId()));
        reports.save(r);
        return ResponseEntity.status(201).cacheControl(CacheControl.noStore()).body(new Receipt(r.getId(),token,r.getStatus(),true));
    }
    private String savePhoto(MultipartFile file,String id) throws IOException {
        if(file.getSize()>5*1024*1024) bad("PHOTO_TOO_LARGE");
        BufferedImage image;
        try(var stream=ImageIO.createImageInputStream(file.getInputStream())) {
            Iterator<ImageReader> readers=ImageIO.getImageReaders(stream);
            if(!readers.hasNext()) {bad("INVALID_PHOTO");return null;}
            ImageReader reader=readers.next();
            try {
                reader.setInput(stream);
                String format=reader.getFormatName();
                if(!Set.of("JPEG","JPG","PNG").contains(format.toUpperCase(Locale.ROOT))) bad("INVALID_PHOTO");
                long pixels=(long)reader.getWidth(0)*reader.getHeight(0);
                if(pixels>20_000_000) bad("PHOTO_TOO_LARGE");
                image=reader.read(0);
            } finally {reader.dispose();}
        }
        Files.createDirectories(photoRoot);
        String name=id+".png";
        ImageIO.write(image,"png",photoRoot.resolve(name).toFile()); // re-encode without EXIF metadata
        return name;
    }
    private static void bad(String code) {throw new ResponseStatusException(HttpStatus.BAD_REQUEST,code);}
    private static String hash(String token) {
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));}
        catch(NoSuchAlgorithmException e) {throw new IllegalStateException(e);}
    }
    private Report access(String id,String token,Authentication auth) {
        Report r=reports.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean admin=auth!=null && auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        if(!admin && (token==null || !MessageDigest.isEqual(hash(token).getBytes(StandardCharsets.UTF_8),r.getTokenHash().getBytes(StandardCharsets.UTF_8))))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return r;
    }
    private View view(Report r) {
        return new View(r.getId(),r.getDrainId(),r.getLocation(),r.getLatitude(),r.getLongitude(),r.getIssueType(),
            r.getObservedAt(),r.getDescription(),r.getLanguage(),r.getCreatedAt(),r.getStatus(),r.getPhotoFile()!=null,true,
            updates.findByReportIdOrderByCreatedAtAsc(r.getId()));
    }
    @GetMapping("/api/reports/{id}")
    public ResponseEntity<View> get(@PathVariable String id,@RequestHeader(value="X-Report-Token",required=false) String token,Authentication auth) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(view(access(id,token,auth)));
    }
    @GetMapping("/api/reports/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable String id,@RequestHeader(value="X-Report-Token",required=false) String token,Authentication auth) throws IOException {
        Report r=access(id,token,auth);
        if(r.getPhotoFile()==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.IMAGE_PNG)
            .header("X-Content-Type-Options","nosniff").body(Files.readAllBytes(photoRoot.resolve(r.getPhotoFile())));
    }
    @GetMapping("/api/admin/reports")
    public ResponseEntity<List<View>> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(reports.findAll().stream()
            .sorted(Comparator.comparing(Report::getCreatedAt).reversed()).map(this::view).toList());
    }
    @PutMapping("/api/admin/reports/{id}") @Transactional
    public View update(@PathVariable String id,@RequestBody StatusUpdate input) {
        if(!STATUSES.contains(Objects.toString(input.status(),""))) bad("INVALID_STATUS");
        if(input.feedback()==null || input.feedback().isBlank() || input.feedback().length()>2000) bad("FEEDBACK_REQUIRED");
        Report r=reports.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        r.setStatus(input.status());reports.save(r);
        ReportUpdate u=new ReportUpdate();u.setReportId(id);u.setStatus(input.status());
        u.setFeedback(input.feedback().strip());u.setCreatedAt(Instant.now());updates.save(u);
        return view(r);
    }
    @GetMapping(value="/api/admin/reports/export",produces="text/csv")
    public ResponseEntity<String> export() {
        // Aggregate operational metadata only: exclude free text, photos, precise location and tokens.
        StringBuilder csv=new StringBuilder("report_id,issue_type,language,status,created_at,study_prototype\r\n");
        for(Report r:reports.findAll()) csv.append(String.join(",",r.getId(),r.getIssueType(),r.getLanguage(),r.getStatus(),r.getCreatedAt().toString(),"true")).append("\r\n");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).header("Content-Disposition","attachment; filename=reports.csv").body(csv.toString());
    }
}
