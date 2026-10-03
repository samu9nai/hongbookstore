package com.hongik.books.domain.usercategory.dto;

import com.hongik.books.domain.usercategory.domain.UserCategory;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class UserCategoryDto {
    @Getter @NoArgsConstructor
    public static class CreateRequest {
        private String name;
    }
    @Getter @NoArgsConstructor
    public static class RenameRequest {
        private String name;
    }
    @Getter
    public static class Response {
        private Long id;
        private String name;
        public Response(UserCategory uc) {
            this.id = uc.getId();
            this.name = uc.getName();
        }
    }
}
