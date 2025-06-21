#!/bin/bash

# Furnibles - Setup Script
echo "🏠 Configurando Furnibles..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js versión 18+ requerida. Versión actual: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) detectado"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    print_success "npm $(npm --version) detectado"
}

# Install root dependencies
install_root_deps() {
    print_status "Instalando dependencias raíz..."
    npm install
    print_success "Dependencias raíz instaladas"
}

# Setup backend
setup_backend() {
    print_status "Configurando backend..."
    
    if [ ! -d "backend" ]; then
        print_error "Directorio backend no encontrado"
        exit 1
    fi
    
    cd backend
    
    # Install dependencies
    print_status "Instalando dependencias del backend..."
    npm install
    
    # Copy environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Archivo .env creado desde .env.example"
            print_warning "Por favor configura las variables de entorno en backend/.env"
        else
            print_warning "Archivo .env.example no encontrado en backend/"
        fi
    else
        print_success "Archivo .env ya existe en backend/"
    fi
    
    cd ..
    print_success "Backend configurado"
}

# Setup frontend
setup_frontend() {
    print_status "Configurando frontend..."
    
    if [ ! -d "frontend" ]; then
        print_error "Directorio frontend no encontrado"
        exit 1
    fi
    
    cd frontend
    
    # Install dependencies
    print_status "Instalando dependencias del frontend..."
    npm install
    
    # Copy environment file
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            cp .env.local.example .env.local
            print_success "Archivo .env.local creado desde .env.local.example"
            print_warning "Por favor configura las variables de entorno en frontend/.env.local"
        else
            print_warning "Archivo .env.local.example no encontrado en frontend/"
        fi
    else
        print_success "Archivo .env.local ya existe en frontend/"
    fi
    
    cd ..
    print_success "Frontend configurado"
}

# Setup database (when available)
setup_database() {
    print_status "Configurando base de datos..."
    
    # Check if Prisma is available
    if [ -f "backend/package.json" ] && grep -q "prisma" backend/package.json; then
        cd backend
        
        # Generate Prisma client
        print_status "Generando cliente Prisma..."
        npx prisma generate 2>/dev/null || print_warning "No se pudo generar el cliente Prisma (normal si la DB no está configurada)"
        
        cd ..
        print_success "Base de datos configurada (parcialmente)"
    else
        print_warning "Prisma no encontrado, saltando configuración de DB"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creando directorios necesarios..."
    
    # Create upload directories
    mkdir -p backend/uploads/{pdfs,images/products,images/profiles,temp}
    mkdir -p backend/logs
    
    # Create test directories
    mkdir -p tests/{unit/{frontend,backend},integration,e2e}
    
    print_success "Directorios creados"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════╗"
    echo "║           FURNIBLES SETUP            ║"
    echo "║     Marketplace de Planos DIY       ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_node
    check_npm
    create_directories
    install_root_deps
    setup_backend
    setup_frontend
    setup_database
    
    echo ""
    print_success "🎉 ¡Setup completado!"
    echo ""
    echo -e "${BLUE}Próximos pasos:${NC}"
    echo "1. Configura las variables de entorno:"
    echo "   - backend/.env"
    echo "   - frontend/.env.local"
    echo ""
    echo "2. Configura PostgreSQL y Redis"
    echo ""
    echo "3. Ejecuta la base de datos:"
    echo "   npm run db:push"
    echo "   npm run db:seed"
    echo ""
    echo "4. Inicia el desarrollo:"
    echo "   npm run dev"
    echo ""
    print_warning "Revisa el README.md para instrucciones detalladas"
}

# Execute main function
main