# Build stage
FROM maven:3.8.4-openjdk-17-slim AS build
# This tells Docker to work inside the backend folder
WORKDIR /app
# Copy the pom and source from the current directory (rent-backend)
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]