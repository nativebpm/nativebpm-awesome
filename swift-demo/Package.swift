// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "nativebpm-awesome-swift",
    platforms: [
        .macOS(.v10_15)
    ],
    dependencies: [
        .package(path: "../../sdk/swift")
    ],

    targets: [
        .executableTarget(
            name: "nativebpm-awesome-swift",
            dependencies: [
                .product(name: "NativeBPMClient", package: "swift")

            ],
            path: "Sources"
        )
    ]
)
