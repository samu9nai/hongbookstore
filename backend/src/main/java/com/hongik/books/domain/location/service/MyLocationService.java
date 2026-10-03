package com.hongik.books.domain.location.service;

import com.hongik.books.domain.location.domain.MyLocation;
import com.hongik.books.domain.location.dto.MyLocationDto;
import com.hongik.books.domain.location.repository.MyLocationRepository;
import com.hongik.books.domain.user.domain.User;
import com.hongik.books.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MyLocationService {
    private final MyLocationRepository myLocationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MyLocationDto.Response> list(Long userId) {
        return myLocationRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream().map(MyLocationDto.Response::new)
                .collect(Collectors.toList());
    }

    public MyLocationDto.Response add(Long userId, MyLocationDto.SaveRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        String name = defaultString(req.name(), "거래 장소");
        String address = defaultString(req.address(), "");

        if (name.length() < 2) throw new IllegalArgumentException("위치명은 2자 이상이어야 합니다.");
        if (address.length() < 3) throw new IllegalArgumentException("주소는 3자 이상 입력해 주세요.");
        if (myLocationRepository.existsByUser_IdAndNameIgnoreCase(userId, name)) {
            throw new IllegalStateException("이미 같은 이름의 위치가 있습니다.");
        }

        boolean shouldBeDefault = Boolean.TRUE.equals(req.makeDefault()) || myLocationRepository.countByUser_Id(userId) == 0;

        if (shouldBeDefault) {
            // 기존 기본 해제
            myLocationRepository.findByUser_IdAndIsDefaultTrue(userId)
                    .ifPresent(loc -> { loc.setDefault(false); });
        }

        MyLocation saved = myLocationRepository.save(
                MyLocation.builder()
                        .user(user)
                        .name(name)
                        .address(address)
                        .lat(req.lat())
                        .lng(req.lng())
                        .isDefault(shouldBeDefault)
                        .build()
        );
        return new MyLocationDto.Response(saved);
    }

    public void setDefault(Long userId, Long id) {
        MyLocation target = myLocationRepository.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 위치를 찾을 수 없습니다."));

        myLocationRepository.findByUser_IdAndIsDefaultTrue(userId)
                .ifPresent(loc -> { if (!loc.getId().equals(id)) loc.setDefault(false); });

        target.setDefault(true);
    }

    public void delete(Long userId, Long id) {
        MyLocation target = myLocationRepository.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 위치를 찾을 수 없습니다."));
        boolean wasDefault = target.isDefault();
        myLocationRepository.delete(target);

        // 기본이 삭제되면 다른 하나를 기본으로 승격
        if (wasDefault) {
            myLocationRepository.findByUser_IdOrderByIsDefaultDescCreatedAtDesc(userId)
                    .stream().findFirst().ifPresent(first -> first.setDefault(true));
        }
    }

    public MyLocationDto.Response update(Long userId, Long id, MyLocationDto.SaveRequest req) {
        MyLocation target = myLocationRepository.findByIdAndUser_Id(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 위치를 찾을 수 없습니다."));

        if (req.name() != null) {
            String name = defaultString(req.name(), target.getName());
            if (name.length() < 2) throw new IllegalArgumentException("위치명은 2자 이상이어야 합니다.");
            if (myLocationRepository.existsByUser_IdAndNameIgnoreCaseAndIdNot(userId, name, id)) {
                throw new IllegalStateException("이미 같은 이름의 위치가 있습니다.");
            }
            target.setName(name);
        }
        if (req.address() != null) {
            String address = defaultString(req.address(), target.getAddress());
            if (address.length() < 3) throw new IllegalArgumentException("주소는 3자 이상 입력해 주세요.");
            target.setAddress(address);
        }
        if (req.lat() != null) target.setLat(req.lat());
        if (req.lng() != null) target.setLng(req.lng());

        if (Boolean.TRUE.equals(req.makeDefault())) {
            myLocationRepository.findByUser_IdAndIsDefaultTrue(userId)
                    .ifPresent(loc -> { if (!loc.getId().equals(id)) loc.setDefault(false); });
            target.setDefault(true);
        }
        return new MyLocationDto.Response(target);
    }

    private String defaultString(String s, String def) {
        return (s == null || s.isBlank()) ? def : s.trim();
    }
}
