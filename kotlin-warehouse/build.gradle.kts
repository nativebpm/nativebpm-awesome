plugins {
    kotlin("jvm") version "1.9.22"
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.nativebpm:nativebpm-kotlin-client:1.0.0")
}

application {
    mainClass.set("com.example.warehouse.AppKt")
}
