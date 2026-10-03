package com.hongik.books.domain.location.controller;

import com.hongik.books.auth.dto.LoginUserDTO;
import com.hongik.books.domain.location.dto.MyLocationDto;
import com.hongik.books.domain.location.service.MyLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/my/locations")
@RequiredArgsConstructor
public class MyLocationController {

    private final MyLocationService myLocationService;

    @GetMapping
    public ResponseEntity<List<MyLocationDto.Response>> list(@AuthenticationPrincipal LoginUserDTO user) {
        return ResponseEntity.ok(myLocationService.list(user.id()));
    }

    @PostMapping
    public ResponseEntity<MyLocationDto.Response> add(@AuthenticationPrincipal LoginUserDTO user,
                                                      @RequestBody MyLocationDto.SaveRequest req) {
        return ResponseEntity.ok(myLocationService.add(user.id(), req));
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<Void> setDefault(@AuthenticationPrincipal LoginUserDTO user,
                                           @PathVariable Long id) {
        myLocationService.setDefault(user.id(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal LoginUserDTO user,
                                       @PathVariable Long id) {
        myLocationService.delete(user.id(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MyLocationDto.Response> update(@AuthenticationPrincipal LoginUserDTO user,
                                                         @PathVariable Long id,
                                                         @RequestBody MyLocationDto.SaveRequest req) {
        return ResponseEntity.ok(myLocationService.update(user.id(), id, req));
    }
}
