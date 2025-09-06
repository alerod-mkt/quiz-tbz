import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizResponseSchema } from "@shared/schema";
import { MetricsCollectorHybrid } from "./metrics-hybrid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Quiz response submission endpoint
  app.post("/api/quiz-response", async (req, res) => {
    try {
      const validation = insertQuizResponseSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: validation.error.issues 
        });
      }

      const response = await storage.createQuizResponse(validation.data);
      
      res.json({ 
        success: true, 
        id: response.id,
        message: "Quiz response saved successfully" 
      });
    } catch (error) {
      console.error("Error saving quiz response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get quiz response endpoint
  app.get("/api/quiz-response/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await storage.getQuizResponse(id);
      
      if (!response) {
        return res.status(404).json({ message: "Quiz response not found" });
      }
      
      res.json(response);
    } catch (error) {
      console.error("Error retrieving quiz response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Métricas endpoints com throttling reduzido
  let lastVisitorCall = 0;
  let lastVisitorEtapa = '';
  app.post("/api/metrics/visitor", async (req, res) => {
    try {
      // Throttling reduzido: apenas para mesma etapa em 500ms
      const now = Date.now();
      const { etapa } = req.body;
      
      if (etapa === lastVisitorEtapa && now - lastVisitorCall < 500) {
        console.log(`📋 Throttling visitor: ${etapa} (muito rápido)`);
        return res.json({ success: true, throttled: true });
      }
      
      lastVisitorCall = now;
      lastVisitorEtapa = etapa;
      console.log(`📍 Tracking visitor: ${etapa}`);

      // Capturar IP real do usuário (considerando proxies)
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.headers['x-real-ip'] as string || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      console.log(`🌐 IP capturado: ${ipAddress}`);
      
      await MetricsCollectorHybrid.trackVisitor(etapa, String(ipAddress));
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking visitor:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/session", async (req, res) => {
    try {
      // Capturar IP real do usuário (considerando proxies)
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.headers['x-real-ip'] as string || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      const sessionId = await MetricsCollectorHybrid.startSession(String(ipAddress));
      res.json({ success: true, sessionId });
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  let lastConversionCall = 0;
  let lastConversionKey = '';
  app.post("/api/metrics/conversion", async (req, res) => {
    try {
      // Throttling reduzido: apenas para mesma conversão em 300ms
      const now = Date.now();
      const { etapaOrigem, etapaDestino } = req.body;
      const conversionKey = `${etapaOrigem}->${etapaDestino}`;
      
      if (conversionKey === lastConversionKey && now - lastConversionCall < 300) {
        console.log(`📋 Throttling conversion: ${conversionKey} (muito rápido)`);
        return res.json({ success: true, throttled: true });
      }
      
      lastConversionCall = now;
      lastConversionKey = conversionKey;
      console.log(`🎯 Tracking conversion: ${conversionKey}`);

      // Capturar IP real do usuário (considerando proxies)
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                       req.headers['x-real-ip'] as string || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      await MetricsCollectorHybrid.trackConversion(etapaOrigem, etapaDestino, String(ipAddress));
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking conversion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/quiz-completed", async (req, res) => {
    try {
      const { sessionId, urgencia } = req.body;
      console.log(`🎯 Tracking quiz completed: session ${sessionId}, urgencia ${urgencia}`);
      await MetricsCollectorHybrid.trackQuizCompleted(sessionId, urgencia);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking quiz completion:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/checkout-started", async (req, res) => {
    try {
      const { sessionId } = req.body;
      console.log(`🛒 Tracking checkout started: session ${sessionId}`);
      await MetricsCollectorHybrid.trackPurchase(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking checkout started:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const { periodo, data_especifica, data_inicio, data_fim } = req.query;
      console.log(`📊 Recebendo request para dashboard: periodo=${periodo}, data_especifica=${data_especifica}, data_inicio=${data_inicio}, data_fim=${data_fim}`);
      const metrics = await MetricsCollectorHybrid.getDashboardMetrics(periodo as string, data_especifica as string, data_inicio as string, data_fim as string);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/reset", async (req, res) => {
    try {
      await MetricsCollectorHybrid.resetMetrics();
      res.json({ success: true, message: "Métricas resetadas com sucesso" });
    } catch (error) {
      console.error("Error resetting metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/remove-ip", async (req, res) => {
    try {
      const { ipAddress } = req.body;
      
      if (!ipAddress) {
        return res.status(400).json({ message: "IP address is required" });
      }
      
      await MetricsCollectorHybrid.removeIpFromControl(ipAddress);
      res.json({ success: true, message: `IP ${ipAddress} removido com sucesso` });
    } catch (error) {
      console.error("Error removing IP:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/reset-horarios", async (req, res) => {
    try {
      await MetricsCollectorHybrid.resetHorariosAtividade();
      res.json({ success: true, message: "Horários de atividade resetados com sucesso" });
    } catch (error) {
      console.error("Error resetting hourly metrics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/metrics/abandono", async (req, res) => {
    try {
      const { sessionId, etapa, tipo } = req.body;
      console.log(`⚠️ Registrando abandono: sessionId=${sessionId}, etapa=${etapa}, tipo=${tipo}`);
      
      await MetricsCollectorHybrid.trackAbandono(sessionId, etapa, tipo);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking abandono:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
