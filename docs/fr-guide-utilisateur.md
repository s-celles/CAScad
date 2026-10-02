# Guide utilisateur

CAScad est un notebook de **calcul formel** qui fonctionne entièrement dans
votre navigateur. Vous saisissez les mathématiques visuellement ou en syntaxe
Giac, les cellules se recalculent quand ce dont elles dépendent change, et les
résultats s'affichent en formules et en graphiques interactifs. Il s'installe
comme une application et fonctionne hors ligne.

## Prise en main

1. Ouvrez <https://s-celles.github.io/CAScad/>. Pour l'installer, utilisez la
   commande *Installer l'application* (ou *Ajouter à l'écran d'accueil*) de
   votre navigateur.
2. Attendez que l'en-tête affiche **Giac prêt**.
3. Cliquez sur **▶ Tout exécuter (réactif)** dans le bandeau au-dessus du
   notebook, ou sur **Annuler** pour travailler cellule par cellule (voir
   [Exécuter les cellules](#exécuter-les-cellules)).
4. Ajoutez une cellule avec une zone **+** entre deux cellules, tapez
   `\frac{d}{dx}\sin x` (ou `diff(sin(x),x)` dans une cellule brute) et appuyez
   sur **Entrée**.

Ouvrez **📚 Exemples** pour des notebooks prêts à l'emploi : arithmétique,
algèbre, analyse, séries, séries de Fourier, algèbre linéaire, graphiques,
surfaces 3D, physique, traitement du signal, modulations d'amplitude et de
fréquence avec curseurs, et d'autres.

## La fenêtre

- **En-tête** : nom et version (cliquez pour *À propos*), choix du noyau, état
  de Giac, langue, thème (◐ automatique, ☀ clair, ☾ sombre), documentation,
  code source et *À propos*.
- **Barre d'outils** : nouveau notebook, tout exécuter, effacer les résultats,
  exporter, importer, exemples, commandes, envoi et réception, mode réactif,
  vue rapport et diagramme des cellules.
- **Barre du bas** : raccourcis clavier et **Afficher MathJSON**.

## Les cellules

Un notebook est une liste de cellules. Chaque cellule a un en-tête : la
poignée ⠿, son numéro (`In[3]`, `Txt[1]`…), son **badge de type** et des
commandes.

| Type | Contenu |
|------|---------|
| **Math** | Mathématiques saisies visuellement (formules, fractions, intégrales…). |
| **Brut** | Syntaxe Giac, par exemple `factor(x^4-1)`. |
| **Texte** | Texte Markdown avec des formules entre `$…$` ou `$$…$$`. |
| **Curseur** | Curseurs qui pilotent une expression et son graphique (dans les exemples et les fichiers). |

- **Ajouter une cellule** : cliquez sur une zone **+** au-dessus ou au-dessous
  d'une cellule (elle ajoute une cellule math).
- **Changer le type** : cliquez sur le badge de type (math → brut → texte).
- Les **cellules math** passent de la saisie visuelle **𝑓(𝑥)** à la syntaxe
  Giac **{ }**.
- **Déplacez** une cellule avec ↑ ↓ ou en la glissant par sa poignée ;
  **supprimez-la** avec ✕.
- **👁 Masquer** (Ctrl+Maj+H) cache la saisie et garde le résultat ;
  **⊘ Désactiver** (Ctrl+Maj+D) ignore la cellule ; **🔒 Verrouiller**
  (Ctrl+Maj+L) empêche de la modifier.

## Saisir des mathématiques

Les cellules math utilisent MathLive avec un clavier virtuel (il s'ouvre quand
une cellule a le focus) : fractions et dérivées, intégrales et sommes,
transformées et constantes physiques, lettres et lettres grecques.

- Tapez `/` pour une fraction, `^` pour une puissance, `_` pour un indice.
- Les noms de fonctions de calcul formel deviennent des fonctions au fil de la
  frappe (`factor`, `solve`, `laplace`…).
- Tapez `?` dans une cellule vide, ou le début d'une commande puis **Tab**,
  pour choisir une commande dans une liste.
- Un clic droit sur une formule propose **Réécrire** (factoriser, simplifier,
  développer la sélection) et **Math** (insérer une fonction).
- **Afficher MathJSON** (barre du bas) montre comment chaque cellule math est
  comprise.

## Exécuter les cellules

| Touches | Action |
|---------|--------|
| **Entrée** (cellule math) ou **Maj+Entrée** | Exécuter la cellule |
| **Ctrl+Entrée** | Exécuter la cellule et en ajouter une juste après |
| **Ctrl+Maj+Entrée** | Exécuter la cellule sans mettre à jour celles qui en dépendent |

### Mode réactif

Avec **Réactif** activé (par défaut), une cellule qui définit une variable —
`a := 5` — met à jour les cellules qui utilisent `a` quand elle change, comme
dans un tableur. Au démarrage, rien ne s'exécute avant que vous cliquiez sur
**▶ Tout exécuter (réactif)** dans le bandeau au-dessus du notebook.

- Une cellule qui attend ses données est marquée *en attente* ; une cellule
  pas encore exécutée est grisée.
- Des avertissements signalent quand deux cellules définissent la même
  variable, quand des cellules dépendent les unes des autres en boucle (les
  cellules de la boucle sont nommées), ou quand une cellule dépend d'une cellule
  en erreur ou supprimée.
- Désactivez **Réactif** pour n'exécuter les cellules qu'à la demande.

## Noyaux

| Noyau | Description |
|-------|-------------|
| **Giac** (par défaut) | Système de calcul formel complet : algèbre, analyse, graphiques, algèbre linéaire, programmation. Inclus dans l'application. |
| **Compute Engine** | CortexJS Compute Engine : simplifier, factoriser, développer, résoudre, dériver, intégrer. |

Choisir un noyau dans l'en-tête démarre un nouveau notebook avec lui (CAScad
demande d'abord si vous avez travaillé sur celui qui est ouvert) ; le choix est
mémorisé. Un fichier de notebook mémorise son noyau.

## Résultats et graphiques

Les résultats s'affichent en formules, avec le résultat brut en dessous. Les
erreurs et les avertissements de Giac apparaissent dans la cellule.

- **Graphiques 2D** : `plot(sin(x))`, `plotfunc([sin(x),cos(x)],x)`,
  `plotimplicit(x^2+y^2-1,x,y)`, `plotfield`, `plotcontour`, `plotode`,
  `plotseq`, `plotparam`, `plotpolar` — zoom à la molette, glisser pour
  déplacer.
- **3D** : `plotfunc(x^2+y^2,[x,y])`, `plot3d`, `plotparam3d` — glisser pour
  faire tourner.
- **Statistiques** : `histogram`, `barplot`, `camembert`, `boxwhisker`,
  `scatterplot`.
- **Géométrie** : `circle(0,2); segment([0,0],[2,0]); point(1,1)`.

## Texte et curseurs

Les cellules texte utilisent Markdown : `# Titre`, `**gras**`, `*italique*`,
`` `code` ``, `![image](adresse)` et des formules `$x^2$` ou
`$$\int_0^1 x\,dx$$`. Exécutez une cellule texte (Maj+Entrée) pour l'afficher
mise en forme.

`@bind(a, 0, 10, 0.5, 2, "Amplitude")` dans une cellule texte affiche un
curseur pour la variable `a` (minimum, maximum, pas, valeur initiale,
libellé) : le déplacer met à jour les cellules qui utilisent `a`.

## Aide et commandes

- **🧮 Commandes** parcourt les commandes Giac par catégorie, avec une
  recherche ; un clic insère la commande dans la cellule courante.
- `?factor` ou `help(factor)` affiche l'aide d'une commande : description,
  syntaxe, exemples (▶ en exécute un dans une nouvelle cellule) et commandes
  voisines.
- Fonctions de découverte : `search_commands("plot")`,
  `search_commands_by_description("prime")`, `list_categories()`,
  `commands_in_category("trigonometry")`, `command_info("solve")`,
  `suggest_commands("factr")`, `list_commands()`, `help_count()`.

## Vues

- **📄 Vue rapport** (Ctrl+Maj+R) cache les saisies : il ne reste que le texte
  et les résultats.
- **⛖ Flux** montre comment les cellules dépendent les unes des autres ;
  cliquez sur un nœud pour aller à sa cellule. Cliquer sur le numéro d'une
  cellule (`In[3]`) la montre dans le diagramme.

## Fichiers

- Le notebook ouvert est conservé dans votre navigateur : fermer ou recharger
  la page le ramène. **🗋 Nouveau** démarre un nouveau notebook.
- **💾 Exporter** enregistre le notebook dans `notebook.cascad.json`, pour en
  garder une copie ou l'envoyer.
- **📂 Importer** ouvre un notebook CAScad, Giac ou Xcas (`.json`).
- Pour envoyer un notebook à quelqu'un ou vers un autre appareil, voir
  [Partage et transfert](fr-partage.md).

Ouvrir un fichier, un exemple, un lien ou un notebook reçu remplace le
notebook ouvert : CAScad demande d'abord si vous avez travaillé dessus.
Exportez-le pour en garder une copie.

## Réglages

La langue, le thème et le noyau par défaut sont mémorisés sur cet appareil.
L'arabe s'affiche de droite à gauche. *À propos* indique la version, les
bibliothèques utilisées et des liens vers cette documentation.
