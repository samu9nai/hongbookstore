package com.hongik.books;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.google.cloud.storage.Storage;

@SpringBootTest
@ActiveProfiles("test")
class HongBookStoreApplicationTests {

    @MockBean
    Storage storage;

    @Test
    void contextLoads() {
    }

}
