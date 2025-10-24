import pool from "../config/database";
import { GrilleTarifaire, ApiResponse } from "../types";

/**
 * Crée ou met à jour un tarif kilométrique pour une cylindrée
 */
export async function upsertTarif(
  tarifData: GrilleTarifaire
): Promise<ApiResponse<GrilleTarifaire>> {
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO GrilleTarifaire (cylindree, tarif_km)
      VALUES ($1, $2)
      ON CONFLICT (cylindree) 
      DO UPDATE SET tarif_km = EXCLUDED.tarif_km
      RETURNING cylindree, tarif_km
    `;

    const values = [tarifData.cylindree, tarifData.tarif_km];

    const result = await client.query(query, values);

    return {
      success: true,
      data: result.rows[0],
      message: "Tarif enregistré avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du tarif:", error);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement du tarif",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère tous les tarifs kilométriques
 */
export async function getAllTarifs(): Promise<ApiResponse<GrilleTarifaire[]>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT cylindree, tarif_km
      FROM GrilleTarifaire
      ORDER BY cylindree
    `;

    const result = await client.query(query);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des tarifs:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des tarifs",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère le tarif kilométrique pour une cylindrée donnée
 */
export async function getTarifByCylindree(
  cylindree: number
): Promise<ApiResponse<GrilleTarifaire>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT cylindree, tarif_km
      FROM GrilleTarifaire
      WHERE cylindree = $1
    `;

    const result = await client.query(query, [cylindree]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Tarif non trouvé pour cette cylindrée",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du tarif:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du tarif",
    };
  } finally {
    client.release();
  }
}

/**
 * Supprime un tarif kilométrique
 */
export async function deleteTarif(
  cylindree: number
): Promise<ApiResponse<void>> {
  const client = await pool.connect();

  try {
    const query = `
      DELETE FROM GrilleTarifaire
      WHERE cylindree = $1
      RETURNING cylindree
    `;

    const result = await client.query(query, [cylindree]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Tarif non trouvé",
      };
    }

    return {
      success: true,
      message: "Tarif supprimé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du tarif:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du tarif",
    };
  } finally {
    client.release();
  }
}

/**
 * Calcule le montant d'un déplacement selon la cylindrée et la distance
 */
export async function calculateDeplacementAmount(
  cylindree: number,
  distanceKm: number
): Promise<ApiResponse<{ montant: number; tarifKm: number }>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT tarif_km
      FROM GrilleTarifaire
      WHERE cylindree = $1
    `;

    const result = await client.query(query, [cylindree]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Aucun tarif défini pour cette cylindrée",
      };
    }

    const tarifKm = parseFloat(result.rows[0].tarif_km);
    const montant = parseFloat((tarifKm * distanceKm).toFixed(2));

    return {
      success: true,
      data: { montant, tarifKm },
    };
  } catch (error) {
    console.error("Erreur lors du calcul du montant:", error);
    return {
      success: false,
      error: "Erreur lors du calcul du montant",
    };
  } finally {
    client.release();
  }
}
