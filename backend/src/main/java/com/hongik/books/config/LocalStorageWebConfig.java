package com.hongik.books.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@ConditionalOnProperty(name = "app.storage.mode", havingValue = "local", matchIfMissing = true)
public class LocalStorageWebConfig implements WebMvcConfigurer {

    @Value("${app.storage.local.base-dir:./uploads}")
    private String baseDir;

    @Value("${app.storage.local.public-url-base:/uploads}")
    private String publicUrlBase;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String base = normalizePublicBase(publicUrlBase);
        Path basePath = Paths.get(baseDir).toAbsolutePath().normalize();
        String location = "file:" + basePath + (basePath.toString().endsWith("/") ? "" : "/");
        registry.addResourceHandler(base + "/**").addResourceLocations(location);
    }

    private String normalizePublicBase(String base) {
        if (base == null || base.isBlank()) return "/uploads";
        String s = base.trim();
        if (!s.startsWith("/")) s = "/" + s;
        if (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }
}
