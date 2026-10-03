package com.hongik.books.domain.post.service;

import com.hongik.books.common.util.ImageStorage;
import com.hongik.books.domain.book.domain.Book;
import com.hongik.books.domain.book.repository.BookRepository;
import com.hongik.books.domain.post.domain.PostImage;
import com.hongik.books.domain.chat.repository.ChatRoomRepository;
import com.hongik.books.domain.post.domain.SalePost;
import com.hongik.books.domain.post.dto.*;
import com.hongik.books.domain.post.repository.PostSpecification;
import com.hongik.books.domain.post.repository.SalePostRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import com.hongik.books.domain.book.domain.Category;
import com.hongik.books.domain.book.domain.BookCategory;
import com.hongik.books.domain.book.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import com.hongik.books.moderation.ModerationPolicyProperties;
import com.hongik.books.moderation.ModerationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

// ✅ detail(학과/전공) 값을 항상 한국어로 맞추기
import com.hongik.books.domain.post.support.DepartmentNormalizer;

/**
 * 판매 게시글 관련 비즈니스 로직을 처리하는 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SalePostService {
    private final SalePostRepository salePostRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ImageStorage imageStorage;
    private final ChatRoomRepository chatRoomRepository;
    private final com.hongik.books.moderation.toxic.ToxicFilterClient toxicFilterClient;
    private final ModerationService moderationService;
    private final ModerationPolicyProperties moderationPolicy;
    private final CategoryRepository categoryRepository;

    /**
     * [ISBN 조회된 책]으로 판매 게시글을 생성 (이미지 업로드 포함)
     */
    public Long createSalePostFromSearch(
            SalePostCreateRequestDTO request,
            List<MultipartFile> imageFiles,
            Long sellerId) throws IOException {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 정책 기반 유해 표현 검사
        var titleMode = moderationPolicy.getSalePost().getTitle();
        var contentMode = moderationPolicy.getSalePost().getContent();
        moderationService.checkOrThrow(request.getPostTitle(), titleMode, "postTitle");
        var contentModeration = moderationService.checkOrThrow(request.getPostContent(), contentMode, "postContent");

        // Book (ISBN 기반 존재하면 사용, 없으면 신규 생성)
        Book book = bookRepository.findByIsbn(request.getIsbn())
                .orElseGet(() -> bookRepository.save(
                        Book.builder()
                                .isbn(request.getIsbn())
                                .title(request.getBookTitle())
                                .author(request.getAuthor())
                                .publisher(request.getPublisher())
                                .isCustom(false)
                                .originalPrice(request.getOriginalPrice())
                                .build()
                ));

        // ✅ 카테고리 정규화(특히 detail -> KO)
        CategoryTriple cats = extractCategories(request);
        // Book-Category 연결(선택)
        attachCategoriesIfPresent(book, cats.main, cats.sub, cats.detail);

        // SalePost 생성 (카테고리 필드까지 저장)
        SalePost newSalePost = createNewSalePost(request, seller, book, cats);

        // Moderation 결과 반영
        if (contentModeration != null) {
            newSalePost.applyContentModeration(
                    contentModeration.predictionLevel(),
                    contentModeration.malicious(),
                    contentModeration.clean(),
                    contentModeration.blocked(),
                    contentModeration.reason()
            );
        }

        salePostRepository.save(newSalePost);
        uploadAndAttachImages(imageFiles, newSalePost);
        return newSalePost.getId();
    }

    /**
     * ISBN 없는 경우 (프린트물 교재 등)
     * [직접 등록]으로 판매 게시글을 생성 (이미지 업로드 포함)
     */
    public Long createSalePostCustom(
            SalePostCustomCreateRequestDTO request,
            List<MultipartFile> imageFiles,
            Long sellerId) throws IOException {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 정책 기반 유해 표현 검사
        var titleMode = moderationPolicy.getSalePost().getTitle();
        var contentMode = moderationPolicy.getSalePost().getContent();
        moderationService.checkOrThrow(request.getPostTitle(), titleMode, "postTitle");
        var contentModeration = moderationService.checkOrThrow(request.getPostContent(), contentMode, "postContent");

        // Book 신규 생성
        Book newBook = bookRepository.save(
                Book.builder()
                        .title(request.getBookTitle())
                        .author(request.getAuthor())
                        .publisher(request.getPublisher())
                        .isCustom(true)
                        .originalPrice(request.getOriginalPrice())
                        .build()
        );

        // ✅ 카테고리 정규화
        CategoryTriple cats = extractCategories(request);
        attachCategoriesIfPresent(newBook, cats.main, cats.sub, cats.detail);

        // SalePost 생성 (카테고리 포함)
        SalePost newSalePost = createNewSalePost(request, seller, newBook, cats);

        if (contentModeration != null) {
            newSalePost.applyContentModeration(
                    contentModeration.predictionLevel(),
                    contentModeration.malicious(),
                    contentModeration.clean(),
                    contentModeration.blocked(),
                    contentModeration.reason()
            );
        }
        salePostRepository.save(newSalePost);
        uploadAndAttachImages(imageFiles, newSalePost);
        return newSalePost.getId();
    }

    /**
     * 판매 게시글 목록 조회
     */
    public Page<SalePostSummaryResponseDTO> getSalePosts(PostSearchCondition condition, Pageable pageable) {
        // ✅ 다국어 카테고리 필터 KO로 정규화
        String categoryKo = DepartmentNormalizer.toKoreanOrNull(condition.getCategory());

        Specification<SalePost> spec = Specification.allOf(
                PostSpecification.hasQuery(condition.getQuery()),
                PostSpecification.inCategory(categoryKo),
                PostSpecification.priceBetween(condition.getMinPrice(), condition.getMaxPrice())
        );

        Page<SalePost> salePosts = salePostRepository.findAll(spec, pageable);
        return salePosts.map(SalePostSummaryResponseDTO::fromEntity);
    }

    /**
     * 특정 판매 게시글 상세 + 조회수 증가
     */
    public SalePostDetailResponseDTO getSalePostById(Long postId) {
        SalePost salePost = findSalePostById(postId);
        salePost.increaseViewCount();
        return SalePostDetailResponseDTO.fromEntity(salePost);
    }

    /**
     * 내 판매글 목록
     */
    @Transactional(readOnly = true)
    public List<MyPostSummaryResponseDTO> getMySalePosts(Long userId) {
        return salePostRepository.findAllBySellerIdOrderByCreatedAtDesc(userId).stream()
                .map(MyPostSummaryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 판매 게시글 수정
     */
    public void updateSalePost(Long postId, SalePostUpdateRequestDTO request, Long userId) {
        SalePost salePost = findSalePostById(postId);
        validatePostOwner(salePost, userId);

        var titleMode = moderationPolicy.getSalePost().getTitle();
        var contentMode = moderationPolicy.getSalePost().getContent();
        moderationService.checkOrThrow(request.getPostTitle(), titleMode, "postTitle");
        var contentModeration2 = moderationService.checkOrThrow(request.getPostContent(), contentMode, "postContent");
        salePost.update(request);
        if (contentModeration2 != null) {
            salePost.applyContentModeration(
                    contentModeration2.predictionLevel(),
                    contentModeration2.malicious(),
                    contentModeration2.clean(),
                    contentModeration2.blocked(),
                    contentModeration2.reason()
            );
        }
    }

    /**
     * 판매 게시글 이미지 추가
     */
    public void addImagesToPost(Long postId, List<MultipartFile> imageFiles, Long userId) throws IOException {
        SalePost salePost = findSalePostById(postId);
        validatePostOwner(salePost, userId);

        if (imageFiles == null || imageFiles.isEmpty()) return;

        int existing = salePost.getPostImages() != null ? salePost.getPostImages().size() : 0;
        int incoming = imageFiles.size();
        if (existing + incoming > 3) {
            throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");
        }

        uploadAndAttachImages(imageFiles, salePost);
    }

    /**
     * 상태 변경
     */
    public void updateSalePostStatus(Long postId, SalePostStatusUpdateRequestDTO request, Long userId) {
        SalePost salePost = findSalePostById(postId);
        validatePostOwner(salePost, userId);
        salePost.changeStatus(request.getStatus());
        if (request.getStatus() == SalePost.SaleStatus.SOLD_OUT) {
            if (request.getBuyerId() == null) {
                throw new IllegalArgumentException("SOLD_OUT 상태로 변경하려면 buyerId가 필요합니다.");
            }
            User buyer = findUserById(request.getBuyerId());
            if (buyer.getId().equals(salePost.getSeller().getId())) {
                throw new IllegalArgumentException("판매자 자신을 구매자로 설정할 수 없습니다.");
            }
            var roomOpt = chatRoomRepository.findBySalePostIdAndBuyerIdAndSellerId(
                    salePost.getId(), buyer.getId(), salePost.getSeller().getId()
            );
            if (roomOpt.isEmpty()) {
                throw new IllegalArgumentException("해당 구매자는 이 게시글의 채팅 상대가 아닙니다.");
            }
            salePost.setBuyer(buyer);
        }
    }

    /**
     * 삭제
     */
    public void deleteSalePost(Long postId, Long userId) {
        SalePost salePost = findSalePostById(postId);
        validatePostOwner(salePost, userId);
        salePost.getPostImages().forEach(image -> imageStorage.deleteImage(image.getImageUrl()));
        salePostRepository.delete(salePost);
    }

    // --- Private Helper Methods ---
    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    private SalePost findSalePostById(Long postId) {
        return salePostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글 ID입니다."));
    }

    private void validatePostOwner(SalePost salePost, Long userId) {
        if (!salePost.getSeller().getId().equals(userId)) {
            throw new SecurityException("게시글에 대한 권한이 없습니다.");
        }
    }

    // ✅ 카테고리까지 포함해서 엔티티 생성
    private SalePost createNewSalePost(Object requestDto, User seller, Book book, CategoryTriple cats) {
        if (requestDto instanceof SalePostCreateRequestDTO req) {
            return SalePost.builder()
                    .seller(seller)
                    .book(book)
                    .postTitle(req.getPostTitle())
                    .postContent(req.getPostContent())
                    .price(req.getPrice())
                    .status(SalePost.SaleStatus.FOR_SALE)
                    .writingCondition(req.getWritingCondition())
                    .tearCondition(req.getTearCondition())
                    .waterCondition(req.getWaterCondition())
                    .negotiable(req.isNegotiable())
                    .oncampusPlaceCode(req.getOncampusPlaceCode())
                    .offcampusStationCode(req.getOffcampusStationCode())
                    .mainCategory(cats.main)
                    .subCategory(cats.sub)
                    .detailCategory(cats.detail)
                    .build();
        } else if (requestDto instanceof SalePostCustomCreateRequestDTO req) {
            return SalePost.builder()
                    .seller(seller)
                    .book(book)
                    .postTitle(req.getPostTitle())
                    .postContent(req.getPostContent())
                    .price(req.getPrice())
                    .status(SalePost.SaleStatus.FOR_SALE)
                    .writingCondition(req.getWritingCondition())
                    .tearCondition(req.getTearCondition())
                    .waterCondition(req.getWaterCondition())
                    .negotiable(req.isNegotiable())
                    .oncampusPlaceCode(req.getOncampusPlaceCode())
                    .offcampusStationCode(req.getOffcampusStationCode())
                    .mainCategory(cats.main)
                    .subCategory(cats.sub)
                    .detailCategory(cats.detail)
                    .build();
        }
        throw new IllegalArgumentException("지원하지 않는 요청 타입입니다.");
    }

    private void uploadAndAttachImages(List<MultipartFile> imageFiles, SalePost salePost) throws IOException {
        if (imageFiles != null && !imageFiles.isEmpty()) {
            if (imageFiles.size() > 3) {
                throw new IllegalArgumentException("이미지는 최대 3장까지 업로드할 수 있습니다.");
            }
            for (MultipartFile imageFile : imageFiles) {
                String imageUrl = imageStorage.uploadImage(imageFile, "post-images");
                PostImage postImage = PostImage.builder()
                        .salePost(salePost)
                        .imageUrl(imageUrl)
                        .build();
                salePost.addPostImage(postImage);
            }
        }
    }

    // --- Category helpers ---
    private void attachCategoriesIfPresent(Book book, String main, String sub, String detail) {
        if (detail == null || detail.isBlank()) return; // leaf 없으면 스킵
        Category leaf = ensureCategoryPath(main, sub, detail);
        boolean exists = book.getBookCategories().stream()
                .anyMatch(bc -> bc.getCategory() != null && leaf.getId() != null && leaf.getId().equals(bc.getCategory().getId()));
        if (!exists) {
            book.getBookCategories().add(BookCategory.builder().book(book).category(leaf).build());
            bookRepository.save(book);
        }
    }

    private Category ensureCategoryPath(String main, String sub, String detail) {
        Category root = findOrCreateCategory(normalize(main, "교양"), null);
        Category mid = (sub != null && !sub.isBlank()) ? findOrCreateCategory(sub.trim(), root) : root;
        return findOrCreateCategory(detail.trim(), mid);
    }

    private Category findOrCreateCategory(String name, Category parent) {
        return parent == null
                ? categoryRepository.findByNameAndParentIsNull(name)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).parent(null).build()))
                : categoryRepository.findByNameAndParent(name, parent)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).parent(parent).build()));
    }

    private String normalize(String v, String def) {
        return (v == null || v.isBlank()) ? def : v.trim();
    }

    // ✅ DTO에서 카테고리 꺼내고 detail은 한국어로 정규화
    private CategoryTriple extractCategories(Object dto) {
        String main = null, sub = null, detail = null;
        if (dto instanceof SalePostCreateRequestDTO r) {
            main = safe(r.getMainCategory());
            sub = safe(r.getSubCategory());
            detail = safe(r.getDetailCategory());
        } else if (dto instanceof SalePostCustomCreateRequestDTO r) {
            main = safe(r.getMainCategory());
            sub = safe(r.getSubCategory());
            detail = safe(r.getDetailCategory());
        }
        // detail만 한글 정규화
        detail = DepartmentNormalizer.toKoreanOrNull(detail);
        return new CategoryTriple(safe(main), safe(sub), safe(detail));
    }

    private String safe(String v) { return (v == null || v.trim().isEmpty()) ? null : v.trim(); }

    private static class CategoryTriple {
        final String main; final String sub; final String detail;
        CategoryTriple(String m, String s, String d){ this.main=m; this.sub=s; this.detail=d; }
    }

    @Transactional(readOnly = true)
    public List<SalePostSummaryResponseDTO> getSellerPosts(Long sellerId, int limit) {
        int size = Math.max(1, Math.min(limit, 50));
        var page = salePostRepository.findAllBySellerId(
                sellerId,
                PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return page.getContent().stream()
                .map(SalePostSummaryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
