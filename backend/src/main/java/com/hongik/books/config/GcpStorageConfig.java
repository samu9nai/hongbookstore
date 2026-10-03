package com.hongik.books.config;



import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Configuration
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "gcp")
public class GcpStorageConfig {
    @Value("${spring.cloud.gcp.project-id}")
    private String projectId;

    @Value("${spring.cloud.gcp.credentials.location:}")
    private String keyFilePath;

    @Bean
    public Storage storage() throws IOException {
        GoogleCredentials credentials;
        // 우선순위 1: ADC (GCE/Cloud Run에서 자동 제공)
        if (keyFilePath == null || keyFilePath.isBlank()) {
            credentials = GoogleCredentials.getApplicationDefault();
        } else if (keyFilePath.startsWith("classpath:")) {
            // 우선순위 2: classpath 명시 시 해당 키 사용
            ClassPathResource resource = new ClassPathResource(keyFilePath.replace("classpath:", ""));
            credentials = GoogleCredentials.fromStream(resource.getInputStream());
        } else {
            // 우선순위 3: 파일 경로 지정
            ClassPathResource resource = new ClassPathResource(keyFilePath);
            if (resource.exists()) {
                credentials = GoogleCredentials.fromStream(resource.getInputStream());
            } else {
                // 마지막 폴백: ADC
                credentials = GoogleCredentials.getApplicationDefault();
            }
        }

        return StorageOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build()
                .getService();
    }
}
