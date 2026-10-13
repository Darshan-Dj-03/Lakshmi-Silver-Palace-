# Lakshmi Silver Palace catalogue

Mobile first silver jewellery catalogue with a separate owner admin page. Customers browse products, filter by collection, save pieces locally and enquire directly with the business. There is no cart, checkout, or order flow.

## What is here

- `mobile/` — Expo + React Native Android app. It opens with an animated LSP mark and includes search, collections, two column product browsing, saved pieces, product details, WhatsApp enquiries, and an in-app owner admin section.
- `admin/` — optional responsive desktop web portal for an owner account. It supports category management and CSV product import/update by SKU.
- `supabase/migrations/` — PostgreSQL catalog schema, Row Level Security rules, and public product image storage policies.

## Run locally

1. Install Node.js LTS and Git, then from this folder run `npm install` in both `mobile` and `admin`.
2. Create a Supabase project. In its SQL editor, run [`supabase/migrations/202610130001_catalog.sql`](supabase/migrations/202610130001_catalog.sql).
3. Copy `mobile/.env.example` to `mobile/.env` and `admin/.env.example` to `admin/.env`. Fill each with the Supabase Project URL and the **publishable** key from the project Connect panel. Never put a service-role/secret key in either app.
4. Create an owner login in Supabase Authentication. In the Supabase SQL Editor, replace the email below and run it to assign the server-controlled admin role. Then sign out and back in so the account gets a fresh role token. Never put the service-role/secret key in app code or use editable `user_metadata` for roles.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'owner@example.com';
   ```

5. In `mobile/`, run `npm run start`, then scan the QR code using Expo Go on an Android phone, or press `a` with an Android emulator running. If Expo Go asks you to sign in, sign in to the same Expo account in the CLI (`npx expo login`) and the app. Until Supabase is configured, the app uses sample catalogue pieces so the interface can be explored.
6. Open the mobile app hamburger menu and tap **Owner admin** to sign in and manage products, categories, or import a CSV without leaving the app. Optionally, run the separate desktop portal from `admin/` with `npm run dev`.

The sample products are visual placeholders. Replace them with approved product photos, the business's actual product names, descriptions, prices or enquiry wording, and categories before launch. Update the location/contact details in `mobile/App.tsx` if they should appear in the app.

## Initial 800 product load

In the admin portal, choose **Products → Download template**, fill one row per product in Excel or Google Sheets, and save/export as CSV UTF-8. Required: unique `sku` and `name`. `category_slug` must match the Categories page. `price` may be blank. `images` accepts one HTTPS image URL or multiple URLs separated by `|`. `is_featured` and `is_published` accept `true`/`false`; new rows default to hidden unless published is true. Upload the CSV and review its preview before importing. Existing SKUs update in batches of 200; if an upload is interrupted, uploading the same file again is safe because SKU is the upsert key.

Product image URLs need to be publicly reachable HTTPS URLs. The migration also creates a public `catalog-images` Supabase Storage bucket. This first admin version does not yet include drag-and-drop photo upload or a ZIP-image-to-SKU matcher; those can be added once the client supplies the original product photo set and a SKU/image naming convention.

## Brand opening animation

The native Android launch screen displays the LSP mark over the brand burgundy so the screen is not blank while Android starts React Native. After that, `mobile/App.tsx` animates the same mark in: it fades in, springs from 72% to full size, and brings in a thin ring. Keeping a static native launch screen and a short in-app animation avoids an empty flash; extend the reveal only after measuring the launch on a low-end Android phone. The native splash image lives at `mobile/assets/splash-icon.png`.

## Production checklist

- Confirm the final package ID (`com.lakshmisilverpalace.catalog`) before the first Play Store upload; Google Play package IDs cannot be renamed after the app is created.
- Replace all sample product data and imagery; confirm price display, category names, WhatsApp destination, address, app name, icon, privacy policy URL, and store listing text with the business.
- Restrict admin account creation to the owner, and use Supabase Auth MFA for the owner where available. Keep the database backups and project billing/region under the business owner's account.
- Before submitting to Google Play, add the business contact email to the privacy policy, verify it with the business, host it over HTTPS, and put its public URL in Play Console.
- Review the RLS policies and test both anonymous catalogue access and a non-admin account before launch. Keep the Supabase service-role key out of the mobile app, admin bundle, and Git.
- Complete the privacy policy, Data safety and content rating forms, and use a Play App Signing Android App Bundle. Catalogue images are public; do not upload private customer data.
- For a personal Play developer account created after 13 November 2023, Google's current guidance requires a closed test with at least 12 opted-in testers for 14 continuous days before requesting production access. Account type and current Play Console steps may change; check the owner's Play Console at submission time.
- Expo SDK 57 targets Android API 36; this project also declares `targetSdkVersion` 36 to match Google's submission requirement effective 31 August 2026. Re-check the target API rule before each Play upload.

## Build and submit for Google Play

1. Install EAS CLI: `npm install --global eas-cli`, then sign in with the business owner's Expo account using `eas login` from `mobile/`.
2. Run `eas build:configure` once if EAS asks for project linking. Review the package ID and app identity first.
3. Build an installable preview with `eas build --platform android --profile preview`. Install the resulting APK on physical Android devices and check small/large screens, poor network, search, categories, saved pieces, product images, and enquiries.
4. Complete a closed Play test and fix feedback. For newer personal accounts, maintain at least 12 opted-in testers for the full 14-day window.
5. Produce a store bundle with `eas build --platform android --profile production`. In Play Console, create the app, complete the policy/store listing forms, upload the `.aab` to internal/closed testing, then request production access and promote the tested release. Do not share signing credentials; retain the Expo/EAS account and Play Console under the business owner's control.

## Before calling this production-ready

The app and import foundations are in place, but public release still depends on the business's real product inventory and permission to publish it, Supabase project creation, HTTPS hosting for the admin site, a final privacy policy, verifying the supplied WhatsApp link, review on actual Android phones, and the owner's Play Console account. The workspace does not contain customer approved product photos/data or service credentials, so none are fabricated or deployed here.

The current mobile `npm audit` reports high-severity advisories in Expo/Metro's Node build-tool dependency tree (`braces` and `node-forge`). The advisory scan found no compatible Expo SDK 57 fix for the Metro dependency; these tools are not part of the exported app JavaScript bundle. Re-run the audit before each release and update Expo when it publishes a compatible fix. Do not use `npm audit fix --force` here: npm proposes a breaking Expo downgrade.
