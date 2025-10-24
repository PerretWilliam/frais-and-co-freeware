import pool from "../config/database";
import {
  Utilisateur,
  LoginCredentials,
  LoginResponse,
  ApiResponse,
} from "../types";
import { hashPassword, verifyPassword, generateSalt } from "../utils/crypto";

/**
 * Crée un nouvel utilisateur dans la base de données
 * Le mot de passe est automatiquement hashé et salé
 */
export async function createUtilisateur(
  userData: Utilisateur & { mot_de_passe: string }
): Promise<ApiResponse<Utilisateur>> {
  const client = await pool.connect();

  try {
    // Générer un salt unique pour cet utilisateur
    const salt = generateSalt();

    // Hasher le mot de passe avec AES(bcrypt(salt + password))
    const hashedPassword = await hashPassword(userData.mot_de_passe, salt);

    const query = `
      INSERT INTO Utilisateur (
        nom_utilisateur, prenom, email, mot_de_passe, salt,
        adresse_utilisateur, cp_utilisateur, ville_utilisateur,
        role, valide, plaque, cylindree, marque, modele, type_essence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id_utilisateur, nom_utilisateur, prenom, email, adresse_utilisateur,
                cp_utilisateur, ville_utilisateur, role, valide, plaque,
                cylindree, marque, modele, type_essence
    `;

    const values = [
      userData.nom_utilisateur,
      userData.prenom,
      userData.email,
      hashedPassword,
      salt,
      userData.adresse_utilisateur,
      userData.cp_utilisateur,
      userData.ville_utilisateur,
      userData.role,
      userData.valide || false,
      userData.plaque,
      userData.cylindree,
      userData.marque,
      userData.modele,
      userData.type_essence,
    ];

    const result = await client.query(query, values);

    return {
      success: true,
      data: result.rows[0],
      message: "Utilisateur créé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);

    // Gestion des erreurs spécifiques
    if (error.code === "23505") {
      // Violation de contrainte unique
      if (error.constraint === "utilisateur_email_key") {
        return { success: false, error: "Cet email est déjà utilisé" };
      }
      if (error.constraint === "utilisateur_plaque_key") {
        return {
          success: false,
          error: "Cette plaque d'immatriculation est déjà enregistrée",
        };
      }
    }

    return {
      success: false,
      error: "Erreur lors de la création de l'utilisateur",
    };
  } finally {
    client.release();
  }
}

/**
 * Authentifie un utilisateur avec email et mot de passe
 */
export async function loginUtilisateur(
  credentials: LoginCredentials
): Promise<ApiResponse<LoginResponse>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_utilisateur, nom_utilisateur, prenom, email, mot_de_passe, salt,
             adresse_utilisateur, cp_utilisateur, ville_utilisateur, role, valide,
             plaque, cylindree, marque, modele, type_essence
      FROM Utilisateur
      WHERE email = $1
    `;

    const result = await client.query(query, [credentials.email]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Email ou mot de passe incorrect",
      };
    }

    const user = result.rows[0];

    // Vérifier si l'utilisateur est validé
    if (!user.valide) {
      return {
        success: false,
        error: "Votre compte n'a pas encore été validé par un administrateur",
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(
      credentials.password,
      user.salt,
      user.mot_de_passe
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Email ou mot de passe incorrect",
      };
    }

    // Supprimer les informations sensibles avant de retourner
    delete user.mot_de_passe;
    delete user.salt;

    return {
      success: true,
      data: { utilisateur: user },
      message: "Connexion réussie",
    };
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return {
      success: false,
      error: "Erreur lors de la connexion",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère tous les utilisateurs (sans les mots de passe)
 */
export async function getAllUtilisateurs(): Promise<
  ApiResponse<Utilisateur[]>
> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_utilisateur, nom_utilisateur, prenom, email,
             adresse_utilisateur, cp_utilisateur, ville_utilisateur,
             role, valide, plaque, cylindree, marque, modele, type_essence
      FROM Utilisateur
      ORDER BY nom_utilisateur, prenom
    `;

    const result = await client.query(query);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des utilisateurs",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUtilisateurById(
  id: number
): Promise<ApiResponse<Utilisateur>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_utilisateur, nom_utilisateur, prenom, email,
             adresse_utilisateur, cp_utilisateur, ville_utilisateur,
             role, valide, plaque, cylindree, marque, modele, type_essence
      FROM Utilisateur
      WHERE id_utilisateur = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de l'utilisateur",
    };
  } finally {
    client.release();
  }
}

/**
 * Met à jour un utilisateur
 */
