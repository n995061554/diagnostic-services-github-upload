# Diagnostic Services — iOS & Apple TestFlight Readiness Guide

This guide details how to build, archive, and distribute the **Diagnostic Services Mobile App** to **Apple TestFlight**.

---

## 1. Prerequisites Checklist

| Requirement | Value / Details | Status |
|---|---|---|
| **Flutter SDK** | `3.47.6` (Dart 3.13+) | ✅ Verified & passing (0 analyzer issues, 5/5 tests passing) |
| **App Name** | `Diagnostic Services` | ✅ Configured in `Info.plist` |
| **Bundle Identifier** | `com.diagnosticservices.app` | ✅ Configured in `project.pbxproj` and `Info.plist` |
| **Deployment Target** | iOS 15.0+ | ✅ Compatible with modern TestFlight requirements |
| **Backend API URL** | `https://diagnostic-services-staging.onrender.com` | ✅ Live and responsive |
| **App Icons** | 1024x1024 App Store icon + all standard iPhone/iPad sizes | ✅ Present in `Assets.xcassets` |
| **Permissions Declared** | Camera (QR/barcode scanning) & Photo Library (receipt uploads) | ✅ Strings defined in `Info.plist` |
| **Apple Developer Account** | Enrolled at [developer.apple.com](https://developer.apple.com) | Required by Apple ($99/yr) |

---

## 2. Option A: Build Automatically Using GitHub Actions (No Mac Required)

Since you are running on Windows, you can use **GitHub Actions** which provides free cloud macOS runners with Xcode and Flutter pre-installed.

### Steps:
1. Push your latest code to GitHub (`master` branch).
2. Go to your GitHub repository: `https://github.com/n995061554/DS---web-application-`.
3. Click on the **Actions** tab at the top.
4. In the left sidebar, click **"Build iOS App & Deploy to TestFlight"**.
5. Click **"Run workflow"** on the right side:
   - **Backend API Base URL**: Defaults to `https://diagnostic-services-staging.onrender.com`.
   - **Build Number**: Enter e.g. `1` (increment this number for each subsequent upload).
6. Click the green **"Run workflow"** button.
7. Once the build finishes (approx. 5–8 minutes):
   - You can download the completed **`diagnostic-services-ios-build`** artifact directly from GitHub.
   - It contains the compiled iOS archive and `.ipa`.

---

## 3. GitHub Secrets Reference for Production Signing & TestFlight

To enable production code signing and automatic upload to Apple TestFlight, configure the following secrets under **Repository Settings** &rarr; **Secrets and variables** &rarr; **Actions**:

### A. iOS Code Signing Secrets (Required for Signed `.ipa`)
| Secret Name | Purpose | How to Generate |
|---|---|---|
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Apple Distribution Certificate (.p12) base64 string | Export your Apple Distribution Certificate from Keychain as `.p12`, then run: `base64 -i cert.p12 \| pbcopy` (or `[Convert]::ToBase64String([IO.File]::ReadAllBytes('cert.p12'))` in PowerShell). |
| `IOS_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` file | The password you entered when exporting the certificate from Keychain. |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store Distribution Provisioning Profile base64 string | Download your distribution profile (`.mobileprovision`) from [developer.apple.com](https://developer.apple.com), then convert to base64: `base64 -i profile.mobileprovision \| pbcopy`. |
| `IOS_TEAM_ID` | Apple Developer 10-character Team ID | Found on the Apple Developer portal under **Membership details** (e.g. `ABC123XYZ4`). |

### B. App Store Connect API Secrets (Required for Fastlane TestFlight Delivery)
| Secret Name | Purpose | How to Generate |
|---|---|---|
| `APP_STORE_CONNECT_KEY_ID` | API Key ID (e.g. `2X9R4274KS`) | Generated in [App Store Connect](https://appstoreconnect.apple.com) &rarr; **Users and Access** &rarr; **Integrations** / **Keys**. |
| `APP_STORE_CONNECT_ISSUER_ID` | API Issuer UUID | Displayed at the top of the App Store Connect Keys page (e.g. `57246542-96fe-1a63-e053-0824d011072a`). |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Full contents of the `.p8` private key file | The entire text of the downloaded `AuthKey_XXXX.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`). |

---

## 4. Understanding Workflow Execution States

The workflow's step summary strictly distinguishes among these 4 states:

1. **Workflow Configured Correctly (Dry-Run / Unsigned):**
   * If signing secrets are **not configured**, the workflow builds an unsigned release package using `--no-codesign`.
   * The IPA and `.xcarchive` are uploaded as GitHub Action Artifacts.
   * TestFlight upload is safely marked as **SKIPPED** (Never reported as successful).
2. **Production Signed Build:**
   * If signing secrets are present, the CI creates a temporary keychain, imports your certificate, applies the provisioning profile, and outputs an Apple-signed IPA package using `ExportOptions.plist`.
3. **TestFlight Upload Successful:**
   * Only occurs when Fastlane connects to App Store Connect using your API key and successfully uploads the signed IPA.
4. **TestFlight Upload Failed:**
   * If credentials are provided but rejected by Apple (e.g. expired key, duplicate build number, or revoked certificate), Fastlane exits with an error and the job fails clearly.

---

## 4. Option C: Build on a Local Mac (Xcode)

If you or a colleague have a Mac or MacBook:

1. Clone the repository on the Mac:
   ```bash
   git clone https://github.com/n995061554/DS---web-application-.git
   cd DS---web-application-/mobile
   ```

2. Fetch dependencies and install CocoaPods:
   ```bash
   flutter pub get
   cd ios && pod install && cd ..
   ```

3. Build the iOS archive targeting Render staging:
   ```bash
   flutter build ipa --release --dart-define=API_BASE_URL=https://diagnostic-services-staging.onrender.com
   ```

4. Or open in Xcode:
   ```bash
   open ios/Runner.xcworkspace
   ```
   - In Xcode, select your **Development Team** under `Signing & Capabilities`.
   - Select **Any iOS Device (arm64)** as the target build destination.
   - Click menu **Product** &rarr; **Archive**.
   - Once the Organizer opens, click **Distribute App** &rarr; select **TestFlight & App Store** &rarr; click **Upload**.

---

## 5. Adding Testers in Apple TestFlight

Once the app is uploaded to App Store Connect:
1. Go to [App Store Connect](https://appstoreconnect.apple.com) &rarr; **Apps** &rarr; **Diagnostic Services**.
2. Click the **TestFlight** tab.
3. Apple will process the build (usually takes 5 to 15 minutes).
4. Under **Internal Testing**:
   - Add yourself or team members (they receive an immediate email invitation).
5. Install the **TestFlight** app from the App Store on any iPhone or iPad.
6. Tap the link in your email to redeem the invite and install the app!

