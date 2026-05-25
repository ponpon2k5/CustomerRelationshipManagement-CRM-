package com.scrum.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scrum.crm.dto.auth.LoginRequest;
import com.scrum.crm.dto.auth.LoginResponse;
import com.scrum.crm.dto.auth.SocialLoginRequest;
import com.scrum.crm.entity.User;
import com.scrum.crm.exception.UnauthorizedException;
import com.scrum.crm.repository.UserRepository;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${crm.oauth.google.client-id:171585218856-fitg5j87i13pocbqetiod5hbjt15nee4.apps.googleusercontent.com}")
    private String googleClientId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("User account is inactive.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        return new LoginResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public LoginResponse socialLogin(SocialLoginRequest request) {
        SocialProfile profile = switch (request.provider().trim().toLowerCase()) {
            case "google" -> verifyGoogleAccessToken(request.credential());
            case "facebook" -> verifyFacebookAccessToken(request.credential());
            default -> throw new IllegalArgumentException("Unsupported social login provider.");
        };

        if (profile.email() == null || profile.email().isBlank()) {
            throw new UnauthorizedException("Social account does not provide an email address.");
        }

        User user = userRepository.findByEmailIgnoreCase(profile.email().trim())
                .orElseThrow(() -> new UnauthorizedException("No active CRM user matches this social account email."));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("User account is inactive.");
        }

        return toLoginResponse(user);
    }

    private SocialProfile verifyGoogleAccessToken(String accessToken) {
        JsonNode payload = getJson("https://www.googleapis.com/oauth2/v3/tokeninfo?access_token="
                + encode(accessToken), "Invalid Google login token.");

        String audience = text(payload, "aud");
        if (!googleClientId.equals(audience)) {
            throw new UnauthorizedException("Invalid Google login token.");
        }

        String emailVerified = text(payload, "email_verified");
        if (!"true".equalsIgnoreCase(emailVerified)) {
            throw new UnauthorizedException("Google account email is not verified.");
        }

        return new SocialProfile(text(payload, "email"), text(payload, "name"));
    }

    private SocialProfile verifyFacebookAccessToken(String accessToken) {
        JsonNode payload = getJson("https://graph.facebook.com/me?fields=id,name,email&access_token="
                + encode(accessToken), "Invalid Facebook login token.");

        return new SocialProfile(text(payload, "email"), text(payload, "name"));
    }

    private JsonNode getJson(String url, String errorMessage) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new UnauthorizedException(errorMessage);
            }
            return objectMapper.readTree(response.body());
        } catch (IOException ex) {
            throw new UnauthorizedException(errorMessage);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new UnauthorizedException(errorMessage);
        }
    }

    private LoginResponse toLoginResponse(User user) {
        return new LoginResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole()
        );
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String text(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        return value == null || value.isNull() ? null : value.asText();
    }

    private record SocialProfile(String email, String name) {
    }
}
