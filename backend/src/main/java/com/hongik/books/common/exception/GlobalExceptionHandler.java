package com.hongik.books.common.exception;

import com.hongik.books.common.dto.ApiResponse;
import com.hongik.books.common.dto.ModerationErrorDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.dao.DataIntegrityViolationException;

import java.io.IOException;
import java.util.stream.Collectors;
import jakarta.validation.ConstraintViolationException;
import org.springframework.validation.BindException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<ApiResponse<Void>> build(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiResponse<>(false, message, null));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return build(HttpStatus.BAD_REQUEST, "파일 용량 초과: 한 파일은 10MB 이하, 전체는 30MB 이하로 업로드해 주세요.");
    }

    @ExceptionHandler({MultipartException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ApiResponse<Void>> handleMultipart(MultipartException ex) {
        return build(HttpStatus.BAD_REQUEST, "잘못된 업로드 형식입니다. multipart/form-data로 'request' JSON과 'images' 파일을 함께 보내주세요.");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMediaType(HttpMediaTypeNotSupportedException ex) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 콘텐츠 유형입니다. Content-Type: multipart/form-data로 전송해 주세요.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다. 'request' JSON 형식을 확인해 주세요.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        // 주로 unique 제약조건 위반 등
        return build(HttpStatus.BAD_REQUEST, "이미 사용 중인 값입니다. 입력한 값을 다시 확인해 주세요.");
    }

    @ExceptionHandler(ModerationException.class)
    public ResponseEntity<ApiResponse<ModerationErrorDTO>> handleModeration(ModerationException ex) {
        var data = new ModerationErrorDTO(
                ex.getField(),
                ex.getPredictionLevel(),
                ex.getMalicious(),
                ex.getClean(),
                ex.getReason(),
                ex.getOffendingText(),
                ex.getFlaggedSegments()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, ex.getMessage(), data));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ApiResponse<Void>> handleValidation(Exception ex) {
        var binding = ex instanceof MethodArgumentNotValidException manv ? manv.getBindingResult() : ((BindException) ex).getBindingResult();
        String msg = binding.getFieldErrors().stream()
                .map(e -> e.getField() + ": " + (e.getDefaultMessage() == null ? "invalid" : e.getDefaultMessage()))
                .collect(Collectors.joining(", "));
        if (msg.isBlank()) msg = "유효하지 않은 요청입니다.";
        return build(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        String msg = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining(", "));
        if (msg.isBlank()) msg = "유효하지 않은 요청입니다.";
        return build(HttpStatus.BAD_REQUEST, msg);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException ex) {
        return build(HttpStatus.BAD_REQUEST, "필수 파라미터가 누락되었습니다: " + ex.getParameterName());
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurity(SecurityException ex) {
        return build(HttpStatus.FORBIDDEN, "권한이 없습니다.");
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<ApiResponse<Void>> handleIO(IOException ex) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