export async function updateUtilisateur(
  id: number,
  userData: Partial<Utilisateur>
): Promise<ApiResponse<Utilisateur>> {
  const client = await pool.connect();

  try {
    // Construire dynamiquement la requête UPDATE
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.nom_utilisateur !== undefined) {
      fields.push(`nom_utilisateur = $${paramIndex++}`);
      values.push(userData.nom_utilisateur);
    }
    if (userData.prenom !== undefined) {
      fields.push(`prenom = $${paramIndex++}`);
      values.push(userData.prenom);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.adresse_utilisateur !== undefined) {
      fields.push(`adresse_utilisateur = $${paramIndex++}`);
      values.push(userData.adresse_utilisateur);
    }
    if (userData.cp_utilisateur !== undefined) {
      fields.push(`cp_utilisateur = $${paramIndex++}`);
      values.push(userData.cp_utilisateur);
    }
    if (userData.ville_utilisateur !== undefined) {
      fields.push(`ville_utilisateur = $${paramIndex++}`);
      values.push(userData.ville_utilisateur);
    }
    if (userData.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(userData.role);
    }
    if (userData.valide !== undefined) {
      fields.push(`valide = $${paramIndex++}`);
      values.push(userData.valide);
    }
    if (userData.plaque !== undefined) {
      fields.push(`plaque = $${paramIndex++}`);
      values.push(userData.plaque);
    }
    if (userData.cylindree !== undefined) {
      fields.push(`cylindree = $${paramIndex++}`);
      values.push(userData.cylindree);
    }
    if (userData.marque !== undefined) {
      fields.push(`marque = $${paramIndex++}`);
      values.push(userData.marque);
    }
    if (userData.modele !== undefined) {
      fields.push(`modele = $${paramIndex++}`);
      values.push(userData.modele);
    }
    if (userData.type_essence !== undefined) {
      fields.push(`type_essence = $${paramIndex++}`);
      values.push(userData.type_essence);
    }

    if (fields.length === 0) {
      return {
        success: false,
        error: "Aucune donnée à mettre à jour",
      };
    }

    values.push(id);

    const query = `
      UPDATE Utilisateur
      SET ${fields.join(", ")}
      WHERE id_utilisateur = $${paramIndex}
      RETURNING id_utilisateur, nom_utilisateur, prenom, email,
                adresse_utilisateur, cp_utilisateur, ville_utilisateur,
                role, valide, plaque, cylindree, marque, modele, type_essence
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Utilisateur mis à jour avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);

    if (error.code === "23505") {
      if (error.constraint === "utilisateur_email_key") {
        return { success: false, error: "Cet email est déjà utilisé" };
      }
      if (error.constraint === "utilisateur_plaque_key") {
        return {
          success: false,
          error: "Cette plaque d'immatriculation est déjà enregistrée",
        };
      }
    }

    return {
      success: false,
      error: "Erreur lors de la mise à jour de l'utilisateur",
    };
  } finally {
    client.release();
  }
}

/**
 * Change le mot de passe d'un utilisateur
 */
export async function changePassword(
  id: number,
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse<void>> {
  const client = await pool.connect();

  try {
    // Récupérer le mot de passe actuel et le salt
    const selectQuery = `
      SELECT mot_de_passe, salt
      FROM Utilisateur
      WHERE id_utilisateur = $1
    `;

    const selectResult = await client.query(selectQuery, [id]);

    if (selectResult.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    const { mot_de_passe, salt } = selectResult.rows[0];

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await verifyPassword(
      oldPassword,
      salt,
      mot_de_passe
    );

    if (!isOldPasswordValid) {
      return {
        success: false,
        error: "L'ancien mot de passe est incorrect",
      };
    }

    // Générer un nouveau salt
    const newSalt = generateSalt();

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await hashPassword(newPassword, newSalt);

    // Mettre à jour le mot de passe
    const updateQuery = `
      UPDATE Utilisateur
      SET mot_de_passe = $1, salt = $2
      WHERE id_utilisateur = $3
    `;

    await client.query(updateQuery, [hashedNewPassword, newSalt, id]);

    return {
      success: true,
      message: "Mot de passe changé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return {
      success: false,
      error: "Erreur lors du changement de mot de passe",
    };
  } finally {
    client.release();
  }
}

/**
 * Supprime un utilisateur
 */
export async function deleteUtilisateur(
  id: number
): Promise<ApiResponse<void>> {
  const client = await pool.connect();

  try {
    const query = `
      DELETE FROM Utilisateur
      WHERE id_utilisateur = $1
      RETURNING id_utilisateur
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      message: "Utilisateur supprimé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression de l'utilisateur",
    };
  } finally {
    client.release();
  }
}

/**
 * Valide un utilisateur (pour les admins)
 */
export async function validateUtilisateur(
  id: number
): Promise<ApiResponse<Utilisateur>> {
  const client = await pool.connect();

  try {
    const query = `
      UPDATE Utilisateur
      SET valide = true
      WHERE id_utilisateur = $1
      RETURNING id_utilisateur, nom_utilisateur, prenom, email,
                adresse_utilisateur, cp_utilisateur, ville_utilisateur,
                role, valide, plaque, cylindree, marque, modele, type_essence
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Utilisateur validé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la validation de l'utilisateur:", error);
    return {
      success: false,
      error: "Erreur lors de la validation de l'utilisateur",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère les utilisateurs non validés
 */
export async function getPendingUtilisateurs(): Promise<
  ApiResponse<Utilisateur[]>
> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_utilisateur, nom_utilisateur, prenom, email,
             adresse_utilisateur, cp_utilisateur, ville_utilisateur,
             role, valide, plaque, cylindree, marque, modele, type_essence
      FROM Utilisateur
      WHERE valide = false
      ORDER BY nom_utilisateur, prenom
    `;

    const result = await client.query(query);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des utilisateurs en attente:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération des utilisateurs en attente",
    };
  } finally {
    client.release();
  }
}
