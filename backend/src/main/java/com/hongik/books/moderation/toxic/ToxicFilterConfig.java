package com.hongik.books.moderation.toxic;

import com.hongik.books.moderation.ModerationPolicyProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({ToxicFilterProperties.class, ModerationPolicyProperties.class})
public class ToxicFilterConfig { }
