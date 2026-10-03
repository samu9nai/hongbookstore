package com.hongik.books.domain.usercategory.service;

import com.hongik.books.domain.place.domain.Place;
import com.hongik.books.domain.place.dto.PlaceDto;
import com.hongik.books.domain.place.repository.PlaceRepository;
import com.hongik.books.domain.usercategory.domain.UserCategory;
import com.hongik.books.domain.usercategory.domain.UserCategoryPlace;
import com.hongik.books.domain.usercategory.domain.UserCategoryPlaceId;
import com.hongik.books.domain.usercategory.dto.UserCategoryDto;
import com.hongik.books.domain.usercategory.repository.UserCategoryPlaceRepository;
import com.hongik.books.domain.usercategory.repository.UserCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserCategoryService {
    private final UserCategoryRepository ucRepo;
    private final UserCategoryPlaceRepository linkRepo;
    private final PlaceRepository placeRepo;

    @Transactional(readOnly = true)
    public List<UserCategory> list(Long userId) {
        return ucRepo.findByUserId(userId);
    }

    @Transactional
    public UserCategory create(Long userId, UserCategoryDto.CreateRequest req) {
        String name = req.getName() == null ? "" : req.getName().trim();
        if (name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 필수");
        if (ucRepo.existsByUserIdAndName(userId, name))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 카테고리 이름");
        UserCategory uc = UserCategory.builder().userId(userId).name(name).build();
        return ucRepo.save(uc);
    }

    @Transactional
    public UserCategory rename(Long userId, Long id, UserCategoryDto.RenameRequest req) {
        UserCategory uc = ucRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String name = req.getName() == null ? "" : req.getName().trim();
        if (name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 필수");
        if (ucRepo.existsByUserIdAndName(userId, name) && !name.equals(uc.getName()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 카테고리 이름");
        uc.setName(name);
        return ucRepo.save(uc);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        UserCategory uc = ucRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ucRepo.delete(uc);
    }

    @Transactional
    public void addPlace(Long userId, Long catId, Long placeId) {
        ucRepo.findByIdAndUserId(catId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Place place = placeRepo.findById(placeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!linkRepo.existsByUserCategoryIdAndPlaceId(catId, placeId)) {
            UserCategoryPlace link = new UserCategoryPlace();
            UserCategoryPlaceId pk = new UserCategoryPlaceId();
            pk.setUserCategoryId(catId); pk.setPlaceId(placeId);
            link.setId(pk);
            link.setUserCategory(ucRepo.getReferenceById(catId));
            link.setPlace(place);
            linkRepo.save(link);
        }
    }

    @Transactional
    public void removePlace(Long userId, Long catId, Long placeId) {
        ucRepo.findByIdAndUserId(catId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        linkRepo.deleteByUserCategoryIdAndPlaceId(catId, placeId);
    }

    @Transactional(readOnly = true)
    public List<PlaceDto.Response> listPlaces(Long userId, Long catId) {
        ucRepo.findByIdAndUserId(catId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return linkRepo.findByUserCategoryId(catId).stream()
                .map(UserCategoryPlace::getPlace)
                .map(PlaceDto.Response::new)
                .toList();
    }
}
