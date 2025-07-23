#!/bin/bash
echo "🚀 Iniciando FURNIBLES en Codespaces..."

# Matar procesos previos
echo "🧹 Limpiando procesos previos..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
sleep 2

# Verificar puertos disponibles
echo "📊 Verificando puertos..."
lsof -i:3000 2>/dev/null && echo "❌ Puerto 3000 ocupado" || echo "✅ Puerto 3000 libre"
lsof -i:3001 2>/dev/null && echo "❌ Puerto 3001 ocupado" || echo "✅ Puerto 3001 libre"

# Exponer puertos
echo "🔌 Configurando puertos públicos..."
gh codespace ports visibility 3000:public 2>/dev/null || echo "⚠️  No se pudo exponer puerto 3000"
gh codespace ports visibility 3001:public 2>/dev/null || echo "⚠️  No se pudo exponer puerto 3001"

# Iniciar backend
echo "🔧 Iniciando backend en puerto 3001..."
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Esperar que backend inicie
echo "⏳ Esperando backend..."
sleep 15

# Verificar backend
curl -s http://localhost:3001/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend funcionando"
else
    echo "❌ Backend no responde"
fi

# Iniciar frontend
echo "🎨 Iniciando frontend en puerto 3000..."
cd ../frontend
npm run dev -- -p 3000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "🎉 SERVICIOS INICIADOS:"
echo "   Backend:  https://probable-barnacle-65wp9jg5qwxc5w6-3001.app.github.dev"
echo "   Frontend: https://probable-barnacle-65wp9jg5qwxc5w6-3000.app.github.dev"
echo ""
echo "📝 PIDs guardados:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📊 Para ver logs:"
echo "   tail -f backend.log"
echo "   tail -f frontend.log"
echo ""
echo "🛑 Para detener:"
echo "   kill $BACKEND_PID $FRONTEND_PID"

# Guardar PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

wait
