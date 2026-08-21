import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ Message: "No autenticado." });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ Message: "Sesión inválida o expirada." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ Message: "No tiene permisos de administrador." });
  }
  next();
}

export function requirePermission(area, modulo) {
  return (req, res, next) => {
    if (req.user?.isAdmin) return next();
    const permitido = (req.user?.permisos || []).some((p) => p.area === area && p.modulo === modulo);
    if (!permitido) {
      return res.status(403).json({ Message: "No tiene permiso para usar este módulo." });
    }
    next();
  };
}
