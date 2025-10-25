import { Utilisateur } from "../../../types/api.types";
import { UserFilterState } from "./users.types";

/**
 * Logique de filtrage des utilisateurs
 */

export class UserFilterUtils {
  /**
   * Filtre les utilisateurs selon les critères
   */
  static filter(users: Utilisateur[], filters: UserFilterState): Utilisateur[] {
    let filtered = [...users];

    // Filtre par recherche
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nom_utilisateur?.toLowerCase().includes(searchLower) ||
          user.prenom?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par rôle
    if (filters.roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === filters.roleFilter);
    }

    return filtered;
  }

  /**
   * Trie les utilisateurs
   */
  static sort(users: Utilisateur[]): Utilisateur[] {
    return users.sort((a, b) => {
      // D'abord les non validés
      if (a.valide !== b.valide) {
        return a.valide ? 1 : -1;
      }
      // Puis par nom
      return (a.nom_utilisateur || "").localeCompare(b.nom_utilisateur || "");
    });
  }
}
