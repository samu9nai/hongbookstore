package com.hongik.books.domain.usercategory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter @Setter @NoArgsConstructor @EqualsAndHashCode
public class UserCategoryPlaceId implements Serializable {
    @Column(name="user_category_id")
    private Long userCategoryId;

    @Column(name="place_id")
    private Long placeId;
}
