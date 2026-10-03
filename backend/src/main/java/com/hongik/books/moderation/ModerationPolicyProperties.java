package com.hongik.books.moderation;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "moderation.policy")
public class ModerationPolicyProperties {

    public enum Mode { BLOCK, WARN, OFF }

    @Getter @Setter
    public static class SalePostPolicy {
        private Mode title = Mode.BLOCK;
        private Mode content = Mode.WARN;
    }

    @Getter @Setter
    public static class WantedPolicy {
        private Mode title = Mode.BLOCK;
        private Mode content = Mode.BLOCK; // 기본은 현행 유지
    }

    @Getter @Setter
    public static class CommentPolicy {
        private Mode content = Mode.BLOCK; // 기본은 차단
    }

    @Getter @Setter
    public static class PlaceReviewPolicy {
        private Mode content = Mode.BLOCK;
    }

    @Getter @Setter
    public static class PeerReviewPolicy {
        private Mode ratingKeywords = Mode.BLOCK;
    }

    @Getter @Setter
    public static class ChatPolicy {
        private Mode message = Mode.BLOCK;
    }

    private SalePostPolicy salePost = new SalePostPolicy();
    private WantedPolicy wanted = new WantedPolicy();
    private CommentPolicy comment = new CommentPolicy();
    private PlaceReviewPolicy placeReview = new PlaceReviewPolicy();
    private PeerReviewPolicy peerReview = new PeerReviewPolicy();
    private ChatPolicy chat = new ChatPolicy();
}

