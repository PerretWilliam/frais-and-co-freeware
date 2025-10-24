import pool from "../config/database";
import {
  Frais,
  FraisDeplacement,
  FraisRepas,
  FraisHebergement,
  ApiResponse,
  StatutFrais,
} from "../types";
import { calculateDeplacementAmount } from "./grille-tarifaire.handler";

/**
 * Crée un nouveau frais de déplacement
 */
export async function createFraisDeplacement(
  fraisData: Omit<FraisDeplacement, "id_deplacement" | "montant">
): Promise<ApiResponse<FraisDeplacement>> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Récupérer la cylindrée du véhicule
    const vehiculeQuery = `
      SELECT cylindree FROM Utilisateur WHERE id_utilisateur = $1
    `;
    const vehiculeResult = await client.query(vehiculeQuery, [
      fraisData.id_voiture,
    ]);

    if (vehiculeResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Véhicule non trouvé" };
    }

    const cylindree = vehiculeResult.rows[0].cylindree;

    // Calculer le montant selon la grille tarifaire
    const calculResult = await calculateDeplacementAmount(
      cylindree,
      fraisData.distance_km
    );

    if (!calculResult.success || !calculResult.data) {
      await client.query("ROLLBACK");
      return { success: false, error: calculResult.error };
    }

    const montant = calculResult.data.montant;

    // Insérer le frais de base
    const fraisQuery = `
      INSERT INTO Frais (lieu, date, montant, justificatif, statut, id_utilisateur, id_chantier)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_frais
    `;

    const fraisValues = [
      fraisData.lieu,
      fraisData.date,
      montant,
      fraisData.justificatif,
      fraisData.statut,
      fraisData.id_utilisateur,
      fraisData.id_chantier,
    ];

    const fraisResult = await client.query(fraisQuery, fraisValues);
    const idFrais = fraisResult.rows[0].id_frais;

    // Insérer le frais de déplacement
    const deplacementQuery = `
      INSERT INTO FraisDeplacement (id_deplacement, ville_depart, ville_arrivee, distance_km, id_voiture)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_deplacement
    `;

    const deplacementValues = [
      idFrais,
      fraisData.ville_depart,
      fraisData.ville_arrivee,
      fraisData.distance_km,
      fraisData.id_voiture,
    ];

    await client.query(deplacementQuery, deplacementValues);

    await client.query("COMMIT");

    return {
      success: true,
      data: {
        id_deplacement: idFrais,
        ...fraisData,
        montant,
      },
      message: "Frais de déplacement créé avec succès",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la création du frais de déplacement:", error);
    return {
      success: false,
      error: "Erreur lors de la création du frais de déplacement",
    };
  } finally {
    client.release();
  }
}

/**
 * Crée un nouveau frais de repas
 */
export async function createFraisRepas(
  fraisData: Omit<FraisRepas, "id_repas">
): Promise<ApiResponse<FraisRepas>> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insérer le frais de base
    const fraisQuery = `
      INSERT INTO Frais (lieu, date, montant, justificatif, statut, id_utilisateur, id_chantier)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_frais
    `;

    const fraisValues = [
      fraisData.lieu,
      fraisData.date,
      fraisData.montant,
      fraisData.justificatif,
      fraisData.statut,
      fraisData.id_utilisateur,
      fraisData.id_chantier,
    ];

    const fraisResult = await client.query(fraisQuery, fraisValues);
    const idFrais = fraisResult.rows[0].id_frais;

    // Insérer le frais de repas
    const repasQuery = `
      INSERT INTO FraisRepas (id_repas, type_repas)
      VALUES ($1, $2)
      RETURNING id_repas
    `;

    await client.query(repasQuery, [idFrais, fraisData.type_repas]);

    await client.query("COMMIT");

    return {
      success: true,
      data: {
        id_repas: idFrais,
        ...fraisData,
      },
      message: "Frais de repas créé avec succès",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la création du frais de repas:", error);
    return {
      success: false,
      error: "Erreur lors de la création du frais de repas",
    };
  } finally {
    client.release();
  }
}

/**
 * Crée un nouveau frais d'hébergement
 */
