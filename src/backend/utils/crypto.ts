import * as bcrypt from "bcryptjs";
import * as CryptoJS from "crypto-js";
import * as crypto from "crypto";

if (!process.env.AES_SECRET_KEY) {
  throw new Error("La variable d'environnement AES_SECRET_KEY est manquante.");
}

// Clé secrète pour AES (devrait être dans les variables d'environnement)
const SECRET_KEY = process.env.AES_SECRET_KEY;

/**
 * Génère un salt aléatoire unique pour chaque utilisateur
 * @returns Salt en format hexadécimal
 */
export function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash un mot de passe avec bcrypt et salt utilisateur, puis chiffre avec AES
 * Équivalent à: AES(bcrypt($perUserSalt, $pwd), $secretKey)
 * @param password - Mot de passe en clair
 * @param userSalt - Salt unique de l'utilisateur
 * @returns Mot de passe hashé et chiffré
 */
export async function hashPassword(
  password: string,
  userSalt: string
): Promise<string> {
  try {
    // Étape 1: Combiner le mot de passe avec le salt utilisateur
    const saltedPassword = userSalt + password;

    // Étape 2: Hash avec bcrypt (10 rounds)
    const bcryptHash = await bcrypt.hash(saltedPassword, 10);

    // Étape 3: Chiffrer le hash bcrypt avec AES
    const encrypted = CryptoJS.AES.encrypt(bcryptHash, SECRET_KEY).toString();

    return encrypted;
  } catch (error) {
    console.error("Erreur lors du hashing du mot de passe:", error);
    throw new Error("Erreur lors du hashing du mot de passe");
  }
}

/**
 * Vérifie un mot de passe en le comparant au hash stocké
 * @param password - Mot de passe en clair à vérifier
 * @param userSalt - Salt unique de l'utilisateur
 * @param hashedPassword - Mot de passe hashé et chiffré stocké en BDD
 * @returns true si le mot de passe correspond, false sinon
 */
export async function verifyPassword(
  password: string,
  userSalt: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Étape 1: Déchiffrer le hash AES
    const decrypted = CryptoJS.AES.decrypt(hashedPassword, SECRET_KEY);
    const bcryptHash = decrypted.toString(CryptoJS.enc.Utf8);

    if (!bcryptHash) {
      console.error("Erreur lors du déchiffrement du mot de passe");
      return false;
    }

    // Étape 2: Combiner le mot de passe fourni avec le salt utilisateur
    const saltedPassword = userSalt + password;

    // Étape 3: Comparer avec bcrypt
    const isMatch = await bcrypt.compare(saltedPassword, bcryptHash);

    return isMatch;
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe:", error);
    return false;
  }
}
