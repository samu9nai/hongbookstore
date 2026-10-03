package com.hongik.books.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "local", matchIfMissing = true)
public class LocalStorageUtil implements ImageStorage {

    @Value("${app.storage.local.base-dir:./uploads}")
    private String baseDir;

    @Value("${app.storage.local.public-url-base:/uploads}")
    private String publicUrlBase;

    @Value("${app.storage.local.public-origin:}")
    private String publicOrigin;

    @Override
    public String uploadImage(MultipartFile file, String directory) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("Empty file");
        }
        String ext = guessExtension(file.getOriginalFilename(), file.getContentType());
        String filename = UUID.randomUUID() + ext;
        Path target = resolvePath(directory, filename);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return buildPublicUrl(directory, filename);
    }

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
        String filename = UUID.randomUUID() + ext;
        Path target = resolvePath(directory, filename);

        try (InputStream in = conn.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }

        return buildPublicUrl(directory, filename);
    }

    @Override
    public void deleteImage(String imageUrl) {
        try {
            if (imageUrl == null || imageUrl.isBlank()) return;
            String path = imageUrl;
            if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
                try {
                    path = new URL(imageUrl).getPath();
                } catch (Exception ignored) {
                    return;
                }
            }

            String base = normalizePublicBase(publicUrlBase);
            if (base != null && !base.isBlank() && path.startsWith(base)) {
                path = path.substring(base.length());
            }
            path = path.replaceAll("^/+", "");
            if (path.isBlank()) return;

            Path basePath = getBasePath();
            Path target = basePath.resolve(path).normalize();
            if (!target.startsWith(basePath)) return;
            Files.deleteIfExists(target);
        } catch (Exception e) {
            log.debug("Local image delete failed: {}", e.getMessage());
        }
    }

    private Path resolvePath(String directory, String filename) throws IOException {
        String dir = sanitizeDirectory(directory);
        Path basePath = getBasePath();
        Path dirPath = basePath.resolve(dir).normalize();
        if (!dirPath.startsWith(basePath)) {
            throw new IOException("Invalid storage directory");
        }
        Files.createDirectories(dirPath);
        Path target = dirPath.resolve(filename).normalize();
        if (!target.startsWith(dirPath)) {
            throw new IOException("Invalid storage path");
        }
        return target;
    }

    private Path getBasePath() throws IOException {
        Path p = Paths.get(baseDir).toAbsolutePath().normalize();
        Files.createDirectories(p);
        return p;
    }

    private String buildPublicUrl(String directory, String filename) {
        String base = normalizePublicBase(publicUrlBase);
        String dir = sanitizeDirectory(directory);
        if (base == null || base.isBlank()) base = "/uploads";
        String path = base + "/" + dir + "/" + filename;
        String origin = normalizePublicOrigin(publicOrigin);
        return origin.isBlank() ? path : origin + path;
    }

    private String normalizePublicBase(String base) {
        if (base == null || base.isBlank()) return "/uploads";
        String s = base.trim();
        if (!s.startsWith("/")) s = "/" + s;
        if (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }

    private String normalizePublicOrigin(String origin) {
        if (origin == null) return "";
        String s = origin.trim();
        if (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }

    private String sanitizeDirectory(String directory) {
        if (directory == null || directory.isBlank()) return "misc";
        String s = directory.replace("\\", "/");
        s = s.replaceAll("[^a-zA-Z0-9/_-]", "");
        s = s.replaceAll("/+", "/");
        s = s.replaceAll("^/+", "");
        s = s.replaceAll("/+$", "");
        if (s.isBlank()) return "misc";
        if (s.contains("..")) s = s.replace("..", "");
        return s.isBlank() ? "misc" : s;
    }

    private String guessExtension(String name, String contentType) {
        if (contentType != null) {
            if (contentType.contains("png")) return ".png";
            if (contentType.contains("jpeg") || contentType.contains("jpg")) return ".jpg";
            if (contentType.contains("gif")) return ".gif";
            if (contentType.contains("webp")) return ".webp";
        }
        if (name != null) {
            int q = name.indexOf('?');
            String path = q > 0 ? name.substring(0, q) : name;
            int dot = path.lastIndexOf('.');
            if (dot > 0 && dot < path.length() - 1) {
                String ext = path.substring(dot).toLowerCase();
                if (ext.length() <= 5) return ext;
            }
        }
        return "";
    }
}