export async function createFraisHebergement(
  fraisData: Omit<FraisHebergement, "id_hebergement">
): Promise<ApiResponse<FraisHebergement>> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insérer le frais de base
    const fraisQuery = `
      INSERT INTO Frais (lieu, date, montant, justificatif, statut, id_utilisateur, id_chantier)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_frais
    `;

    const fraisValues = [
      fraisData.lieu,
      fraisData.date,
      fraisData.montant,
      fraisData.justificatif,
      fraisData.statut,
      fraisData.id_utilisateur,
      fraisData.id_chantier,
    ];

    const fraisResult = await client.query(fraisQuery, fraisValues);
    const idFrais = fraisResult.rows[0].id_frais;

    // Insérer le frais d'hébergement
    const hebergementQuery = `
      INSERT INTO FraisHebergement (id_hebergement, nb_nuits, date_debut, date_fin, nom_etablissement)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_hebergement
    `;

    const hebergementValues = [
      idFrais,
      fraisData.nb_nuits,
      fraisData.date_debut,
      fraisData.date_fin,
      fraisData.nom_etablissement,
    ];

    await client.query(hebergementQuery, hebergementValues);

    await client.query("COMMIT");

    return {
      success: true,
      data: {
        id_hebergement: idFrais,
        ...fraisData,
      },
      message: "Frais d'hébergement créé avec succès",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erreur lors de la création du frais d'hébergement:", error);
    return {
      success: false,
      error: "Erreur lors de la création du frais d'hébergement",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère tous les frais d'un utilisateur
 */
export async function getFraisByUtilisateur(
  idUtilisateur: number
): Promise<ApiResponse<Frais[]>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT f.*, c.nom_chantier, c.ville_chantier
      FROM Frais f
      JOIN Chantier c ON f.id_chantier = c.id_chantier
      WHERE f.id_utilisateur = $1
      ORDER BY f.date DESC
    `;

    const result = await client.query(query, [idUtilisateur]);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des frais:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des frais",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère tous les frais avec filtres optionnels
 */
export async function getAllFrais(filters?: {
  statut?: StatutFrais;
  idUtilisateur?: number;
  idChantier?: number;
  dateDebut?: Date;
  dateFin?: Date;
}): Promise<ApiResponse<Frais[]>> {
  const client = await pool.connect();

  try {
    let query = `
      SELECT f.*, 
             u.nom_utilisateur, u.prenom,
             c.nom_chantier, c.ville_chantier
      FROM Frais f
      JOIN Utilisateur u ON f.id_utilisateur = u.id_utilisateur
      JOIN Chantier c ON f.id_chantier = c.id_chantier
      WHERE 1=1
    `;

    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters?.statut) {
      query += ` AND f.statut = $${paramIndex++}`;
      values.push(filters.statut);
    }

    if (filters?.idUtilisateur) {
      query += ` AND f.id_utilisateur = $${paramIndex++}`;
      values.push(filters.idUtilisateur);
    }

    if (filters?.idChantier) {
      query += ` AND f.id_chantier = $${paramIndex++}`;
      values.push(filters.idChantier);
    }

    if (filters?.dateDebut) {
      query += ` AND f.date >= $${paramIndex++}`;
      values.push(filters.dateDebut);
    }

    if (filters?.dateFin) {
      query += ` AND f.date <= $${paramIndex++}`;
      values.push(filters.dateFin);
    }

    query += ` ORDER BY f.date DESC`;

    const result = await client.query(query, values);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des frais:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des frais",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère le détail d'un frais de déplacement
 */
export async function getFraisDeplacementById(
  id: number
): Promise<ApiResponse<FraisDeplacement>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT f.*, fd.ville_depart, fd.ville_arrivee, fd.distance_km, fd.id_voiture,
             u.nom_utilisateur, u.prenom, u.marque, u.modele, u.plaque,
             c.nom_chantier, c.ville_chantier
      FROM Frais f
      JOIN FraisDeplacement fd ON f.id_frais = fd.id_deplacement
      JOIN Utilisateur u ON f.id_utilisateur = u.id_utilisateur
      JOIN Chantier c ON f.id_chantier = c.id_chantier
      WHERE f.id_frais = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Frais de déplacement non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du frais de déplacement:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération du frais de déplacement",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère le détail d'un frais de repas
 */
export async function getFraisRepasById(
  id: number
): Promise<ApiResponse<FraisRepas>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT f.*, fr.type_repas,
             u.nom_utilisateur, u.prenom,
             c.nom_chantier, c.ville_chantier
      FROM Frais f
      JOIN FraisRepas fr ON f.id_frais = fr.id_repas
      JOIN Utilisateur u ON f.id_utilisateur = u.id_utilisateur
      JOIN Chantier c ON f.id_chantier = c.id_chantier
      WHERE f.id_frais = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Frais de repas non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du frais de repas:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération du frais de repas",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère le détail d'un frais d'hébergement
 */
export async function getFraisHebergementById(
  id: number
): Promise<ApiResponse<FraisHebergement>> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT f.*, fh.nb_nuits, fh.date_debut, fh.date_fin, fh.nom_etablissement,
             u.nom_utilisateur, u.prenom,
             c.nom_chantier, c.ville_chantier
      FROM Frais f
      JOIN FraisHebergement fh ON f.id_frais = fh.id_hebergement
      JOIN Utilisateur u ON f.id_utilisateur = u.id_utilisateur
      JOIN Chantier c ON f.id_chantier = c.id_chantier
      WHERE f.id_frais = $1
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Frais d'hébergement non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du frais d'hébergement:",
      error
    );
    return {
      success: false,
      error: "Erreur lors de la récupération du frais d'hébergement",
    };
  } finally {
    client.release();
  }
}

/**
 * Met à jour le statut d'un frais
 */
export async function updateFraisStatut(
  id: number,
  statut: StatutFrais
): Promise<ApiResponse<Frais>> {
  const client = await pool.connect();

  try {
    const query = `
      UPDATE Frais
      SET statut = $1
      WHERE id_frais = $2
      RETURNING *
    `;

    const result = await client.query(query, [statut, id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Frais non trouvé",
      };
    }

    return {
      success: true,
      data: result.rows[0],
      message: "Statut du frais mis à jour avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du statut",
    };
  } finally {
    client.release();
  }
}

/**
 * Supprime un frais (cascade sur les tables spécialisées)
 */
export async function deleteFrais(id: number): Promise<ApiResponse<void>> {
  const client = await pool.connect();

  try {
    const query = `
      DELETE FROM Frais
      WHERE id_frais = $1
      RETURNING id_frais
    `;

    const result = await client.query(query, [id]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Frais non trouvé",
      };
    }

    return {
      success: true,
      message: "Frais supprimé avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du frais:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du frais",
    };
  } finally {
    client.release();
  }
}

/**
 * Récupère les statistiques des frais par utilisateur
 */
export async function getFraisStatsByUtilisateur(
  idUtilisateur: number
): Promise<
  ApiResponse<{
    total: number;
    parStatut: Record<StatutFrais, number>;
    montantTotal: number;
  }>
> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(montant) as montant_total,
        statut,
        COUNT(*) FILTER (WHERE statut = 'Brouillon') as brouillon,
        COUNT(*) FILTER (WHERE statut = 'EnCours') as en_cours,
        COUNT(*) FILTER (WHERE statut = 'PaiementEnCours') as paiement_en_cours,
        COUNT(*) FILTER (WHERE statut = 'Paye') as paye,
        COUNT(*) FILTER (WHERE statut = 'Refuse') as refuse
      FROM Frais
      WHERE id_utilisateur = $1
      GROUP BY statut
    `;

    const result = await client.query(query, [idUtilisateur]);

    let total = 0;
    let montantTotal = 0;
    const parStatut: Record<string, number> = {
      Brouillon: 0,
      EnCours: 0,
      PaiementEnCours: 0,
      Paye: 0,
      Refuse: 0,
    };

    result.rows.forEach((row) => {
      total += parseInt(row.total);
      montantTotal += parseFloat(row.montant_total || 0);
      parStatut[row.statut] = parseInt(row.total);
    });

    return {
      success: true,
      data: {
        total,
        parStatut: parStatut as Record<StatutFrais, number>,
        montantTotal,
      },
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des statistiques",
    };
  } finally {
    client.release();
  }
}
