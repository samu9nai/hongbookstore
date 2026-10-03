package com.hongik.books.common.util;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.google.cloud.storage.Storage;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

/**
 * GCP Cloud Storage 관련 유틸리티 클래스
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "gcp")
public class GcpStorageUtil implements ImageStorage {
    private final Storage storage; // GCP Storage에 대한 의존성 주입

    // application.yml의 spring.cloud.gcp.storage.bucket-name 값을 주입
    @Value("${spring.cloud.gcp.storage.bucket-name}")
    private String bucketName;

    /**
     * MultipartFile을 GCP Cloud Storage에 업로드하고, 공개 URL을 반환
     *
     * @param file 업로드할 이미지 파일
     * @param directory 업로드할 디렉토리
     * @return 업로드된 파일의 공개 URL
     * @throws IOException 파일 처리 중 예외 발생 시
     */
    @Override
    public String uploadImage(MultipartFile file, String directory) throws IOException {
        // 1. 파일의 확장자를 포함한 고유한 파일 이름 생성 (UUID 사용)
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID() + extension;
        String objectName = directory + "/" + uniqueFileName;

        // 2. BlobInfo 객체 생성 (파일 메타데이터)
        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, objectName)
                .setContentType(file.getContentType())
                .build();

        // 3. GCP Storage에 파일 업로드
        storage.createFrom(blobInfo, file.getInputStream());

        // 4. 업로드된 파일의 공개 URL 반환
        return "https://storage.googleapis.com/" + bucketName + "/" + objectName;
    }

    /**
     * GCP Cloud Storage에서 이미지를 삭제
     * @param imageUrl 삭제할 이미지의 전체 URL
     */
    @Override
    public void deleteImage(String imageUrl) {
        // 전체 URL에서 객체 이름(파일 경로)만 추출
        // 예: "https://storage.googleapis.com/버킷이름/book-covers/파일이름.jpg" -> "book-covers/파일이름.jpg"
        String objectName = imageUrl.replace("https://storage.googleapis.com/" + bucketName + "/", "");

        // BlobId를 사용하여 GCP에서 해당 객체를 삭제
        storage.delete(BlobId.of(bucketName, objectName));
    }

    /**
     * 외부 URL에서 이미지를 다운로드해 GCP Cloud Storage에 업로드하고 공개 URL을 반환
     * @param imageUrl 외부 이미지 URL (ex. OAuth provider photo URL)
     * @param directory 업로드 디렉터리 (ex. "profile-images")
     * @return 업로드된 GCS 공개 URL
     */
    @Override
    public String uploadImageFromUrl(String imageUrl, String directory) throws IOException {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IOException("Empty image URL");
        }

        URL url = new URL(imageUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(10000);
        conn.setInstanceFollowRedirects(true);
        conn.setRequestProperty("User-Agent", "HongBookStore/1.0");
        int code = conn.getResponseCode();
        if (code >= 300) {
            throw new IOException("Failed to fetch image: HTTP " + code);
        }

        String contentType = conn.getContentType();
        String ext = guessExtension(imageUrl, contentType);
        String uniqueFileName = UUID.randomUUID() + ext;
        String objectName = directory + "/" + uniqueFileName;

        try (InputStream in = conn.getInputStream()) {
            BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, objectName)
                    .setContentType(contentType != null ? contentType : "application/octet-stream")
                    .build();
            storage.createFrom(blobInfo, in);
        }

        return "https://storage.googleapis.com/" + bucketName + "/" + objectName;
    }

    private String guessExtension(String url, String contentType) {
        if (contentType != null) {
            // 간단 매핑
            if (contentType.contains("png")) return ".png";
            if (contentType.contains("jpeg") || contentType.contains("jpg")) return ".jpg";
            if (contentType.contains("gif")) return ".gif";
            if (contentType.contains("webp")) return ".webp";
        }
        int q = url.indexOf('?');
        String path = q > 0 ? url.substring(0, q) : url;
        int dot = path.lastIndexOf('.');
        if (dot > 0 && dot < path.length() - 1) {
            String ext = path.substring(dot).toLowerCase();
            if (ext.length() <= 5) return ext; // .png/.jpg 등
        }
        return "";
    }
}
