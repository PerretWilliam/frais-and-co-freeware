// Cache pour les templates
const templateCache = new Map<string, string>();

/**
 * Charge un template HTML
 */
export async function loadTemplate(templatePath: string): Promise<string> {
  if (templateCache.has(templatePath)) {
    const cached = templateCache.get(templatePath);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${templatePath}`);
    }
    const templateString = await response.text();
    templateCache.set(templatePath, templateString);
    return templateString;
  } catch (error) {
    console.error(`Error loading template ${templatePath}:`, error);
    throw error;
  }
}

/**
 * Remplace les variables dans un template de manière sécurisée
 */
function replaceVariables(
  template: string,
  data: Record<string, unknown>
): string {
  let result = template;

  // Remplacer les variables {{variable}}
  Object.keys(data).forEach((key) => {
    const value = data[key];
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, escapeHtml(String(value)));
  });

  // Nettoyer les variables non remplacées
  result = result.replace(/{{.*?}}/g, "");

  return result;
}

/**
 * Échappe le HTML pour prévenir les injections XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Rend un template avec des données
 */
export async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown>
): Promise<string> {
  const template = await loadTemplate(templatePath);
  return replaceVariables(template, data);
}

/**
 * Rend plusieurs items avec le même template
 */
export async function renderTemplateList<T>(
  templatePath: string,
  items: T[],
  dataMapper: (item: T) => Record<string, unknown>
): Promise<string> {
  const template = await loadTemplate(templatePath);
  return items
    .map((item) => replaceVariables(template, dataMapper(item)))
    .join("");
}

/**
 * Helpers pour le formatage
 */
export const formatHelpers = {
  formatDate: (date: Date | string): string => {
    return new Date(date).toLocaleDateString("fr-FR");
  },

  formatDateTime: (date: Date | string): string => {
    return new Date(date).toLocaleString("fr-FR");
  },

  formatCurrency: (amount: number | string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "0.00 €";
    return `${numAmount.toFixed(2)} €`;
  },
};
