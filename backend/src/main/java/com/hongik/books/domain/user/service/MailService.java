package com.hongik.books.domain.user.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${email.from:${spring.mail.username:}}")
    private String from;

    @Value("${email.brand.name:HongBookStore}")
    private String brandName;

    @Value("${email.brand.primary-color:#2563eb}")
    private String brandPrimaryColor;

    @Value("${email.verification.expiration-hours:24}")
    private int verificationExpirationHours;

    /**
     * 지정된 이메일 주소로 메일을 발송하는 범용 메서드 (JavaMailSender + Gmail SMTP)
     * @param to 받는 사람 이메일 주소
     * @param subject 이메일 제목
     * @param text 이메일 본문(plain text)
     * @param html html 템플릿
     */
    public void sendEmailHtml(String to, String subject, String text, String html) {
        if (from == null || from.isBlank()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            // text는 일반 텍스트 본문, html은 HTML 본문으로 설정
            helper.setText(text, html);
            mailSender.send(message);
        } catch (MessagingException e) {
        } catch (Exception e) {
        }
    }

    public void sendStudentVerificationEmail(String to, String username, String verificationUrl, Locale locale) {
        String lang = normalizeLang(locale);
        String subject;
        String text;
        switch (lang) {
            case "en" -> {
                subject = "[HongBookStore] Please complete your student verification.";
                text = "Click the link to complete verification: " + verificationUrl;
            }
            case "ja" -> {
                subject = "[HongBookStore] 在校生認証を完了してください。";
                text = "以下のリンクをクリックして認証を完了してください: " + verificationUrl;
            }
            case "zh" -> {
                subject = "[HongBookStore] 请完成在校生验证。";
                text = "点击以下链接完成验证：" + verificationUrl;
            }
            default -> {
                subject = "[홍북서점] 재학생 인증을 완료해주세요.";
                text = "홍북서점 재학생 인증을 완료하려면 아래 링크를 클릭하세요: " + verificationUrl;
            }
        }

        String templatePath = switch (lang) {
            case "en" -> "templates/email/verification_en.html";
            case "ja" -> "templates/email/verification_ja.html";
            case "zh" -> "templates/email/verification_zh.html";
            default -> "templates/email/verification_ko.html";
        };

        String html = renderTemplate(templatePath)
                .replace("{{USERNAME}}", escapeHtml(username))
                .replace("{{VERIFICATION_URL}}", verificationUrl)
                .replace("{{YEAR}}", String.valueOf(Year.now().getValue()))
                .replace("{{BRAND_NAME}}", escapeHtml(brandName))
                .replace("{{BRAND_COLOR}}", escapeHtml(brandPrimaryColor))
                .replace("{{EXPIRY_HOURS}}", String.valueOf(verificationExpirationHours));

        if (html.isBlank()) html = "<p>" + text + "</p>";

        sendEmailHtml(to, subject, text, html);
    }

    private String normalizeLang(Locale locale) {
        if (locale == null) return "ko";
        String l = locale.getLanguage();
        if (l == null || l.isBlank()) return "ko";
        if (l.startsWith("en")) return "en";
        if (l.startsWith("ja")) return "ja";
        if (l.startsWith("zh")) return "zh";
        return "ko";
    }

    private String renderTemplate(String classpathLocation) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            byte[] bytes = resource.getContentAsByteArray();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}

