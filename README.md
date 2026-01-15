# AI Recruiter Simulator

Sistema de simulação de triagem de currículos usando Inteligência Artificial. O sistema simula três perspectivas diferentes: um ATS (Applicant Tracking System), um recrutador técnico e um recrutador de RH.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Backend](#backend)
  - [Tecnologias](#tecnologias)
  - [Estrutura do Projeto](#estrutura-do-projeto)
  - [Configuração](#configuração)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
  - [Endpoints](#endpoints)
  - [Como Funciona](#como-funciona)
  - [Documentação Swagger](#documentação-swagger)
- [Frontend](#frontend)
  - *Em desenvolvimento...*

---

## 🎯 Visão Geral

Este projeto permite que candidatos simulem como seus currículos seriam avaliados por sistemas automatizados e recrutadores. A IA analisa o currículo e retorna:

- **Score ATS** (0-100): Pontuação do sistema de triagem automatizado
- **Análise de Keywords**: Palavras-chave encontradas e faltantes
- **Avaliação Técnica**: Pontos fortes, riscos e senioridade percebida
- **Avaliação de RH**: Comunicação, clareza e sinais de alerta
- **Decisão Final**: AVANÇA, TALVEZ ou REPROVA
- **Sugestões**: Melhorias recomendadas para o currículo

---

## 🔧 Backend

### Tecnologias

O backend foi construído com:

- **NestJS** (v11.0.1): Framework Node.js para aplicações escaláveis
- **TypeScript**: Linguagem principal
- **OpenAI API**: Integração com LLM (GPT-4o-mini) para análise
- **Swagger/OpenAPI**: Documentação automática da API
- **pdf-parse**: Extração de texto de arquivos PDF
- **class-validator**: Validação de dados de entrada
- **axios**: Cliente HTTP para chamadas à API OpenAI

### Estrutura do Projeto

```
backend/
├── src/
│   ├── main.ts                    # Ponto de entrada da aplicação
│   ├── app.module.ts              # Módulo principal
│   ├── app.controller.ts          # Controller de health check
│   ├── app.service.ts             # Serviço básico
│   └── simulate/                   # Módulo de simulação
│       ├── simulate.controller.ts # Controller dos endpoints
│       ├── simulate.service.ts     # Lógica de negócio e integração com LLM
│       ├── simulate.dto.ts        # DTOs de validação e tipos
│       └── pdf-extract.service.ts # Serviço de extração de PDF
├── test/                           # Testes e2e
├── .env                            # Variáveis de ambiente (não commitado)
└── package.json                    # Dependências e scripts
```

### Configuração

#### 1. Instalar Dependências

```bash
cd backend
npm install
```

#### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` com o seguinte conteúdo:

```env
# Porta do servidor NestJS
PORT=3000

# URL do frontend para configuração de CORS
FRONTEND_URL=http://localhost:4200

# Configurações da API de LLM (OpenAI)
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=sua-chave-openai-aqui
LLM_MODEL=gpt-4o-mini
```

**Importante**: 
- Obtenha sua chave da OpenAI em: https://platform.openai.com/api-keys
- A chave deve começar com `sk-proj-` ou `sk-`
- Nunca commite o arquivo `.env` no Git

#### 3. Executar o Servidor

```bash
# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

O servidor estará disponível em `http://localhost:3000`

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório | Padrão |
|----------|-----------|-------------|--------|
| `PORT` | Porta do servidor | Não | `3000` |
| `FRONTEND_URL` | URL do frontend para CORS | Não | `*` (todos) |
| `LLM_API_URL` | URL da API OpenAI | Não | `https://api.openai.com/v1/chat/completions` |
| `LLM_API_KEY` | Chave de API da OpenAI | **Sim** | - |
| `LLM_MODEL` | Modelo da OpenAI a usar | Não | `gpt-4o-mini` |

### Endpoints

#### 1. Health Check

```http
GET /health
```

Retorna o status da API:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "ai-recruiter-simulator",
  "version": "1.0.0"
}
```

#### 2. Simulação com Texto

```http
POST /simulate
Content-Type: application/json
```

**Body:**
```json
{
  "jobTitle": "Frontend Developer",
  "jobDescription": "Desenvolver interfaces modernas com React e TypeScript",
  "experienceLevel": "Pleno",
  "resumeText": "Desenvolvedor com 3 anos de experiência em React..."
}
```

**Validações:**
- `jobTitle`: obrigatório, string não vazia
- `jobDescription`: opcional
- `experienceLevel`: obrigatório, deve ser `"Júnior"`, `"Pleno"` ou `"Sênior"`
- `resumeText`: obrigatório, string não vazia

**Resposta (200 OK):**
```json
{
  "atsScore": 75,
  "atsAnalysis": {
    "keywordsMatched": ["React", "TypeScript"],
    "keywordsMissing": ["Node.js", "AWS"]
  },
  "technicalEvaluation": {
    "strengths": ["Experiência em React", "Conhecimento em TypeScript"],
    "risks": ["Falta de experiência em testes"],
    "perceivedSeniority": "Pleno"
  },
  "hrEvaluation": {
    "communication": "Adequada",
    "clarity": "Moderada",
    "redFlags": []
  },
  "finalDecision": {
    "decision": "TALVEZ",
    "justification": "Candidato possui experiência relevante..."
  },
  "resumeSuggestions": [
    "Incluir exemplos de projetos...",
    "Especificar experiência em frontend..."
  ]
}
```

#### 3. Simulação com Upload de PDF

```http
POST /simulate/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `resume`: arquivo PDF (obrigatório, máx. 10MB)
- `jobTitle`: string (obrigatório)
- `jobDescription`: string (opcional)
- `experienceLevel`: `"Júnior"` | `"Pleno"` | `"Sênior"` (obrigatório)

**Validações do PDF:**
- Formato: apenas PDF
- Tamanho máximo: 10MB
- Deve conter texto (mínimo 50 caracteres)
- Validação de header do arquivo

**Resposta:** Mesma estrutura do endpoint `/simulate`

**Erros Comuns:**
- `400`: Arquivo inválido, muito grande ou sem texto suficiente
- `400`: Dados de entrada inválidos
- `502`: Erro na comunicação com a API de LLM

### Como Funciona

#### Fluxo de Processamento

1. **Recebimento da Requisição**
   - Validação dos dados de entrada (DTOs)
   - Se for PDF, extração do texto

2. **Montagem do Prompt**
   - O `SimulateService` monta um prompt estruturado
   - Inclui informações da vaga e do currículo
   - Define o papel da IA (ATS + Recrutador Técnico + RH)

3. **Chamada à API OpenAI**
   - Envia o prompt para o modelo configurado
   - Usa `response_format: { type: 'json_object' }` para garantir JSON
   - Temperature: 0.3 (respostas mais consistentes)

4. **Processamento da Resposta**
   - Parse do JSON retornado
   - Validação da estrutura
   - Limpeza de markdown code blocks (se houver)

5. **Retorno ao Cliente**
   - Resposta estruturada com todas as análises
   - Logs registrados para debug

#### Arquitetura dos Serviços

**SimulateService:**
- Responsável pela lógica principal de simulação
- Monta o prompt baseado no template
- Faz a chamada à API OpenAI
- Processa e valida a resposta

**PdfExtractService:**
- Extrai texto de arquivos PDF
- Valida formato e tamanho
- Trata erros de parsing

**SimulateController:**
- Recebe requisições HTTP
- Valida dados com DTOs
- Orquestra chamadas aos serviços
- Retorna respostas formatadas

### Documentação Swagger

A API possui documentação interativa via Swagger:

**Acesse:** `http://localhost:3000/api`

No Swagger você pode:
- Ver todos os endpoints disponíveis
- Ver exemplos de requisição e resposta
- Testar os endpoints diretamente no navegador
- Ver validações e tipos de dados

### Logging

O sistema possui logging estruturado:

- **Início de simulação**: Registra vaga e nível
- **Extração de PDF**: Registra tamanho do arquivo
- **Conclusão**: Registra score ATS e decisão final
- **Erros**: Stack trace completo para debug

Logs aparecem no console quando o servidor está rodando.

### Tratamento de Erros

O sistema trata os seguintes erros:

- **400 Bad Request**: Dados inválidos, PDF inválido, arquivo muito grande
- **500 Internal Server Error**: Erro genérico no processamento
- **502 Bad Gateway**: Erro na comunicação com a API OpenAI

Todas as mensagens de erro são claras e ajudam no debug.

---

## 📝 Licença

Este projeto é de uso pessoal/educacional.
