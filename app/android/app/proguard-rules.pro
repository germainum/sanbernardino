# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep stack traces readable in the mapping file, without leaking source paths.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Capacitor's JS bridge dispatches plugin calls by reflecting on class/method names and
# annotations — R8 renaming or stripping any of this breaks every plugin silently at runtime
# (no compile error, just calls that go nowhere).
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.PluginCall { *; }

# capacitor-cordova-android-plugins pulls in the Cordova compatibility layer, same reflection risk.
-keep class org.apache.cordova.** { *; }

# @capacitor/push-notifications -> Firebase Cloud Messaging.
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# @capacitor-community/admob -> Google Mobile Ads SDK.
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# The platform's default rules already keep @JavascriptInterface methods, but the app's own
# WebView bridge usage is small enough that being explicit here costs nothing.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
