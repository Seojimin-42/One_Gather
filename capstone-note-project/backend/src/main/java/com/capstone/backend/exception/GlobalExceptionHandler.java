package com.capstone.backend.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // 모든 REST Controller에서 발생하는 예외를 여기서 공통 처리
public class GlobalExceptionHandler {

    // DTO Validation 오류
    @ExceptionHandler(MethodArgumentNotValidException.class) // DTO의 Validation 검증 실패 시 메소드 실행
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException e) {

        Map<String, String> errors = new HashMap<>();

        // 오류를 하나씩 꺼내는 코드
        e.getBindingResult()
                .getFieldErrors()
                .forEach(error -> errors.put(
                        error.getField(),
                        error.getDefaultMessage()
                    )
                );

        return ResponseEntity
                .badRequest()
                .body(errors);
    }

    // 직접 발생시킨 IllegalArgumentException 처리
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIlleagalArgumentException(IllegalArgumentException e) {

        Map<String, String> error = new HashMap<>();

        error.put("message", e.getMessage());

        return ResponseEntity
                .badRequest()
                .body(error);
    }
}
