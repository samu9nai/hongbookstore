## Multi-stage build for Spring Boot 3 (Java 21)

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Leverage Gradle wrapper
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

# Copy build descriptors first for better layer caching
COPY build.gradle settings.gradle ./

# Copy sources
COPY src src

# Build layered jar (skip tests in container build)
RUN ./gradlew --no-daemon clean bootJar -x test

# Extract layers for better Docker cache reuse
RUN java -Djarmode=layertools -jar build/libs/*.jar extract


FROM eclipse-temurin:21-jre-alpine AS run
ENV TZ=Asia/Seoul
WORKDIR /app

# Create non-root user (Alpine busybox uses adduser/addgroup)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# Copy Spring Boot layers as separate Docker layers
COPY --from=build /workspace/dependencies/ ./
COPY --from=build /workspace/snapshot-dependencies/ ./
COPY --from=build /workspace/spring-boot-loader/ ./
COPY --from=build /workspace/application/ ./

EXPOSE 8080

# Tune JVM for container; make profile explicit
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -Duser.timezone=Asia/Seoul"
ENV SPRING_PROFILES_ACTIVE=prod

# Spring Boot 3 launcher for exploded layers
ENTRYPOINT ["java","org.springframework.boot.loader.launch.JarLauncher"]
