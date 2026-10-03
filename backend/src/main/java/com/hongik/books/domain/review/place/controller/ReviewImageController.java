package com.hongik.books.domain.review.place.controller;

import com.hongik.books.common.util.ImageStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/reviews/images") // <-- 리뷰 전용 prefix
@RequiredArgsConstructor
public class ReviewImageController {

    private final ImageStorage imageStorage;

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadReviewPhotos(
            @RequestParam("files") List<MultipartFile> files
    ) {
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "파일이 없습니다."));
        }

        // ✅ 업로드 1회당 최대 3개 제한 (프론트 우회/직접 호출 방지)
        if (files.size() > 3) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "사진/GIF는 한 번에 최대 3개까지만 업로드할 수 있습니다."));
        }

        try {
            List<String> urls = new ArrayList<>();
            for (MultipartFile f : files) {
                if (f.isEmpty()) continue;
                // 기존 게시글 업로드와 동일하게 유틸 재사용. 폴더만 리뷰 전용으로.
                String url = imageStorage.uploadImage(f, "review-photos");
                urls.add(url);
            }
            return ResponseEntity.ok(Map.of("urls", urls));
        } catch (Exception e) {
            // 컨트롤러에서 IOException 등을 던지지 말고 500으로 변환
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 업로드 실패", e);
        }
    }
}
