import Handlebars from "handlebars";

// Enregistrer les helpers Handlebars
Handlebars.registerHelper("formatDate", (date: Date | string) => {
  return new Date(date).toLocaleDateString("fr-FR");
});

Handlebars.registerHelper("formatDateTime", (date: Date | string) => {
  return new Date(date).toLocaleString("fr-FR");
});

Handlebars.registerHelper("formatCurrency", (amount: number | string) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0.00 €";
  return `${numAmount.toFixed(2)} €`;
});

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => {
  return a === b;
});

Handlebars.registerHelper("ne", (a: unknown, b: unknown) => {
  return a !== b;
});

Handlebars.registerHelper("gt", (a: number, b: number) => {
  return a > b;
});

Handlebars.registerHelper("lt", (a: number, b: number) => {
  return a < b;
});

Handlebars.registerHelper("or", (...args: unknown[]) => {
  // Le dernier argument est toujours l'objet options de Handlebars
  const values = args.slice(0, -1);
  return values.some((v) => !!v);
});

Handlebars.registerHelper("and", (...args: unknown[]) => {
  // Le dernier argument est toujours l'objet options de Handlebars
  const values = args.slice(0, -1);
  return values.every((v) => !!v);
});

// Cache pour les templates compilés
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Charge et compile un template Handlebars
 */
async function loadAndCompileTemplate(
  templatePath: string
): Promise<HandlebarsTemplateDelegate> {
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
    const compiled = Handlebars.compile(templateString);
    templateCache.set(templatePath, compiled);
    return compiled;
  } catch (error) {
    console.error(`Error loading template ${templatePath}:`, error);
    throw error;
  }
}

/**
 * Rend un template Handlebars avec des données
 */
export async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown> = {}
): Promise<string> {
  const template = await loadAndCompileTemplate(templatePath);
  return template(data);
}

/**
 * Rend plusieurs items avec le même template Handlebars
 */
export async function renderTemplateList<T>(
  templatePath: string,
  items: T[],
  dataMapper: (item: T) => Record<string, unknown>
): Promise<string> {
  const template = await loadAndCompileTemplate(templatePath);
  return items.map((item) => template(dataMapper(item))).join("");
}
