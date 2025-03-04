import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: SelectUser;
}

// 🔹 Middleware que permite tanto JWT como sesiones
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (req.isAuthenticated()) {
    return next(); // Ya está autenticado con sesión
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as SelectUser;
    req.user = decoded;
    next(); // Continuar con la siguiente función
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// 🔹 Crear usuario Admin por defecto si no existe
export async function setupDefaultUser() {
  const existingUser = await storage.getUserByUsername("Admin");
  if (!existingUser) {
    const hashedPassword = await hashPassword("CornellaAtletic1974");
    await storage.createUser({
      username: "Admin",
      password: hashedPassword,
    });
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "development_secret_key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Usuario o contraseña incorrectos" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // 🔹 Login ahora devuelve un token JWT
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: SelectUser, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Error de autenticación" });
      }
      req.login(user, (err: Error) => {
        if (err) return next(err);

        // 🔹 Generar un token JWT
        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET as string,
          { expiresIn: "24h" }
        );

        // 🔹 Enviar token junto con los datos del usuario
        res.json({ token, user: { id: user.id, username: user.username } });
      });
    })(req, res, next);
  });

  // 🔹 Logout: Eliminar sesión
  app.post("/api/logout", (req, res, next) => {
    req.logout((err: Error) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // 🔹 Obtener usuario autenticado
  app.get("/api/user", authMiddleware, (req, res) => {
    if (!req.user) {
      return res.sendStatus(401);
    }
    // Quitar la contraseña del usuario antes de responder
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}