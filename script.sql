-- ==========================================================
-- SCRIPT SQL - GESTION DES FRAIS
-- Auteur : Akono Josua, Bekkaoui Othmane, Benjabir Jawad, Ercan Saban-Can, Perret William - Freeware
-- Date   : 2025-10-16
-- Base   : PostgreSQL
-- ==========================================================

-- ==========================================================
-- 1.CRÉATION DE LA BASE DE DONNÉES
-- ==========================================================
DROP DATABASE IF EXISTS freeware;
CREATE DATABASE freeware
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TEMPLATE = template0
    CONNECTION LIMIT = -1;

-- ==========================================================
-- 2.CRÉATION DES TYPES ENUM
-- ==========================================================
CREATE TYPE role_enum AS ENUM ('admin', 'comptable', 'employe');
CREATE TYPE statut_frais_enum AS ENUM ('Brouillon', 'EnCours', 'PaiementEnCours', 'Paye', 'Refuse');
CREATE TYPE type_essence_enum AS ENUM ('Diesel', 'Éthanol', 'Autre', 'Gazole', 'Électrique', 'Essence95', 'Essence98');

-- ==========================================================
-- 3.Création des tables
-- ==========================================================

-- =======================
-- Table Utilisateur
-- =======================
CREATE TABLE Utilisateur (
    id_utilisateur      SERIAL PRIMARY KEY,
    nom_utilisateur     VARCHAR(50)       NOT NULL,
    prenom              VARCHAR(50)       NOT NULL,
    email               VARCHAR(100)      NOT NULL UNIQUE,
    mot_de_passe        VARCHAR(255)      NOT NULL,
    salt                VARCHAR(64)       NOT NULL,
    adresse_utilisateur VARCHAR(100)      NOT NULL,
    cp_utilisateur      VARCHAR(5)        NOT NULL,
    ville_utilisateur   VARCHAR(100)      NOT NULL,
    role                role_enum         NOT NULL,
    valide              BOOLEAN           NOT NULL DEFAULT FALSE,
    date_creation       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    plaque              VARCHAR(15)       NOT NULL UNIQUE,
    cylindree           INT               NOT NULL,
    marque              VARCHAR(50)       NOT NULL,
    modele              VARCHAR(50)       NOT NULL,
    type_essence        type_essence_enum NOT NULL
);

-- =======================
-- Table Chantier
-- =======================
CREATE TABLE Chantier (
    id_chantier       SERIAL PRIMARY KEY,
    nom_chantier      VARCHAR(50)  NOT NULL,
    adresse_chantier  VARCHAR(100) NOT NULL,
    cp_chantier       VARCHAR(5)   NOT NULL,
    ville_chantier    VARCHAR(100) NOT NULL
);

-- =======================
-- Table GrilleTarifaire
-- =======================
CREATE TABLE GrilleTarifaire (
    cylindree INT PRIMARY KEY,
    tarif_km  DECIMAL(5,2) NOT NULL
);

-- =======================
-- Table Frais
-- =======================
CREATE TABLE Frais (
    id_frais      SERIAL PRIMARY KEY,
    lieu          VARCHAR(50)        NOT NULL,
    date          DATE               NOT NULL,
    montant       DECIMAL(10,2)      NOT NULL,
    justificatif  BYTEA              NOT NULL,
    statut        statut_frais_enum  NOT NULL DEFAULT 'Brouillon',
    id_utilisateur INT               NOT NULL REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE,
    id_chantier    INT               NOT NULL REFERENCES Chantier(id_chantier) ON DELETE CASCADE
);

-- =======================
-- Table FraisDeplacement
-- =======================
CREATE TABLE FraisDeplacement (
    id_deplacement SERIAL PRIMARY KEY REFERENCES Frais(id_frais) ON DELETE CASCADE,
    ville_depart   VARCHAR(100)  NOT NULL,
    ville_arrivee  VARCHAR(100)  NOT NULL,
    distance_km    DECIMAL(10,2) NOT NULL,
    id_voiture     INT           NOT NULL REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- =======================
-- Table FraisRepas
-- =======================
CREATE TABLE FraisRepas (
    id_repas     SERIAL PRIMARY KEY REFERENCES Frais(id_frais) ON DELETE CASCADE,
    type_repas   VARCHAR(50) NOT NULL
);

-- =======================
-- Table FraisHebergement
-- =======================
CREATE TABLE FraisHebergement (
    id_hebergement     SERIAL PRIMARY KEY REFERENCES Frais(id_frais) ON DELETE CASCADE,
    nb_nuits           INT          NOT NULL,
    date_debut         DATE         NOT NULL,
    date_fin           DATE         NOT NULL,
    nom_etablissement  VARCHAR(100) NOT NULL
);

-- =======================
-- Table Telephone
-- =======================
CREATE TABLE Telephone (
    id_telephone SERIAL PRIMARY KEY,
    indic_pays   VARCHAR(5)   NOT NULL,
    indic_region VARCHAR(5)   NOT NULL,
    numero       VARCHAR(20)  NOT NULL,
    id_utilisateur INT        NOT NULL REFERENCES Utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- ==========================================================
-- 4.INDEX SUPPLÉMENTAIRES
-- ==========================================================
CREATE INDEX idx_frais_utilisateur ON Frais(id_utilisateur);
CREATE INDEX idx_frais_chantier ON Frais(id_chantier);
CREATE INDEX idx_deplacement_voiture ON FraisDeplacement(id_voiture);

-- ==========================================================
-- 5.COMMENTAIRES (Documentation interne)
-- ==========================================================
COMMENT ON DATABASE gestion_frais IS 'Base de données pour la gestion des frais professionnels (Freeware)';
COMMENT ON TABLE Utilisateur IS 'Contient les informations sur les utilisateurs et leurs véhicules';
COMMENT ON TABLE Frais IS 'Regroupe tous les frais (repas, déplacement, hébergement)';
COMMENT ON TABLE GrilleTarifaire IS 'Tarif du km selon la cylindrée du véhicule';
COMMENT ON TABLE Chantier IS 'Référentiel des chantiers de l''entreprise';
COMMENT ON TABLE Telephone IS 'Numéros de téléphone liés aux utilisateurs';
COMMENT ON TABLE FraisDeplacement IS 'Spécialisation de Frais pour les déplacements';
COMMENT ON TABLE FraisRepas IS 'Spécialisation de Frais pour les repas';
COMMENT ON TABLE FraisHebergement IS 'Spécialisation de Frais pour les hébergements';

-- ==========================================================
-- FIN DU SCRIPT
-- ==========================================================
