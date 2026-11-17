package com.example.drainadoption.controller;

import com.example.drainadoption.model.PublicLocation;
import com.example.drainadoption.model.PublicLocationPhoto;
import com.example.drainadoption.repository.PublicLocationPhotoRepository;
import com.example.drainadoption.repository.PublicLocationRepository;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@RestController
@Transactional
public class PublicLocationController {
    private final PublicLocationRepository locations;
    private final PublicLocationPhotoRepository photos;
    public PublicLocationController(PublicLocationRepository locations, PublicLocationPhotoRepository photos) {
        this.locations=locations; this.photos=photos;
    }
    public record Edit(String name,String nameFi,String description,String descriptionFi,PublicLocation.Kind kind,
                       LocalDate observedOn,Double latitude,Double longitude,boolean published,boolean confirmed) {}
    public record View(Long id,String name,String nameFi,String description,String descriptionFi,PublicLocation.Kind kind,
                       LocalDate observedOn,double latitude,double longitude,boolean published,boolean hasPhoto) {
        static View of(PublicLocation p) {
            return new View(p.getId(),p.getName(),p.getNameFi(),p.getDescription(),p.getDescriptionFi(),p.getKind(),
                p.getObservedOn(),p.getLatitude(),p.getLongitude(),p.isPublished(),p.isHasPhoto());
        }
    }
    @GetMapping("/api/locations") public ResponseEntity<List<View>> list() {
        return uncached(locations.findAllByPublishedTrueOrderByObservedOnDescIdDesc().stream().map(View::of).toList());
    }
    @GetMapping("/api/locations/{id}") public ResponseEntity<View> get(@PathVariable long id) {
        return uncached(View.of(published(id)));
    }
    @GetMapping("/api/locations/{id}/photo") public ResponseEntity<byte[]> getPhoto(@PathVariable long id) {
        published(id);
        return photo(id);
    }
    @GetMapping("/api/admin/locations") public ResponseEntity<List<View>> drafts() {
        return uncached(locations.findAllByOrderByObservedOnDescIdDesc().stream().map(View::of).toList());
    }
    @GetMapping("/api/admin/locations/{id}/photo") public ResponseEntity<byte[]> draftPhoto(@PathVariable long id) {
        existing(id);
        return photo(id);
    }
    @PostMapping(value="/api/admin/locations",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<View> create(@RequestPart("location") Edit x,@RequestPart(value="photo",required=false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(save(new PublicLocation(),x,file));
    }
    @PutMapping(value="/api/admin/locations/{id}",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public View update(@PathVariable long id,@RequestPart("location") Edit x,@RequestPart(value="photo",required=false) MultipartFile file) {
        return save(existing(id),x,file);
    }
    @PutMapping("/api/admin/locations/{id}/withdraw") public View withdraw(@PathVariable long id) {
        PublicLocation p=existing(id);
        p.setPublished(false);
        return View.of(p);
    }
    private View save(PublicLocation p,Edit x,MultipartFile file) {
        p.setName(text(x.name(),120,true));
        p.setNameFi(text(x.nameFi(),120,x.published()));
        p.setDescription(text(x.description(),1200,x.published()));
        p.setDescriptionFi(text(x.descriptionFi(),1200,x.published()));
        if(x.kind()==null||x.observedOn()==null||x.observedOn().isAfter(LocalDate.now(ZoneId.of("Europe/Helsinki")))||
            !coordinate(x.latitude(),90)||!coordinate(x.longitude(),180)) throw bad("INVALID_LOCATION");
        p.setKind(x.kind()); p.setObservedOn(x.observedOn());
        p.setLatitude(x.latitude()); p.setLongitude(x.longitude());
        byte[] encoded=file==null?null:encode(file);
        if(x.published()&&(!x.confirmed()||(!p.isHasPhoto()&&encoded==null))) throw bad("PHOTO_AND_CONFIRMATION_REQUIRED");
        p.setPublished(x.published());
        if(encoded!=null) p.setHasPhoto(true);
        p=locations.save(p);
        if(encoded!=null) photos.save(new PublicLocationPhoto(p.getId(),encoded));
        return View.of(p);
    }
    private static byte[] encode(MultipartFile file) {
        if(file.isEmpty()||file.getSize()>5*1024*1024) throw bad("INVALID_LOCATION_PHOTO");
        try(var stream=file.getInputStream();var imageStream=ImageIO.createImageInputStream(stream)) {
            if(imageStream==null) throw bad("INVALID_LOCATION_PHOTO");
            var readers=ImageIO.getImageReaders(imageStream);
            if(!readers.hasNext()) throw bad("INVALID_LOCATION_PHOTO");
            var reader=readers.next();
            try {
                String format=reader.getFormatName().toLowerCase(Locale.ROOT);
                if(!format.equals("jpeg")&&!format.equals("png")) throw bad("INVALID_LOCATION_PHOTO");
                reader.setInput(imageStream,true,true);
                int width=reader.getWidth(0),height=reader.getHeight(0);
                if((long)width*height>30_000_000L) throw bad("INVALID_LOCATION_PHOTO");
                var raw=reader.read(0);
                double ratio=Math.min(1,1600.0/Math.max(width,height));
                var clean=new BufferedImage(Math.max(1,(int)(width*ratio)),Math.max(1,(int)(height*ratio)),BufferedImage.TYPE_INT_RGB);
                var g=clean.createGraphics();
                g.setColor(Color.WHITE); g.fillRect(0,0,clean.getWidth(),clean.getHeight());
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                g.drawImage(raw,0,0,clean.getWidth(),clean.getHeight(),null); g.dispose();
                var result=new ByteArrayOutputStream();
                if(!ImageIO.write(clean,"jpeg",result)) throw bad("INVALID_LOCATION_PHOTO");
                return result.toByteArray();
            } finally { reader.dispose(); }
        } catch(IOException|IllegalArgumentException ex) { throw bad("INVALID_LOCATION_PHOTO"); }
    }
    private ResponseEntity<byte[]> photo(long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.IMAGE_JPEG)
            .header("X-Content-Type-Options","nosniff").body(photos.findById(id).orElseThrow(PublicLocationController::missing).bytes());
    }
    private PublicLocation published(long id) { return locations.findByIdAndPublishedTrue(id).orElseThrow(PublicLocationController::missing); }
    private PublicLocation existing(long id) { return locations.findById(id).orElseThrow(PublicLocationController::missing); }
    private static <T> ResponseEntity<T> uncached(T value) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(value); }
    private static ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND); }
    private static ResponseStatusException bad(String code) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,code); }
    private static boolean coordinate(Double value,int max) { return value!=null&&Double.isFinite(value)&&Math.abs(value)<=max; }
    private static String text(String value,int max,boolean required) {
        String s=value==null?"":value.trim();
        if(s.length()>max||(required&&s.isEmpty())) throw bad("INVALID_LOCATION");
        return s;
    }
}
