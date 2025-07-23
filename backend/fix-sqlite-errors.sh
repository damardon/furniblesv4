#!/bin/bash

# Corregir Decimal
find src/ -name "*.ts" -exec sed -i 's/new Prisma\.Decimal(\([^)]*\))/\1/g' {} \;

# Corregir mode insensitive
find src/ -name "*.ts" -exec sed -i 's/, mode: .insensitive.//g' {} \;

# Corregir path arrays en metadata
find src/ -name "*.ts" -exec sed -i 's/path: \[\([^]]*\)\]/path: \1/g' {} \;

echo "Correcciones aplicadas"
