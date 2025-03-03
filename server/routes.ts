import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, setupDefaultUser } from "./auth";
import { storage } from "./storage";
import { format } from "date-fns";
import { sendFormSubmissionEmail } from './email';
import { authMiddleware } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Crear usuario por defecto
  await setupDefaultUser();

  // Configurar autenticación
  setupAuth(app);

  // Forms API
  app.get("/api/forms", async (req, res) => {
    const forms = await storage.getForms();
    res.json(forms);
  });

  app.get("/api/forms/:id", async (req, res) => {
    const form = await storage.getForm(parseInt(req.params.id));
    if (!form) return res.status(404).send("Form not found");
    res.json(form);
  });

  app.post("/api/forms", authMiddleware, async (req, res) => {
    try {
      const form = await storage.createForm(req.body);
      res.status(201).json(form);
    } catch (error) {
      res.status(500).json({ error: "Failed to create form" });
    }
  });

  app.put("/api/forms/:id", authMiddleware, async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const form = await storage.updateForm(formId, req.body);
      res.json(form);
    } catch (error) {
      if (error instanceof Error && error.message === "Form not found") {
        res.status(404).json({ error: "Form not found" });
      } else {
        res.status(500).json({ error: "Failed to update form" });
      }
    }
  });

  app.delete("/api/forms/:id", authMiddleware, async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      await storage.deleteForm(formId);
      res.sendStatus(204);
    } catch (error) {
      if (error instanceof Error && error.message === "Form not found") {
        res.status(404).json({ error: "Form not found" });
      } else {
        res.status(500).json({ error: "Failed to delete form" });
      }
    }
  });

  // Form Submissions API
  app.post("/api/forms/:id/submissions", async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const form = await storage.getForm(formId);
      if (!form) return res.status(404).send("Form not found");

      const submission = await storage.createSubmission({
        formId,
        data: req.body,
        submittedAt: new Date().toISOString(),
      });

      // Validar que form.title, req.body y form.fields estén definidos
      if (!form.title || !req.body || !form.fields) {
        throw new Error("Invalid form data");
      }

      // Enviar correo electrónico con las etiquetas de los campos
      await sendFormSubmissionEmail(form.title, req.body, form.fields);

      res.status(201).json(submission);
    } catch (error) {
      console.error('Error submitting form:', error);
      res.status(500).json({ error: 'Failed to submit form' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}