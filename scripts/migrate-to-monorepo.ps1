#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "apps/nomad-go-main" | Out-Null
New-Item -ItemType Directory -Force -Path "packages/neon-emerald" | Out-Null
New-Item -ItemType Directory -Force -Path "packages/gamification-xp" | Out-Null

$itemsToMove = @(
  "src",
  "public",
  "prisma",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "postcss.config.mjs",
  "README.md",
  "tsconfig.json"
)

foreach ($item in $itemsToMove) {
  if (Test-Path $item) {
    Move-Item -Path $item -Destination "apps/nomad-go-main"
  }
}

Write-Host "Monorepo folder structure created."
Write-Host "Next steps:"
Write-Host "1) Create root package.json with workspaces."
Write-Host "2) Remove old node_modules/.next and run npm install at repo root."
