# 🚀 Setup Completo - Portainer + Quiz Analytics

## 📋 Processo Simplificado

### Passo 1: Preparar pasta no servidor
```bash
# No seu servidor Docker/Soar
sudo mkdir -p /opt/quiz-analytics
sudo chmod 755 /opt/quiz-analytics
```

### Passo 2: Colocar arquivos do projeto
```bash
# Transferir o ZIP do Replit para o servidor
# Descompactar na pasta /opt/quiz-analytics
cd /opt/quiz-analytics
unzip seu-projeto.zip
# ou
scp -r * usuario@servidor:/opt/quiz-analytics/
```

### Passo 3: Criar Stack no Portainer
1. **Portainer → Stacks → Add Stack**
2. **Nome:** `quiz-analytics`
3. **Colar o docker-compose.yml** (que já está atualizado)
4. **Deploy the stack**

### Passo 4: Container já sobe com os arquivos
✅ **Volume mapeado:** `/opt/quiz-analytics` (host) → `/app` (container)
✅ **Arquivos automaticamente disponíveis** dentro do container
✅ **Node.js 18 já instalado**

### Passo 5: Executar comandos via Portainer Console
1. **Containers → quiz-analytics-app → Console**
2. **Connect**
3. **Executar:**
```bash
npm install        # Instalar dependências
npm run db:push    # Criar tabelas no banco
npm run build      # Compilar projeto
npm start          # Rodar aplicação
```

## 🎯 Vantagens desta configuração:

✅ **Arquivos ficam no host** - Fácil edição e backup
✅ **Volume persistente** - Não perde dados se container reiniciar  
✅ **Interface Portainer** - Gerenciamento visual completo
✅ **Logs em tempo real** - Acompanhar execução
✅ **Restart automático** - Sistema sempre disponível

## 📍 Estrutura final:
```
/opt/quiz-analytics/           # No servidor host
├── client/                    # Frontend React
├── server/                    # Backend Express
├── shared/                    # Código compartilhado
├── package.json
├── vite.config.ts
└── ... outros arquivos

Container quiz-analytics-app:
└── /app/                      # Mapeado para /opt/quiz-analytics
    ├── client/
    ├── server/
    └── ... mesmos arquivos
```

## 🌐 Acesso:
- **Aplicação:** http://seu-servidor:5000
- **Logs:** Portainer → Containers → quiz-analytics-app → Logs
- **Console:** Portainer → Containers → quiz-analytics-app → Console

## ⚡ Comandos rápidos no console:
```bash
# Ver status
ps aux

# Reiniciar aplicação
npm start

# Ver logs em tempo real  
tail -f /proc/1/fd/1

# Verificar conexão banco
npm run db:push
```