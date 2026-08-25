import Foundation
import Capacitor
import StoreKit

@objc(CreatorFlowStoreKitPlugin)
public class CreatorFlowStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CreatorFlowStoreKit"
    public let jsName = "CreatorFlowStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
    ]

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("productId is required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    let transaction = try Self.checkVerified(verification)
                    let signedTransaction = String(data: transaction.jsonRepresentation, encoding: .utf8) ?? ""
                    await transaction.finish()
                    call.resolve([
                        "productId": productId,
                        "signedTransaction": signedTransaction,
                    ])
                case .userCancelled:
                    call.reject("User cancelled purchase", "CANCELLED")
                case .pending:
                    call.reject("Purchase pending approval", "PENDING")
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed", nil, error)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                var activeProductId: String? = nil
                var signedTransaction: String? = nil

                for await verification in Transaction.currentEntitlements {
                    let transaction = try Self.checkVerified(verification)
                    if transaction.revocationDate == nil {
                        activeProductId = transaction.productID
                        signedTransaction = String(data: transaction.jsonRepresentation, encoding: .utf8)
                        break
                    }
                }

                var result: [String: Any] = [
                    "activeProductId": activeProductId as Any,
                ]
                if let signedTransaction {
                    result["signedTransaction"] = signedTransaction
                }
                call.resolve(result)
            } catch {
                call.reject("Restore failed", nil, error)
            }
        }
    }

    private static func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw NSError(domain: "CreatorFlowStoreKit", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Unverified transaction",
            ])
        case .verified(let safe):
            return safe
        }
    }
}
