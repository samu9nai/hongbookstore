package com.hongik.books.common.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ImageStorage {
    String uploadImage(MultipartFile file, String directory) throws IOException;

    void deleteImage(String imageUrl);

    String uploadImageFromUrl(String imageUrl, String directory) throws IOException;
}
