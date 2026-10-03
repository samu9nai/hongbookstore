package com.hongik.books.domain.usercategory.domain;

import com.hongik.books.domain.place.domain.Place;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_category_places")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserCategoryPlace {

    @EmbeddedId
    private UserCategoryPlaceId id = new UserCategoryPlaceId();

    @MapsId("userCategoryId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_category_id")
    private UserCategory userCategory;

    @MapsId("placeId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="place_id")
    private Place place;
}
