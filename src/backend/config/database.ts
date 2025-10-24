import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

if (
  !process.env.DB_HOST ||
  !process.env.DB_PORT ||
  !process.env.DB_NAME ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD
) {
  throw new Error(
    "Les variables d'environnement pour la configuration de la base de données sont manquantes."
  );
}

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000, // Délai avant fermeture d'une connexion inactive
  connectionTimeoutMillis: 2000, // Délai maximum pour établir une connexion
});

// Gestionnaire d'erreurs pour le pool
pool.on("error", (err) => {
  console.error("Erreur inattendue sur le client PostgreSQL:", err);
  process.exit(-1);
});

/**
 * Fonction pour tester la connexion à la base de données
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("Connexion à PostgreSQL réussie:", result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error("Erreur de connexion à PostgreSQL:", error);
    return false;
  }
}

/**
 * Fonction pour fermer proprement le pool de connexions
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log("Pool de connexions PostgreSQL fermé");
}

export default pool;
