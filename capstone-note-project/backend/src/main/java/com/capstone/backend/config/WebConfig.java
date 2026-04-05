package com.capstone.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 전제 API 허용
                .allowedOrigins("http://localhost:5173") // localhost:5173에서 오는 요청 허용
                .allowedMethods("*"); // 모든 HTTP 요청 방식 허용
    }
}