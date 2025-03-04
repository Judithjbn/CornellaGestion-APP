import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// 🔹 Configurar CORS correctamente antes de otras reglas
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? "https://cornella-gestio.netlify.app"
    : "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// 🔹 Aplicar CORS antes de cualquier otra configuración
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Manejar preflight requests

// 🔹 Configuración de sesiones (asegurar que esté después de CORS)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecreto",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔹 Middleware para registrar logs de las solicitudes
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // 🔹 Manejo global de errores
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("❌ Error en el servidor:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // 🔹 Servir archivos estáticos o Vite en desarrollo
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // 🔹 Iniciar el servidor
    const port = process.env.PORT || 5000;
    server.listen(
      {
        port: Number(port),
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`🚀 Servidor corriendo en el puerto ${port}`);
      }
    );
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
})();
