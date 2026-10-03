package com.hongik.books.moderation.toxic;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "moderation.toxic-filter")
public class ToxicFilterProperties {
    public enum BlockLevel { NONE, CERTAIN, AMBIGUOUS }

    private boolean enabled = false;
    private String baseUrl = "https://toxic-filter-534256318130.us-west1.run.app";
    private String apiKey;
    private BlockLevel blockLevel = BlockLevel.CERTAIN;
}

