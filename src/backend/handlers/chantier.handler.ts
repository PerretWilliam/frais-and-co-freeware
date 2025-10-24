import pool from "../config/database";
import { Chantier, ApiResponse } from "../types";

/**
 * Crée un nouveau chantier
 */
export async function createChantier(
  chantierData: Chantier
): Promise<ApiResponse<Chantier>> {
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO Chantier (nom_chantier, adresse_chantier, cp_chantier, ville_chantier)
      VALUES ($1, $2, $3, $4)
      RETURNING id_chantier, nom_chantier, adresse_chantier, cp_chantier, ville_chantier
    `;

    const values = [
      chantierData.nom_chantier,
      chantierData.adresse_chantier,
      chantierData.cp_chantier,
      chantierData.ville_chantier,
    ];

    const result = await client.query(query, values);

    return {
      success: true,
      data: result.rows[0],
      message: "Chantier créé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la création du chantier:", error);
    return {
      success: false,
      error: "Erreur lors de la création du chantier",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère tous les chantiers
 */
export async function getAllChantiers(): Promise<ApiResponse<Chantier[]>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_chantier, nom_chantier, adresse_chantier, cp_chantier, ville_chantier
      FROM Chantier
      ORDER BY nom_chantier
    `;

    const result = await client.query(query);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des chantiers:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des chantiers",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère un chantier par son ID
 */
export async function getChantierById(
  id: number
): Promise<ApiResponse<Chantier>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_chantier, nom_chantier, adresse_chantier, cp_chantier, ville_chantier
      FROM Chantier
      WHERE id_chantier = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Chantier non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du chantier:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du chantier",
    };
  } finally {
    client.release();
  }
}

/**
 * Met à jour un chantier
 */
export async function updateChantier(
  id: number,
  chantierData: Partial<Chantier>
): Promise<ApiResponse<Chantier>> {
  const client = await pool.connect();

  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (chantierData.nom_chantier !== undefined) {
      fields.push(`nom_chantier = $${paramIndex++}`);
      values.push(chantierData.nom_chantier);
    }
    if (chantierData.adresse_chantier !== undefined) {
      fields.push(`adresse_chantier = $${paramIndex++}`);
      values.push(chantierData.adresse_chantier);
    }
    if (chantierData.cp_chantier !== undefined) {
      fields.push(`cp_chantier = $${paramIndex++}`);
      values.push(chantierData.cp_chantier);
    }
    if (chantierData.ville_chantier !== undefined) {
      fields.push(`ville_chantier = $${paramIndex++}`);
      values.push(chantierData.ville_chantier);
    }

    if (fields.length === 0) {
      return {
        success: false,
        error: "Aucune donnée à mettre à jour",
      };
    }

    values.push(id);

    const query = `
      UPDATE Chantier
      SET ${fields.join(", ")}
      WHERE id_chantier = $${paramIndex}
      RETURNING id_chantier, nom_chantier, adresse_chantier, cp_chantier, ville_chantier
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Chantier non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Chantier mis à jour avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du chantier:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du chantier",
    };
  } finally {
    client.release();
  }
}

/**
 * Supprime un chantier
 */
export async function deleteChantier(id: number): Promise<ApiResponse<void>> {
  const client = await pool.connect();

  try {
    const query = `
      DELETE FROM Chantier
      WHERE id_chantier = $1
      RETURNING id_chantier
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Chantier non trouvé",
      };
    }

    return {
      success: true,
      message: "Chantier supprimé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du chantier:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du chantier",
    };
  } finally {
    client.release();
  }
}

/**
 * Recherche des chantiers par nom ou ville
 */
export async function searchChantiers(
  searchTerm: string
): Promise<ApiResponse<Chantier[]>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id_chantier, nom_chantier, adresse_chantier, cp_chantier, ville_chantier
      FROM Chantier
      WHERE nom_chantier ILIKE $1 OR ville_chantier ILIKE $1
      ORDER BY nom_chantier
    `;

    const result = await client.query(query, [`%${searchTerm}%`]);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la recherche de chantiers:", error);
    return {
      success: false,
      error: "Erreur lors de la recherche de chantiers",
    };
  } finally {
    client.release();
  }
}
