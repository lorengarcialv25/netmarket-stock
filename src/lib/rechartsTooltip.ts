import type { CSSProperties } from "react";

/**
 * Contenedor del tooltip de Recharts (z-index y foco).
 * El contenido visual va en componentes con Tailwind, p. ej. `RechartsTooltipViews`.
 */
export const rechartsTooltipWrapperStyle: CSSProperties = {
  zIndex: 50,
  outline: "none",
};
