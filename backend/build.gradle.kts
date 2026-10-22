plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.hongik"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

// Boot 4.1.1이 관리하는 버전에 공개 취약점이 있어 패치 버전만 올린다(SEC-15).
// 다음 Boot 패치가 같은 버전 이상을 관리하면 이 줄을 지운다.
extra["tomcat.version"] = "11.0.27"
extra["jackson-bom.version"] = "3.1.8"
extra["jackson-2-bom.version"] = "2.21.8"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")

    // 비동기 HTTP 통신을 위한 WebClient
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-webclient")
    testImplementation("io.projectreactor:reactor-test")
    implementation("io.netty:netty-resolver-dns-native-macos:4.2.9.Final")
    runtimeOnly("io.netty:netty-resolver-dns-native-macos:4.2.9.Final:osx-aarch_64") // MacOS Silicon 라이브러리 누락 문제

    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // web-socket
    implementation("org.springframework.boot:spring-boot-starter-websocket")

    // Mail (Gmail SMTP via JavaMailSender)
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // Security, OAuth
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    testImplementation("org.springframework.security:spring-security-test")
    implementation("org.springframework.boot:spring-boot-starter-security-oauth2-client")

    // JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // Actuator (헬스체크/모니터링)
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    testImplementation("io.projectreactor:reactor-test")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

    // MySQL DB
    runtimeOnly("com.mysql:mysql-connector-j:8.4.0")

    // Redis DB
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // YAML 직렬화 JSON 지원
    implementation("com.fasterxml.jackson.module:jackson-module-parameter-names")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("com.h2database:h2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testCompileOnly("org.projectlombok:lombok")
    testAnnotationProcessor("org.projectlombok:lombok")

    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

}

// Produce a layered jar for better Docker layer caching
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    layered { }
}

tasks.named<Test>("test") {
    useJUnitPlatform()
}
