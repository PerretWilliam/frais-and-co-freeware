import { FraisService } from "../../services/frais.service";
import { TarifService } from "../../services/tarif.service";
import { StatutFrais, Chantier, Utilisateur } from "../../types/api.types";
import { FileUploadHandler } from "./nouveau-frais-file-handler";
import { router } from "../router";

/**
 * Gestion de la soumission des formulaires de frais
 */
export class FormSubmitHandler {
  constructor(
    private userId: number,
    private chantiers: Chantier[],
    private utilisateur: Utilisateur | null,
    private fileHandler: FileUploadHandler
  ) {}

  /**
   * Soumet un frais de déplacement
   */
  public async submitDeplacement(formData: FormData): Promise<void> {
    const date = formData.get("date") as string;
    const chantierId = parseInt(formData.get("chantier_id") as string);
    const villeDepart = formData.get("ville_depart") as string;
    const villeArrivee = formData.get("ville_arrivee") as string;
    const distanceKm = parseFloat(formData.get("distance_km") as string);
    const description = formData.get("description") as string;

    if (!this.utilisateur || !this.utilisateur.cylindree) {
      alert("Aucun véhicule enregistré");
      throw new Error("Aucun véhicule");
    }

    // Récupérer le tarif depuis la grille tarifaire basé sur la cylindrée
    const cylindree = this.utilisateur.cylindree;
    const tarifResponse = await TarifService.getByCylindree(cylindree);

    let tarifKm = 0.523; // Tarif par défaut si pas trouvé
    if (tarifResponse.success && tarifResponse.data) {
      tarifKm = tarifResponse.data.tarif_km;
    } else {
      console.warn(
        `Tarif non trouvé pour cylindrée ${cylindree}, utilisation du tarif par défaut`
      );
    }

    const montant = distanceKm * tarifKm;

    // Trouver le chantier pour obtenir la ville
    const chantier = this.chantiers.find((c) => c.id_chantier === chantierId);
    const lieu = chantier?.ville_chantier || villeArrivee;

    const fraisData = {
      lieu: description || lieu,
      date: new Date(date),
      montant,
      justificatif: Buffer.from(""), // Pas de justificatif pour déplacement
      statut: StatutFrais.BROUILLON,
      id_utilisateur: this.userId,
      id_chantier: chantierId,
      ville_depart: villeDepart,
      ville_arrivee: villeArrivee,
      distance_km: distanceKm,
      id_voiture: this.userId, // Utiliser l'ID de l'utilisateur
    };

    const response = await FraisService.createDeplacement(fraisData);

    if (response.success) {
      alert("Frais de déplacement créé avec succès !");
      router.navigate("/mes-frais");
    } else {
      alert(`Erreur: ${response.error || "Erreur inconnue"}`);
      throw new Error(response.error);
    }
  }

  /**
   * Soumet un frais de repas
   */
  public async submitRepas(formData: FormData): Promise<void> {
    const date = formData.get("date") as string;
    const chantierId = parseInt(formData.get("chantier_id") as string);
    const montant = parseFloat(formData.get("montant") as string);
    const description = formData.get("description") as string;

    // Récupérer le fichier uploadé
    const file = this.fileHandler.getFile("repas");
    if (!file) {
      alert("Veuillez ajouter un justificatif");
      throw new Error("Pas de justificatif");
    }

    // Convertir le fichier en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Trouver le chantier pour obtenir la ville
    const chantier = this.chantiers.find((c) => c.id_chantier === chantierId);
    const lieu = chantier?.ville_chantier || "Non spécifié";

    const fraisData = {
      lieu: description || `Repas - ${lieu}`,
      date: new Date(date),
      montant,
      justificatif: buffer,
      statut: StatutFrais.BROUILLON,
      id_utilisateur: this.userId,
      id_chantier: chantierId,
      type_repas: "midi", // Valeur par défaut
    };

    const response = await FraisService.createRepas(fraisData);

    if (response.success) {
      alert("Frais de repas créé avec succès !");
      router.navigate("/mes-frais");
    } else {
      alert(`Erreur: ${response.error || "Erreur inconnue"}`);
      throw new Error(response.error);
    }
  }

  /**
   * Soumet un frais d'hébergement
   */
  public async submitHebergement(formData: FormData): Promise<void> {
    const dateDebut = formData.get("date_debut") as string;
    const dateFin = formData.get("date_fin") as string;
    const nuits = parseInt(formData.get("nuits") as string);
    const chantierId = parseInt(formData.get("chantier_id") as string);
    const montant = parseFloat(formData.get("montant") as string);
    const description = formData.get("description") as string;

    // Récupérer le fichier uploadé
    const file = this.fileHandler.getFile("hebergement");
    if (!file) {
      alert("Veuillez ajouter un justificatif");
      throw new Error("Pas de justificatif");
    }

    // Convertir le fichier en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Trouver le chantier pour obtenir la ville
    const chantier = this.chantiers.find((c) => c.id_chantier === chantierId);
    const lieu = chantier?.ville_chantier || "Hébergement";

    const fraisData = {
      lieu: description || `Hébergement - ${lieu}`,
      date: new Date(dateDebut), // Date de début comme date du frais
      montant,
      justificatif: buffer,
      statut: StatutFrais.BROUILLON,
      id_utilisateur: this.userId,
      id_chantier: chantierId,
      nb_nuits: nuits,
      date_debut: new Date(dateDebut),
      date_fin: new Date(dateFin),
      nom_etablissement: description || "Hébergement", // Utiliser la description comme nom
    };

    const response = await FraisService.createHebergement(fraisData);

    if (response.success) {
      alert("Frais d'hébergement créé avec succès !");
      router.navigate("/mes-frais");
    } else {
      alert(`Erreur: ${response.error || "Erreur inconnue"}`);
      throw new Error(response.error);
    }
  }
}
