# Structure des Templates

## Organisation

Les templates sont maintenant organisés dans une structure hiérarchique claire :

```
templates/
├── pages/              # Templates de pages principales
│   ├── help/          # Sous-pages d'aide
│   ├── dashboard-*.tpl.html
│   ├── help-page.tpl.html
│   ├── sites-page.tpl.html
│   ├── my-expenses-page.tpl.html
│   ├── all-expenses-page.tpl.html
│   ├── new-expense-page.tpl.html
│   ├── users-page.tpl.html
│   ├── vehicles-page.tpl.html
│   ├── rates-page.tpl.html
│   ├── settings-page.tpl.html
│   ├── profile-page.tpl.html
│   └── emails-page.tpl.html
│
├── components/         # Composants réutilisables par domaine
│   ├── sites/         # Composants pour les chantiers
│   ├── expenses/      # Composants pour les frais
│   ├── users/         # Composants pour les utilisateurs
│   ├── vehicles/      # Composants pour les véhicules
│   ├── rates/         # Composants pour les tarifs
│   └── emails/        # Composants pour les emails
│
├── layout/            # Composants de mise en page
│   ├── header.tpl.html
│   ├── header-dropdown.tpl.html
│   ├── sidebar.tpl.html
│   ├── sidebar-menu-item.tpl.html
│   └── footer.tpl.html
│
└── common/            # Composants communs réutilisables
    ├── alert-*.tpl.html
    ├── empty-*.tpl.html
    ├── error-*.tpl.html
    ├── pagination-*.tpl.html
    ├── checkbox-*.tpl.html
    └── ...
```

## Conventions de nommage

### Fichiers

- **Anglais uniquement** : Tous les noms de fichiers sont en anglais
- **Format** : `kebab-case.tpl.html`
- **Suffixe** : Toujours `.tpl.html` pour les templates

## Avantages de cette structure

1. **Organisation claire** : Chaque domaine a son propre dossier
2. **Scalabilité** : Facile d'ajouter de nouveaux templates
3. **Maintenance** : Retrouver un template est plus simple
4. **Standardisation** : Noms en anglais cohérents
5. **Séparation des préoccupations** : Pages, composants, layout et communs bien séparés
