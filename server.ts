import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import {
  serverOptimizeCV,
  serverOptimizeCVStream,
  serverRecalculateAtsScore,
  serverGenerateMoreInterviewQuestions,
  serverEvaluateInterviewAnswer,
  serverGetExpertCareerAdvice,
  serverAuditAtsChecklist,
  generateFallbackOptimizedCV,
} from './server/geminiBackend.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Parse port from CLI arguments or environment variables
  let port = 3000;
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    port = parseInt(process.argv[portIdx + 1], 10);
  } else if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10);
  }

  // Middleware for JSON bodies
  app.use(express.json({ limit: '15mb' }));

  // ==========================================
  // SERVER-SIDE GEMINI API ROUTES (/api/*)
  // ==========================================

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // 2. Otimizar Currículo (Suporte a JSON e Streaming SSE)
  app.post('/api/optimize-cv', async (req, res) => {
    try {
      const { cvText, company, role, jobDesc, linkedinUrl, githubUrl, stream } = req.body;

      if (!cvText || !role || !company) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes (cvText, role, company).' });
      }

      // Se solicitado streaming via SSE
      if (stream || req.headers.accept === 'text/event-stream') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const result = await serverOptimizeCVStream(
          cvText,
          company,
          role,
          jobDesc || '',
          linkedinUrl,
          githubUrl,
          (chunk) => {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
          }
        );

        res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
        return res.end();
      }

      // Resposta padrão JSON
      const result = await serverOptimizeCV(
        cvText,
        company,
        role,
        jobDesc || '',
        linkedinUrl,
        githubUrl
      );

      return res.json(result);
    } catch (error: any) {
      console.error('Erro na rota /api/optimize-cv, acionando gerador de emergência:', error);
      const { cvText, company, role, jobDesc, linkedinUrl, githubUrl } = req.body || {};
      const fallbackResult = generateFallbackOptimizedCV(
        cvText || '',
        company || 'Empresa Alvo',
        role || 'Cargo Alvo',
        jobDesc,
        linkedinUrl,
        githubUrl,
        true
      );
      return res.json(fallbackResult);
    }
  });

  // 3. Recalcular ATS Score
  app.post('/api/recalculate-ats', async (req, res) => {
    try {
      const { currentCvContent, role, company, jobDesc } = req.body;
      if (!currentCvContent) {
        return res.status(400).json({ error: 'currentCvContent é obrigatório.' });
      }

      const scoreDetails = await serverRecalculateAtsScore(
        currentCvContent,
        role || 'Cargo Alvo',
        company || 'Empresa Alvo',
        jobDesc
      );

      return res.json(scoreDetails);
    } catch (error: any) {
      console.error('Erro na rota /api/recalculate-ats:', error);
      return res.status(500).json({ 
        error: error.message || 'Falha ao recalcular pontuação ATS no servidor.' 
      });
    }
  });

  // 4. Gerar Novas Perguntas de Entrevista
  app.post('/api/generate-interview-questions', async (req, res) => {
    try {
      const { role, company, jobDesc, categoryFilter } = req.body;
      const questions = await serverGenerateMoreInterviewQuestions(
        role || 'Cargo Alvo',
        company || 'Empresa Alvo',
        jobDesc,
        categoryFilter
      );
      return res.json(questions);
    } catch (error: any) {
      console.error('Erro na rota /api/generate-interview-questions:', error);
      return res.status(500).json({ 
        error: error.message || 'Falha ao gerar perguntas no servidor.' 
      });
    }
  });

  // 5. Avaliar Resposta da Simulação de Entrevista
  app.post('/api/evaluate-interview-answer', async (req, res) => {
    try {
      const { question, answer, role, company, jobDesc } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: 'Pergunta e resposta são obrigatórias.' });
      }

      const evaluation = await serverEvaluateInterviewAnswer(
        question,
        answer,
        role || 'Cargo Alvo',
        company || 'Empresa Alvo',
        jobDesc
      );

      return res.json(evaluation);
    } catch (error: any) {
      console.error('Erro na rota /api/evaluate-interview-answer:', error);
      return res.status(500).json({ 
        error: error.message || 'Falha ao avaliar resposta no servidor.' 
      });
    }
  });

  // 6. Gerar Dicas e Conselho Estratégico de Carreira
  app.post('/api/expert-career-advice', async (req, res) => {
    try {
      const { role, company, jobDesc, cvText } = req.body;
      const advice = await serverGetExpertCareerAdvice(
        role || 'Cargo Alvo',
        company || 'Empresa Alvo',
        jobDesc,
        cvText
      );
      return res.json(advice);
    } catch (error: any) {
      console.error('Erro na rota /api/expert-career-advice:', error);
      return res.status(500).json({ 
        error: error.message || 'Falha ao gerar conselho de carreira no servidor.' 
      });
    }
  });

  // 7. Auditoria Profunda do Checklist de Compatibilidade ATS com IA
  app.post('/api/audit-ats-checklist', async (req, res) => {
    try {
      const { currentCvContent, role, company, jobDesc } = req.body;
      if (!currentCvContent) {
        return res.status(400).json({ error: 'currentCvContent é obrigatório.' });
      }

      const auditReport = await serverAuditAtsChecklist(
        currentCvContent,
        role || 'Cargo Alvo',
        company || 'Empresa Alvo',
        jobDesc
      );

      return res.json(auditReport);
    } catch (error: any) {
      console.error('Erro na rota /api/audit-ats-checklist:', error);
      return res.status(500).json({ 
        error: error.message || 'Falha na auditoria do checklist no servidor.' 
      });
    }
  });

  // ==========================================
  // WEBSOCKET SUPPORT FOR LIVE API & REALTIME STREAMING
  // ==========================================
  const wss = new WebSocketServer({ server, path: '/ws/live' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Cliente conectado ao WebSocket de Live API / Streaming no servidor.');

    ws.on('message', async (data: string | Buffer) => {
      try {
        const payload = JSON.parse(data.toString());

        // Echo / ping
        if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }

        // Suporte para Live API via Gemini 3.8 Live no servidor
        if (payload.type === 'live_request') {
          const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
          });

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: payload.prompt || 'Olá',
          });

          ws.send(JSON.stringify({
            type: 'live_response',
            text: response.text,
            requestId: payload.requestId,
          }));
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: 'error', error: err.message }));
      }
    });

    ws.on('close', () => {
      console.log('Cliente desconectado do WebSocket do servidor.');
    });
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Elite CV Architect] Servidor Full-Stack rodando em http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Falha fatal ao iniciar o servidor:', err);
  process.exit(1);
});
