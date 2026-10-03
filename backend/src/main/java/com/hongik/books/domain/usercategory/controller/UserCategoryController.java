package com.hongik.books.domain.usercategory.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.place.dto.PlaceDto;
import com.hongik.books.domain.usercategory.domain.UserCategory;
import com.hongik.books.domain.usercategory.dto.UserCategoryDto;
import com.hongik.books.domain.usercategory.service.UserCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-categories")
@RequiredArgsConstructor
public class UserCategoryController {

    private final UserCategoryService service;

    @GetMapping
    public ResponseEntity<List<UserCategoryDto.Response>> list(@AuthenticationPrincipal LoginUserDTO user) {
        List<UserCategory> list = service.list(user.id());
        return ResponseEntity.ok(list.stream().map(UserCategoryDto.Response::new).toList());
    }

    @PostMapping
    public ResponseEntity<UserCategoryDto.Response> create(@AuthenticationPrincipal LoginUserDTO user,
                                                           @RequestBody UserCategoryDto.CreateRequest req) {
        UserCategory uc = service.create(user.id(), req);
        return ResponseEntity.ok(new UserCategoryDto.Response(uc));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserCategoryDto.Response> rename(@AuthenticationPrincipal LoginUserDTO user,
                                                           @PathVariable Long id,
                                                           @RequestBody UserCategoryDto.RenameRequest req) {
        UserCategory uc = service.rename(user.id(), id, req);
        return ResponseEntity.ok(new UserCategoryDto.Response(uc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal LoginUserDTO user, @PathVariable Long id) {
        service.delete(user.id(), id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/places")
    public ResponseEntity<List<PlaceDto.Response>> listPlaces(@AuthenticationPrincipal LoginUserDTO user,
                                                              @PathVariable Long id) {
        return ResponseEntity.ok(service.listPlaces(user.id(), id));
    }

    @PostMapping("/{id}/places/{placeId}")
    public ResponseEntity<Void> addPlace(@AuthenticationPrincipal LoginUserDTO user,
                                         @PathVariable Long id,
                                         @PathVariable Long placeId) {
        service.addPlace(user.id(), id, placeId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/places/{placeId}")
    public ResponseEntity<Void> removePlace(@AuthenticationPrincipal LoginUserDTO user,
                                            @PathVariable Long id,
                                            @PathVariable Long placeId) {
        service.removePlace(user.id(), id, placeId);
        return ResponseEntity.ok().build();
    }
}
