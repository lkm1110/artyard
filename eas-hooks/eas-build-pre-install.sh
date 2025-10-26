#!/usr/bin/env bash

# EAS Build pre-install hook
# This script runs before npm install

set -e

echo "🔧 Pre-install hook: Preparing for expo-facebook Gradle compatibility..."

# expo-facebook Gradle 8.x 호환성을 위한 준비
echo "✅ Pre-install hook completed"

