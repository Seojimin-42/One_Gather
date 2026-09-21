package com.capstone.backend.controller;

import com.capstone.backend.entity.NoteImage;
import com.capstone.backend.service.NoteImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notes")
public class NoteImageController {

    private final NoteImageService noteImageService;

    @GetMapping("/{noteId}/images")
    public List<NoteImage> getImagesByNoteId(@PathVariable Long noteId) {
        return noteImageService.getImageByNoteId(noteId);
    }

    @PostMapping("/{noteId}/images")
    public String uploadImage(@PathVariable Long noteId,
                              @RequestParam("file") MultipartFile file) {
        return "noteId=" + noteId + ", fileName" + file.getOriginalFilename();
    }
}
