# 🚀 Guia Completo de Deploy - Dashboard Analytics Quiz

## ✅ O que já está pronto

O sistema está **100% funcional** com duas funcionalidades importantes:

1. **Sistema Híbrido** - Funciona automaticamente com PostgreSQL quando disponível, ou JSON como backup
2. **Schema Completo** - Todas as tabelas PostgreSQL criadas e testadas
3. **Métricas Persistentes** - Dados não se perdem entre reinicializações

## 📋 Pré-requisitos no seu servidor

### 1. Node.js e npm
```bash
# Verificar se está instalado
node --version  # Precisa ser v18+ 
npm --version

# Se não tiver, instalar:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. PostgreSQL configurado
Seu PostgreSQL (185.143.228.72:5432) precisa:

```bash
# 1. Aceitar conexões externas
# Editar /etc/postgresql/*/main/postgresql.conf
listen_addresses = '*'
port = 5432

# 2. Configurar autenticação 
# Editar /etc/postgresql/*/main/pg_hba.conf
# Adicionar linha:
host    all    all    0.0.0.0/0    md5

# 3. Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 3. Configurar firewall (se necessário)
```bash
# Abrir porta 5432 para PostgreSQL
sudo ufw allow 5432
```

## 🔧 Passos de Deploy

### Passo 1: Transferir arquivos
```bash
# No seu servidor, clonar ou transferir os arquivos
cd /var/www/  # ou onde você quer hospedar
git clone [seu-repositorio] quiz-analytics
cd quiz-analytics

# Ou via scp/rsync dos arquivos deste ambiente
```

### Passo 2: Instalar dependências
```bash
npm install
```

### Passo 3: Configurar variáveis de ambiente
Criar arquivo `.env`:
```env
# PostgreSQL - SUAS credenciais
POSTGRES_HOST=185.143.228.72
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DATABASE=quz/-tbz

# Ambiente
NODE_ENV=production
PORT=5000
```

### Passo 4: Configurar banco de dados
```bash
# Criar as tabelas no PostgreSQL
npm run db:push
```

### Passo 5: Build da aplicação
```bash
npm run build
```

### Passo 6: Iniciar aplicação
```bash
# Para testar
npm start

# Para produção com PM2 (recomendado)
npm install -g pm2
pm2 start "npm start" --name quiz-analytics
pm2 save
pm2 startup
```

## 🌐 Integração com WordPress

### Adicionar ao seu subdomínio
```bash
# Se usar nginx
# Criar /etc/nginx/sites-available/quiz-analytics

server {
    listen 80;
    server_name seu-subdominio.seudominio.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/quiz-analytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🛡️ Sistema de Backup Automático

O sistema já possui **backup automático híbrido**:

- ✅ **PostgreSQL disponível** → Usa banco de dados (persistente)
- ✅ **PostgreSQL indisponível** → Usa arquivo JSON (backup local)
- ✅ **Reconexão automática** → Tenta reconectar com PostgreSQL periodicamente

### Logs do sistema:
```bash
# Ver status de conexão
pm2 logs quiz-analytics

# Você verá mensagens como:
# ✅ PostgreSQL conectado com sucesso!
# ❌ PostgreSQL não disponível, usando sistema JSON como fallback
```

## 📊 Endpoints da API

Depois do deploy, você terá:

```bash
# Dashboard completo
GET http://seu-servidor:5000/api/dashboard/metrics

# Rastrear visitantes
POST http://seu-servidor:5000/api/metrics/visitor
{"etapa": "landing"}

# Iniciar sessão
POST http://seu-servidor:5000/api/metrics/session

# Interface visual
GET http://seu-servidor:5000/
```

## 🔍 Testando depois do deploy

```bash
# Testar se está funcionando
curl http://localhost:5000/api/dashboard/metrics

# Deve retornar JSON com:
# "database_status": "postgresql"  (sucesso)
# "database_status": "json_fallback"  (backup funcionando)
```

## ⚠️ Possíveis problemas e soluções

### 1. PostgreSQL não conecta
**Erro:** `Connection terminated due to connection timeout`

**Solução:**
```bash
# Verificar se PostgreSQL aceita conexões externas
sudo netstat -plt | grep :5432

# Verificar firewall
sudo ufw status

# Testar conexão manual
psql -h 185.143.228.72 -p 5432 -U seu_usuario -d quz/-tbz
```

### 2. Permissões negadas
**Erro:** `EACCES: permission denied`

**Solução:**
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER /var/www/quiz-analytics
chmod -R 755 /var/www/quiz-analytics
```

### 3. Porta já em uso
**Erro:** `Port 5000 already in use`

**Solução:**
```bash
# Encontrar o que está usando a porta
sudo lsof -i :5000

# Matar processo ou mudar porta no .env
PORT=5001
```

## 🎯 Próximos passos

1. **Testar deploy** no seu servidor
2. **Configurar domínio** para acesso público  
3. **Configurar HTTPS** com Let's Encrypt
4. **Backup periódico** do banco PostgreSQL

## 📞 Suporte

O sistema foi projetado para ser **à prova de falhas**:
- Funciona mesmo se PostgreSQL falhar
- Dados são preservados entre reinicializações  
- Reconexão automática com banco
- Interface clara mostra status da conexão

**Status atual:** ✅ Sistema 100% funcional com backup automático!