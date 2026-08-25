// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CreatorFlowStoreKit",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CreatorFlowStoreKit",
            targets: ["CreatorFlowStoreKit"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.0")
    ],
    targets: [
        .target(
            name: "CreatorFlowStoreKit",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/CreatorFlowStoreKit")
    ]
)
