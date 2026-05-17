# IBM Bob Hackathon - Lazarus

Interface Next.js 14 pour auditer une base de code avec un workflow multi-agent inspire d'IBM Bob. L'app permet d'importer des fichiers ou un dossier complet, de lancer une analyse de securite, de visualiser le chemin de correction, puis de telecharger les fichiers corriges.

## Vision

Lazarus transforme une revue de code legacy en experience claire pour les developpeurs :

- importer une base de code multi-langage ;
- comprendre ou sont les risques ;
- voir IBM Bob analyser, corriger et verifier ;
- obtenir une notation de faille de `0` a `10` ;
- comparer l'ancien code et le code corrige ;
- telecharger les correctifs et la preuve de session.

L'objectif est de donner aux equipes backend un copilote d'audit lisible, utile en hackathon, en revue de Pull Request, en migration legacy ou en securisation rapide d'un service.

## Ce que fait IBM Bob dans l'app

IBM Bob est simule comme un orchestrateur multi-agent. Chaque etape a un role precis :

1. **Deep Context**  
   Bob lit les fichiers importes, reconstruit l'arborescence et identifie l'intention du code.

2. **Database Layer**  
   Bob repere les acces aux bases de donnees, les requetes SQL, les modeles, les appels ORM et les dependances sensibles.

3. **Security Injection**  
   Bob detecte les entrees non fiables, les injections SQL, les secrets exposes, les validations manquantes et les appels dangereux comme `eval`, `exec` ou les requetes concatenees.

4. **Core Logic Translation**  
   Bob propose une version corrigee du code : validation stricte, requetes parametrees, separation des responsabilites, typage, erreurs controlees et journalisation.

5. **Tests & Verify**  
   Bob simule une verification : contrat de sortie conserve, payloads dangereux bloques, comportement attendu preserve.

6. **Final Audit**  
   Bob produit un audit final, un score de risque, un diff consultable et une preuve de session telechargeable.

## Fonctionnalites

- Import de fichiers seuls.
- Import de dossiers complets.
- Support multi-langage : JavaScript, TypeScript, Python, PHP, Ruby, Go, C#, Java, SQL et autres fichiers texte.
- Analyse globale de la base de code.
- Animation de workflow en direct.
- Rubriques cliquables pour comprendre chaque correction.
- Vue avant/apres du code.
- Popups pour les contenus longs.
- Telechargement d'un fichier corrige.
- Telechargement de tous les correctifs.
- Telechargement du journal d'audit `lazarus-audit.txt`.
- Fallback local si l'API IBM Bob n'est pas disponible.

## Stack technique

- Next.js 14
- React 18
- TypeScript
- App Router
- Route Handler API : `app/api/bob/route.ts`
- UI en CSS-in-JS dans `app/page.tsx`
- Icons avec `lucide-react`

## Installation locale

```bash
npm install
npm run dev
```

Puis ouvre :

```text
http://127.0.0.1:3000
```

## Variables d'environnement

Cree un fichier `.env.local` a la racine du projet :

```env
IBM_BOB_API_KEY=ta_cle_api_ici
IBM_BOB_API_URL=https://api.ibmbob.ai/v1/chat/completions
IBM_BOB_MODEL=ibm-bob
```

`IBM_BOB_API_KEY` ne doit jamais etre commit sur GitHub. Le fichier `.env.local` est ignore par Git.

## Mode fallback

Si la cle API est absente, si l'API repond avec une erreur, ou si la reponse prend plus de 8 secondes, l'app bascule automatiquement en mode fallback.

Le fallback renvoie toujours une reponse compatible avec le frontend :

- `securityAudit`
- `migrationSql`
- `oldCode`
- `backendCode`
- `rawAuditLog`
- `riskScore`
- `reviewSections`

Cela permet de garder une demo stable meme sans acces API.

## Structure du projet

```text
app/
  api/
    bob/
      route.ts      # API Next.js, appel IBM Bob + fallback
  globals.css       # styles globaux
  layout.tsx        # layout racine
  page.tsx          # interface client
package.json
tsconfig.json
```

## Comment utiliser l'app

1. Lance l'application.
2. Importe un ou plusieurs fichiers, ou un dossier complet.
3. Clique sur **Analyze**.
4. Suis le chemin IBM Bob en direct.
5. Ouvre les rubriques pour voir :
   - ce que Bob a lu ;
   - ce qui a ete modifie ;
   - comment Bob a verifie ;
   - l'ancien code ;
   - le code corrige.
6. Telecharge les correctifs ou le journal d'audit.

## Pour les developpeurs

Cette app sert a accelerer :

- les audits de code legacy ;
- les revues de Pull Request ;
- la detection de failles backend ;
- la migration depuis du SQL brut vers une couche plus sure ;
- la comprehension d'une base de code inconnue ;
- la production d'un rapport lisible pour une equipe technique.

Elle ne remplace pas une revue humaine finale, mais elle donne une premiere passe structuree, actionnable et facile a presenter.

## Deploiement gratuit sur Vercel

1. Pousse le projet sur GitHub.
2. Va sur [Vercel](https://vercel.com).
3. Importe le repo GitHub.
4. Ajoute les variables d'environnement :

```env
IBM_BOB_API_KEY=ta_cle_api_ici
IBM_BOB_API_URL=https://api.ibmbob.ai/v1/chat/completions
IBM_BOB_MODEL=ibm-bob
```

5. Clique sur **Deploy**.

## Licence

Projet hackathon. A adapter selon les besoins de publication.
