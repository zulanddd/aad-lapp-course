package com.example.drainadoption.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;

final class ReportPhotoEncoder {
    private static final int INPUT_LIMIT=5*1024*1024;
    private static final int OUTPUT_LIMIT=512*1024;
    private static final int LONG_SIDE=1280;

    private ReportPhotoEncoder() {}

    static byte[] encode(MultipartFile file) {
        if(file.getSize()>INPUT_LIMIT)throw error("PHOTO_TOO_LARGE");
        if(file.isEmpty())throw error("INVALID_PHOTO");
        try(var source=file.getInputStream();var input=ImageIO.createImageInputStream(source)) {
            if(input==null)throw error("INVALID_PHOTO");
            var readers=ImageIO.getImageReaders(input);
            if(!readers.hasNext())throw error("INVALID_PHOTO");
            var reader=readers.next();
            try {
                if(!Set.of("JPEG","JPG","PNG").contains(reader.getFormatName().toUpperCase(Locale.ROOT)))
                    throw error("INVALID_PHOTO");
                reader.setInput(input,true,true);
                int w=reader.getWidth(0),h=reader.getHeight(0);
                if(w<1||h<1||(long)w*h>20_000_000L)throw error("PHOTO_TOO_LARGE");
                var read=reader.getDefaultReadParam();
                int step=Math.max(1,Math.max(w,h)/LONG_SIDE);
                read.setSourceSubsampling(step,step,0,0);
                var sourceImage=reader.read(0,read);
                if(sourceImage==null)throw error("INVALID_PHOTO");
                for(int side=LONG_SIDE;side>=320;side/=2) {
                    var image=resize(sourceImage,side);
                    for(float quality:new float[]{.86f,.68f,.48f}) {
                        byte[] encoded=jpeg(image,quality);
                        if(encoded.length<=OUTPUT_LIMIT)return encoded;
                    }
                }
                throw error("PHOTO_TOO_LARGE");
            } finally { reader.dispose(); }
        } catch(IOException|IllegalArgumentException ex) {
            throw error("INVALID_PHOTO");
        }
    }

    private static BufferedImage resize(BufferedImage src,int longest) {
        double scale=Math.min(1.0,(double)longest/Math.max(src.getWidth(),src.getHeight()));
        int w=Math.max(1,(int)Math.round(src.getWidth()*scale)),h=Math.max(1,(int)Math.round(src.getHeight()*scale));
        var clean=new BufferedImage(w,h,BufferedImage.TYPE_INT_RGB);
        var g=clean.createGraphics();
        try {
            g.setColor(Color.WHITE);
            g.fillRect(0,0,w,h);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.drawImage(src,0,0,w,h,null);
        } finally { g.dispose(); }
        return clean;
    }

    private static byte[] jpeg(BufferedImage image,float quality) throws IOException {
        var writer=ImageIO.getImageWritersByFormatName("jpeg").next();
        var buffer=new ByteArrayOutputStream();
        try(var output=ImageIO.createImageOutputStream(buffer)) {
            writer.setOutput(output);
            var params=writer.getDefaultWriteParam();
            params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            params.setCompressionQuality(quality);
            writer.write(null,new IIOImage(image,null,null),params);
        } finally { writer.dispose(); }
        return buffer.toByteArray();
    }

    private static ResponseStatusException error(String code) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,code);
    }
}
