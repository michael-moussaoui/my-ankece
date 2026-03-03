# Checklist de Conformité Légale & Évolutions Futures

## ✅ Checklist Immédiate
- [ ] Compléter les zones "[À COMPLÉTER]" dans les Mentions Légales, CGU et Politique de Confidentialité.
- [ ] Intégrer un bouton "J'accepte les CGU et la Politique de Confidentialité" lors de la création d'un compte (Obligatoire RGPD/Droit FR).
- [ ] Rendre ces documents accessibles en permanence dans les "Paramètres" ou le "Profil" de l'application.
- [ ] S'assurer que les Coachs certifient avoir une assurance RC Pro lors de leur inscription.
- [ ] Vérifier que le serveur d'IA (FastAPI) traite les données conformément aux engagements de confidentialité.

## 🚀 Évolutions : Si vous ajoutez un système de paiement
En cas d'implémentation d'un système de paiement (ex: via Stripe), les points suivants devront être ajoutés :

1.  **Conditions Générales de Vente (CGV)** : Indispensables pour toute transaction commerciale.
2.  **Statut de Commissionnaire** : Si vous prenez une commission, vous devenez "Agent de service de paiement" ou partenaire d'un prestataire type Stripe Connect.
3.  **Facturation** : Obligation de générer des factures conformes.
4.  **Droit de rétractation** : Gérer les délais de 14 jours (ou les exceptions pour les prestations de service débutant immédiatement).
5.  **Responsabilité financière** : Gestion des remboursements et des litiges de paiement.
6.  **Déclarations fiscales** : Obligations liées aux plateformes collaboratives (Loi contre la fraude fiscale).

## 💡 Conseil Juridique
Ces documents constituent une base solide pour le lancement d'un MVP (Minimum Viable Product). Toutefois, il est recommandé de les faire valider par un avocat spécialisé en droit du numérique et du sport avant une mise en production à grande échelle.
