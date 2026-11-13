// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP (FLUTTER)
// Design Tokens, Color Palette & Inter Typography Theme System
// File: /mobile/lib/core/theme/app_theme.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  AppColors._();

  // Core Brand Tokens
  static const Color primaryNavy = Color(0xFF0E1035);
  static const Color deepNavy = Color(0xFF15253F);
  static const Color secondaryBlue = Color(0xFF2B3D5B);
  static const Color slateGrey = Color(0xFF7C8594);
  static const Color mediumGrey = Color(0xFFC3C3C3);
  static const Color lightBlueGrey = Color(0xFFD0DEE5);
  static const Color white = Color(0xFFFFFFFF);
  static const Color surfaceBackground = Color(0xFFF8FAFC);

  // Restrained Pastel Action Palette
  static const Color pastelBlueBg = Color(0xFFE0F2FE);
  static const Color pastelBlueBorder = Color(0xFFBAE6FD);
  static const Color pastelBlueIcon = Color(0xFF0284C7);
  static const Color pastelBlueText = Color(0xFF0369A1);

  static const Color pastelIndigoBg = Color(0xFFEFF6FF);
  static const Color pastelIndigoBorder = Color(0xFFBFDBFE);
  static const Color pastelIndigoIcon = Color(0xFF2563EB);
  static const Color pastelIndigoText = Color(0xFF1D4ED8);

  static const Color pastelGreenBg = Color(0xFFDCFCE7);
  static const Color pastelGreenBorder = Color(0xFFBBF7D0);
  static const Color pastelGreenIcon = Color(0xFF16A34A);
  static const Color pastelGreenText = Color(0xFF15803D);

  static const Color pastelVioletBg = Color(0xFFEDE9FE);
  static const Color pastelVioletBorder = Color(0xFFDDD6FE);
  static const Color pastelVioletIcon = Color(0xFF7C3AED);
  static const Color pastelVioletText = Color(0xFF6D28D9);

  static const Color pastelPinkBg = Color(0xFFFCE7F3);
  static const Color pastelPinkBorder = Color(0xFFFBCFE8);
  static const Color pastelPinkIcon = Color(0xFFDB2777);
  static const Color pastelPinkText = Color(0xFFBE185D);

  static const Color pastelCyanBg = Color(0xFFCFFAFE);
  static const Color pastelCyanBorder = Color(0xFFA5F3FC);
  static const Color pastelCyanIcon = Color(0xFF0891B2);
  static const Color pastelCyanText = Color(0xFF0E7490);

  // Status Colors
  static const Color success = Color(0xFF059669);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);
}

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.interTextTheme();

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.surfaceBackground,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primaryNavy,
        primary: AppColors.primaryNavy,
        secondary: AppColors.secondaryBlue,
        surface: AppColors.white,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.inter(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: AppColors.primaryNavy,
        ),
        displayMedium: GoogleFonts.inter(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: AppColors.primaryNavy,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.primaryNavy,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppColors.primaryNavy,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: AppColors.primaryNavy,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w400,
          color: AppColors.slateGrey,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.primaryNavy,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: AppColors.slateGrey,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryNavy,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryNavy,
          foregroundColor: AppColors.white,
          textStyle: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }
}
