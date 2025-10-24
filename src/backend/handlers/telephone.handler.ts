import pool from "../config/database";
import { Telephone, ApiResponse } from "../types";

/**
 * Crée un nouveau numéro de téléphone pour un utilisateur
 */
export async function createTelephone(
  telephoneData: Telephone
): Promise<ApiResponse<Telephone>> {
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO Telephone (indic_pays, indic_region, numero, id_utilisateur)
      VALUES ($1, $2, $3, $4)
      RETURNING id_telephone, indic_pays, indic_region, numero, id_utilisateur
    `;

    const values = [
      telephoneData.indic_pays,
      telephoneData.indic_region,
      telephoneData.numero,
      telephoneData.id_utilisateur,
    ];

    const result = await client.query(query, values);

    return {
      success: true,
      data: result.rows[0],
      message: "Téléphone créé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la création du téléphone:", error);
    return {
      success: false,
      error: "Erreur lors de la création du téléphone",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère tous les téléphones d'un utilisateur
 */
export async function getTelephonesByUtilisateur(
  idUtilisateur: number
): Promise<ApiResponse<Telephone[]>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_telephone, indic_pays, indic_region, numero, id_utilisateur
      FROM Telephone
      WHERE id_utilisateur = $1
      ORDER BY id_telephone
    `;

    const result = await client.query(query, [idUtilisateur]);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des téléphones:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des téléphones",
    };
  } finally {
    client.release();
  }
}

/**
 * Met à jour un numéro de téléphone
 */
export async function updateTelephone(
  id: number,
  telephoneData: Partial<Telephone>
): Promise<ApiResponse<Telephone>> {
  const client = await pool.connect();

  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (telephoneData.indic_pays !== undefined) {
      fields.push(`indic_pays = $${paramIndex++}`);
      values.push(telephoneData.indic_pays);
    }
    if (telephoneData.indic_region !== undefined) {
      fields.push(`indic_region = $${paramIndex++}`);
      values.push(telephoneData.indic_region);
    }
    if (telephoneData.numero !== undefined) {
      fields.push(`numero = $${paramIndex++}`);
      values.push(telephoneData.numero);
    }

    if (fields.length === 0) {
      return {
        success: false,
        error: "Aucune donnée à mettre à jour",
      };
    }

    values.push(id);

    const query = `
      UPDATE Telephone
      SET ${fields.join(", ")}
      WHERE id_telephone = $${paramIndex}
      RETURNING id_telephone, indic_pays, indic_region, numero, id_utilisateur
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Téléphone non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Téléphone mis à jour avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du téléphone:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du téléphone",
    };
  } finally {
    client.release();
  }
}

/**
 * Supprime un numéro de téléphone
 */
export async function deleteTelephone(id: number): Promise<ApiResponse<void>> {
  const client = await pool.connect();

  try {
    const query = `
      DELETE FROM Telephone
      WHERE id_telephone = $1
      RETURNING id_telephone
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Téléphone non trouvé",
      };
    }

    return {
      success: true,
      message: "Téléphone supprimé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du téléphone:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du téléphone",
    };
  } finally {
    client.release();
  }
}
