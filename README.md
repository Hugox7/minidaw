## V1 bêta 10 — Piano et cordes

Cinq instruments enregistrés : piano acoustique, violon, violoncelle, contrebasse pizzicato et contrebasse à l’archet. Choisir le son sur une piste d’instrument virtuel ; aperçu, notes, mixage, sauvegarde et export communs aux autres instruments.

75 nouveaux samples inclus, environ 15 Mo : chargement à la première utilisation de chaque instrument. Les cordes à l’archet utilisent des boucles de tenue avec fondu, indépendantes par note, et une courte extinction. Les deux contrebasses proviennent d’articulations enregistrées distinctes. Une couche dynamique par instrument ; la vélocité règle le volume. Pas de legato ni de réalisme orchestral professionnel promis.

Licences et provenance : public/samples/instruments/CREDITS.md, VSCO-CC0.txt et orchestra-manifest.json. Conserver tous les crédits. Les scripts de préparation ne sont pas nécessaires au build, les sons préparés sont inclus. Aucune dépendance supplémentaire.

Installation complète incluant la bêta 9 : copier tous les fichiers dont public et src/sustainLoops.json, conserver vos fichiers personnels (validation Google), puis npm ci et npm run build.

## V1 bêta 9 — Fin du morceau

Le bouton « Ajuster à la fin du morceau », près de Mesures, retire les mesures vides finales en prenant en compte toutes les pistes, même muettes. Il conserve au moins une mesure. Il est indisponible pendant la lecture, une prise ou une comparaison de prises.

L’export WAV ignore automatiquement les mesures vides finales des pistes audibles et garde 4 secondes pour la fin des effets. Le projet n’est pas modifié. La fin est arrondie à la mesure supérieure. Les silences internes et le silence enregistré dans les clips sont conservés. Les contenus au-delà de la durée choisie manuellement restent exclus de l’export.

Installation : copier tous les fichiers, conserver vos fichiers personnels dans public (notamment la validation Google), puis npm ci et npm run build. Cette version inclut toutes les précédentes.

# miniDAW — V1 bêta

Séquenceur React / TypeScript / Vite / Tone.js avec instruments virtuels,
batterie, import audio et enregistrement d'instruments depuis une carte son.

## V1 bêta 8 — français, anglais, espagnol et HTML pour le référencement

Cette archive complète inclut les pédales, les compteurs, les prises prolongées
et le correctif des dépendances du déploiement précédent.

### Installation et déploiement

Arrête le serveur de développement avant de remplacer les fichiers. Copie
**tous les dossiers** : `src`, `public`, **`scripts` et `content`**, ainsi que les
fichiers de la racine. Les deux derniers dossiers sont nécessaires à la
génération des pages HTML et guides. Deux dépendances ont été ajoutées :
`i18next` et `react-i18next`, verrouillées dans le package-lock corrigé.

Dans le dossier contenant package.json :

```bash
npm ci --registry=https://registry.npmjs.org
npm run build
```

Sur Netlify, la commande reste **npm run build** et le dossier publié reste
**dist**. Les pages de langue et le sitemap sont générés après Vite. Déploie
à la racine du sous-domaine `minidaw.trameworks.com` ; les samples et le worklet
utilisent des chemins absolus pour fonctionner depuis chaque langue.
Le .gitignore fourni exclut node_modules et dist. Si ces dossiers étaient déjà
suivis par Git, il faut aussi les retirer du suivi ; les ignorer ne suffit pas.

### Langues et sessions

Le header propose Français, English et Español. L’adresse choisie est /fr/,
/en/ ou /es/. Les changements se font sans recharger ni remonter le studio :
lecture, prise, effets, zoom et projet courant sont conservés. Les noms saisis
par l’utilisateur ne sont pas traduits. Les trois langues sur le même domaine
partagent les mêmes clés de stockage navigateur et la même base audio.
La langue est mémorisée séparément du projet ; une URL explicite est prioritaire.
La racine utilise le français ou la préférence mémorisée. Les contrôles natifs
de permission/fichiers conservent la langue du navigateur ou du système.

Les textes de l’interface et de ses messages sont dans src/locales/fr.json,
en.json et es.json. Les clés françaises restent stables ; les paramètres
{{v0}}, {{v1}}, etc. doivent être conservés dans chaque traduction. Le helper
tr s’appuie sur i18next et peut retraduire un message d’état déjà affiché
lorsque la langue change. Les types, identifiants, notes MIDI et données
sauvegardées restent indépendants des libellés. L’anglais utilise C/D/E… ; le
français et l’espagnol utilisent Do/Ré/Mi… et Do/Re/Mi… respectivement.
Les presets de pédales restent identifiés par leur ID, quelle que soit la langue.

### Pages HTML et indexation

Les trois studios /fr/, /en/, /es/ contiennent une présentation, des fonctions,
un démarrage et une FAQ en HTML, sans dépendre de JavaScript pour ce contenu.
Cette présentation reste repliable sous le studio pour garder l’interface légère.
Le studio interactif lui-même nécessite JavaScript ; son interface complète
n’est pas rendue côté serveur.

Chaque langue a un titre, une description, des balises sociales, une URL
canonique propre, des liens hreflang réciproques et des données structurées
WebApplication sans notes ni avis inventés. La racine française a pour
canonique /fr/ afin de ne pas créer une deuxième page française concurrente.
Les guides sont de vraies pages HTML lisibles sans JavaScript :
/fr/guide/, /en/guide/ et /es/guide/. L’ancien /guide.html redirige vers le guide
français. Les liens de langue des guides naviguent entre ces documents statiques.
Le serveur Vite de développement sert aussi les trois guides.

Après déploiement, soumets **https://minidaw.trameworks.com/sitemap.xml** dans
Google Search Console. Le sitemap liste les trois studios et les trois guides ;
robots.txt indique également son adresse. L’indexation et le classement restent
à vérifier dans Search Console et ne sont pas garantis par ces balises.
Le contenu SEO partagé est dans src/locales/site.json ; le domaine canonique
est défini dans src/seo.ts. Les guides anglais et espagnol sont dans content/.

## Installer la mise à jour

Copie le contenu du dossier `mini-daw` dans ton dossier existant, en acceptant
les remplacements. Copie aussi **tout le dossier `public`** : il contient les
samples et le nouveau processeur d'enregistrement `worklets/recorder.js`.
Arrête le serveur, lance `npm ci`, puis relance avec `npm run dev`. Cette version ajoute i18next et react-i18next.

Pour une installation neuve : Node.js 20.19+ ou 22.12+, puis `npm install` et
`npm run dev` dans le dossier contenant `package.json`.

Ouvre l'adresse localhost affichée par Vite sur ton ordinateur. La capture
nécessite **localhost ou HTTPS**, un navigateur compatible AudioWorklet et
l'autorisation d'accéder à l'entrée audio.

## V1 bêta 7 — pédales guitare et basse

Dans **Source de cette piste**, choisis **Guitare électrique** ou **Basse**.
La section **Pédales**, repliable, apparaît avant l’ampli : saturation, chorus,
puis delay. Elle reste masquée et son traitement est contourné pour Voix,
Autre, les instruments MIDI et la batterie. Les projets existants gardent
leur son : les nouvelles pédales et le nouveau baffle sont désactivés par défaut.

Choisis un **Son de départ** : Crunch, Gros rock, Metal ou Fuzz vintage pour
la guitare ; Grain léger, Basse rock ou Fuzz épaisse pour la basse.
**Clean · sans pédales** coupe et réinitialise les pédales, sans changer l’ampli.
Les presets remplacent les réglages du pédalier, chorus et delay compris.

La saturation propose **Overdrive**, **Distorsion** et **Fuzz**, avec Gain,
Tonalité, Volume et **Blend · son saturé**. Le Blend va de 0 % (son direct)
à 100 % (saturation seule). Sur la basse, commence autour de 50–65 % pour
conserver les graves et l’attaque. La fuzz a un caractère épais et creusé,
inspiré des grosses pédales classiques, sans émuler un modèle précis.

Le chorus propose quantité, vitesse et profondeur. Le delay propose quantité,
temps en millisecondes et répétitions. Chacun peut être activé séparément,
avec ou sans saturation. Le bouton Actif général du pédalier permet de
comparer le son traité et le son direct ; il conserve les réglages.

Dans **Ampli**, le nouveau bouton **Baffle** adoucit les aigus et façonne le
corps du son. Il fonctionne aussi avec l’ampli éteint. C’est un filtrage léger
de type haut-parleur, adapté à la source basse/guitare, sans réponse
impulsionnelle de baffle réel. L’ampli existant garde ses propres réglages.

Le trajet est : prise audio → saturation / Blend → chorus → delay → ampli →
baffle → mixage et volume de piste. Les réglages sont modifiables en lecture,
sauvegardés dans le navigateur et dans les .minidaw, repris sur une nouvelle
prise de la même source, et rendus dans le WAV du mix. Il faut cette version
ou une version ultérieure pour retrouver ces effets à la réouverture.
Changer de source désactive pédales, ampli et baffle pour repartir sur un son
brut, tout en conservant les valeurs des réglages.

Les fichiers audio d’origine et leur téléchargement individuel restent bruts.
**Le monitoring logiciel reste désactivé** : enregistre puis lance la lecture
pour entendre les effets. Le monitoring direct de la carte son ne contient
pas ces traitements. La queue d’effets exportée reste fixée à quatre secondes.

## V1 bêta 6 — entraînement et temps du morceau

Le menu **Entraînement** du header donne accès à **Bass** et **Guitar**, dans
un nouvel onglet. Il se ferme avec Échap, un clic ailleurs ou le choix d’un lien.
Guitar ouvre https://guitar.trameworks.com/ ; Bass garde son adresse habituelle.

Le compteur **temps écoulé / durée totale** apparaît près des commandes de
lecture et dans le bandeau de l’éditeur. Le format est minutes:secondes.dixièmes.
Le temps écoulé suit l’horloge audio ; le décompte avant la prise est exclu.
L’arrêt et le retour au début remettent le compteur à zéro. La durée totale
correspond au nombre de mesures et au tempo, et s’allonge avec un enregistrement
qui dépasse la fin du morceau. Elle exclut les quatre secondes de queue d’effets
ajoutées lors de l’export WAV.

Cette archive complète inclut aussi les changements des bêtas précédentes.

## V1 bêta 5 — enregistrer au-delà du morceau

La prise continue après la dernière mesure et ajoute automatiquement des mesures
à l’arrangement. Clique sur **Arrêter la prise** quand tu as terminé. Les passages
de batterie et des autres pistes sont joués une seule fois, sans répétition
automatique. Cela fonctionne aussi avec **Refaire la prise**.

La limite est désormais de cinq minutes et 64 Mo par prise stéréo PCM, arrondie
à une mesure complète. À haute fréquence d’échantillonnage, la durée est plus
courte ; sa valeur effective apparaît dans le panneau après activation de
l’entrée. L’arrêt à cette limite sauvegarde la prise normalement. Le décalage
en ms continue de s’appliquer ; la lecture normale s’arrête à la fin du morceau.

## V1 bêta 4 — plus de marge sur les volumes de pistes

Les faders et les champs numériques des pistes vont désormais de **−60 à +24 dB**,
par demi-décibel, au lieu du plafond de +6 dB. Cela permet de remonter une prise
faible pour l'équilibrer avec les autres. Le volume général garde sa plage
habituelle −60 à +6 dB. Les valeurs existantes ne sont pas changées automatiquement.

Le gain agit à la réécoute et dans le mix exporté, après les effets de la piste.
Il ne modifie pas la source audio, le gain d'enregistrement de la carte son,
ni le contenu du téléchargement individuel d'un clip. Il augmente aussi le bruit
déjà présent dans une prise faible : pour les prochaines prises, règle le gain
sur la carte avec le vumètre d'entrée sans saturation.

La nouvelle valeur est conservée dans la copie navigateur et dans les fichiers
.minidaw, y compris au rechargement, et respectée par l'export WAV. Les anciens
projets s'ouvrent toujours. Un projet contenant une piste au-dessus de +6 dB
nécessite cette version ou une version ultérieure : les anciennes bêtas refusent
ces valeurs. Les témoins CLIP restent utiles : si une piste ou la somme sature,
rééquilibre les niveaux avant de réexporter. Pas de normalisation automatique.

Tests React : fader/champ jusqu'à +24, demi-décibels, bornes, mise à jour en direct,
volume général inchangé et conservation au rechargement. Tests de WAV réellement
rendus : le passage de +6 à +24 ajoute bien 18 dB de gain avant écrêtage, avec
une source inchangée. Sauvegarde et ouverture d'un projet à +24 vérifiées.
Version technique : `1.0.0-beta.4`. Réglages communs dans `volumeSettings.ts`.

## V1 bêta 3 — régler le décalage pendant la comparaison (historique)

Dans **Décalage de la prise**, **Avancer les prochaines prises de** reste modifiable
lorsqu'une nouvelle prise attend validation, y compris pendant l'écoute A/B.
La valeur est utilisée par le prochain enregistrement ; elle ne déplace ni ne
réencode l'ancienne prise ou la nouvelle prise en cours de comparaison.

Seul ce réglage est déverrouillé. Les commandes d'enregistrement et d'édition
liées à la prise en attente conservent leurs protections. Le champ reste bloqué
pendant la préparation, le décompte, la capture, sa sauvegarde, une prise non
sauvegardée et les opérations de projet qui verrouillent le studio. La valeur
reste bornée à 0–500 ms et demeure un réglage de session.

Tests React : modification pendant l'attente et l'écoute A/B, deux prises inchangées,
limites de valeur, transmission au prochain enregistrement, verrouillage pendant
la capture et après une erreur de stockage. Le guide est à jour.
Version technique : `1.0.0-beta.3`.

## V1 bêta 2 — accordeur chromatique (1.0.0-beta.2, historique)

Le bouton **Accordeur** du bandeau ouvre une modale native. Il est indisponible
pendant la lecture, l'enregistrement, une connexion ou un export/sauvegarde.
Il n'est pas nécessaire d'ajouter une piste audio pour s'accorder.

1. Ouvre Accordeur, choisis Entrée audio et Canal.
2. Clique Activer l'entrée et autorise le microphone si demandé.
3. Joue une seule corde. La note française et internationale, son octave,
   la fréquence et l'écart en cents sont affichés.
4. Ajuste jusqu'à obtenir l'indication verte Accordé (écart de ±5 cents).
5. Ferme avec la croix, Échap ou un clic sur le fond extérieur.

Référence fixe La = 440 Hz ; pas de choix basse/guitare. La détection vise
28 à 1400 Hz sur un signal monophonique. Pour les basses graves, essaie
l'harmonique à la 12e frette : même note, une octave plus haute. Le signal est
analysé avant l'ampli et les effets, sans monitoring logiciel ni enregistrement.
L'entrée et le canal sont partagés avec les contrôles d'enregistrement.
Une entrée déjà active est réutilisée et conservée à la fermeture ; une entrée
activée uniquement dans l'accordeur est coupée. Fermer pendant une demande
d'autorisation invalide la demande et ferme le flux si elle se termine ensuite.

Détection inspirée de YIN : différence normalisée, interpolation au taux d'origine,
seuil de niveau et de périodicité, puis médiane de lectures cohérentes. L'analyse
s'effectue dix fois par seconde. La fenêtre de l'analyseur est agrandie seulement
pendant l'utilisation et restaurée à la fermeture. Les détails d'implémentation
sont dans `tunerPitch.ts` et `TunerModal.tsx`.

Tests sur signaux de Si0/Mi1 jusqu'à 1 kHz, fréquences d'échantillonnage
44,1/48/96/192 kHz et notes désaccordées ; écart de détection inférieur à 3 cents
sur ces signaux synthétiques. Tests du silence, bruit, niveau faible, composante
continue, harmoniques et lissage. Détection aussi vérifiée sur les samples réels
Mi1/Mi2 de basse et Mi2/La2 de guitare fournis par l'application. Tests React,
y compris StrictMode : modale/Échap, note et aiguille, entrée/canal, fermeture,
restauration de l'analyseur, entrée partagée, permission tardive/refusée et
conservation du projet. La précision et la stabilité avec ton matériel réel
restent à vérifier, surtout pendant l'attaque et sur les notes très graves.

Références : [YIN, de Cheveigné et Kawahara (2002)](https://iro.umontreal.ca/~pift6080/H09/documents/papers/yin_pitch_tracker.pdf)
et [dialogue modal natif](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal).

## V1 bêta — 1.0.0-beta.1 (historique)

Première version de test à partager aux musiciens. Le tag **V1 bêta** apparaît
dans le bandeau du studio, y compris sur petit écran, le titre de l'onglet,
le pied de page et le guide. La version initiale du paquet était `1.0.0-beta.1`.
Les constantes `APP_VERSION` et `APP_RELEASE_LABEL` sont dans `src/version.ts`.

Cette version reprend les fonctions de la V0.18.2 : accompagnements, batterie,
prises audio, mixage, projets locaux, export WAV et guide. La réception d'un
clavier MIDI USB n'est pas encore implémentée. Les projets existants restent
compatibles. Pour les limites fonctionnelles, voir le guide utilisateur.

## V0.18.2 : favicon

Une note de musique reprend le dessin du logo Lucide Music2 et sa couleur
sur un fond sombre arrondi. Le favicon SVG est utilisé dans le studio et le guide.
Copie aussi `index.html` et `public/favicon.svg` lors de la mise à jour.

## V0.18.1 : une poubelle à côté de chaque mesure

Dans les éditeurs piano et batterie, une petite poubelle apparaît à côté de
**Mesure 1**, **Mesure 2**, etc. Elle vide uniquement le contenu de cette mesure
sur la piste sélectionnée. Elle ne retire pas la mesure, ne déplace pas les
suivantes et ne change ni la durée du morceau ni les autres pistes et réglages.

Une note tenue traversant la mesure est coupée à ses limites : les portions
avant et après restent présentes. La portion après redémarre comme une note.
La suppression est immédiate, sans confirmation supplémentaire ; **Annuler le
vidage de mesure** apparaît au-dessus de la grille et restaure la dernière
suppression. Cette annulation est remplacée par le vidage d'une autre mesure,
et disparaît après une autre édition des notes ou un changement de piste.

Les poubelles des mesures vides sont désactivées, ainsi que toutes les poubelles
pendant la lecture ou une opération qui verrouille le studio. Les règles de
l'arrangement et de l'éditeur audio restent des repères sans poubelle globale.

Tests des intervalles et notes tenues, identifiants après séparation, mesures
adjacentes et contenu masqué. Tests React : emplacement, piano/batterie,
annulation, copie après vidage, mesures vides, verrouillage en lecture,
conservation de la durée, du mixage et des autres pistes.

## V0.18 : copier une mesure, sans destination implicite

Le panneau du piano roll et de la batterie propose **Mesure source** et deux
boutons. Il remplace l'ancien système de passage, nombre de copies et ajout en
fin de piste : les anciens marqueurs de fin ne servent plus à choisir la destination.

- **Copier à la mesure suivante** copie exactement la mesure choisie dans celle
  juste après. La source avance ensuite à cette nouvelle mesure : cliquer encore
  continue la chaîne. Le morceau s'allonge seulement si la source était sa dernière
  mesure, dans la limite de 1024 mesures.
- **Remplir le morceau** répète la mesure source dans toutes les autres mesures
  actuelles de cette piste, y compris celles avant la source. Le nombre de mesures
  reste identique.

Une destination contenant des notes ou coups déclenche une confirmation avant
remplacement. Annuler cette confirmation ne modifie rien. Les autres pistes,
les sons, les volumes et le mixage sont conservés. Une source vide désactive la copie.

Les rythmes, hauteurs et vélocités sont conservés. Le motif correspond à la portion
qui sonne dans la mesure source : les notes tenues sont limitées à ses bornes.
Lors du remplacement, les portions de notes hors des destinations sont conservées,
y compris après la fin visible du morceau. Les copies reçoivent des identifiants
uniques. Remplir remplace le contenu au lieu d'empiler des doublons.

**Annuler la copie** restaure la dernière version des notes et le choix de source,
jusqu'à une autre édition des notes ou un changement de piste. La durée du morceau
reste conservée après annulation, pour préserver les autres pistes. L'opération
est indisponible pendant la lecture, l'enregistrement ou une sauvegarde.

Les projets existants restent compatibles, sans modification des notes à l'ouverture.
Le guide décrit les nouveaux boutons. Les pistes audio gardent leur éditeur de clips.

Tests : copie 1 → 2 malgré des notes ultérieures et d'anciens marqueurs, copie en
chaîne, remplissage exact, remplacement/annulation de confirmation, notes tenues,
contenu hors de la vue, identifiants, vélocités, croissance et annulation. Tests
React du piano et de la batterie : source suivante, remplissage, conservation des
autres pistes et du mixage, verrouillage en lecture et invalidation de l'annulation.

## V0.17 : exporter le morceau en WAV

Dans la barre Projet, **Exporter en WAV** produit un fichier stéréo PCM 16 bits,
44,1 kHz, nommé à partir du projet. Il peut être lu dans un lecteur audio ou
partagé sans l'application. Il contient les instruments virtuels, la batterie,
les prises et imports, les découpes et duplications, les amplis, l'EQ, la compression,
la réverbération, les volumes et le panoramique. Le volume général est respecté ;
les pistes muettes sont exclues. Le décompte n'est pas exporté.

L'export part du début du morceau et suit le nombre de mesures affiché. Les notes
et clips hors de cette durée ne sont pas joués ; leurs durées sont limitées à la
fin du morceau. Quatre secondes supplémentaires laissent sonner les relâchements,
percussions et réverbérations. Cette fin est fixe, sans détection automatique du
silence. L'export est effectué hors temps réel, sans enregistrer les haut-parleurs
ni le microphone, et ne change ni les prises originales ni le projet.

Arrête la lecture et termine l'enregistrement avant d'exporter. Valide ou refuse
une nouvelle prise en attente. Les commandes du studio sont verrouillées pendant
le rendu ; un message indique le chargement, le rendu et la création du fichier.
Le navigateur télécharge le WAV. La copie de travail et le fichier .minidaw restent
indépendants : exporter n'enregistre pas le projet sur disque.

Une crête à 0 dBFS ou plus affiche un avertissement après l'export. Baisse les
volumes ou la sortie générale puis recommence. Il n'y a ni normalisation automatique
ni limiteur : un signal qui dépasse la plage du WAV est écrêté à la conversion.

Limite initiale : 5 minutes de durée musicale, plus les 4 secondes de fin. Un
morceau plus long est refusé avec un message, sans troncature automatique. Le rendu
utilise la mémoire de l'ordinateur ; le temps dépend du morceau et de ses effets.
Pas encore d'export MP3, de pistes séparées ni d'une sélection de mesures.

Vérifications sur des WAV réellement rendus : stéréo et en-tête, durée, absence du
décompte, volume général, panoramique, pistes muettes, portions audio et copies,
fin de réverbération, instruments synthétiques et samplés, kit acoustique, EQ,
ampli, détection de crêtes et reprise après erreur. Les tests d'interface vérifient
le téléchargement, l'avertissement, le retour des commandes et la conservation du
projet. Le bus et le contexte de lecture sont conservés après le rendu.

## V0.16.4 : guide utilisateur

Le lien **Guide ↗** du bandeau supérieur ouvre `guide.html` dans un onglet séparé.
Il ne remplace pas le studio en cours. Le guide couvre le démarrage, les notes
et accords, la batterie, la capture, la retouche des prises, le mixage,
les sauvegardes et le dépannage. Le sommaire fonctionne sans JavaScript.
Copie aussi le fichier `public/guide.html` lors de la mise à jour.

## V0.16.3 : compensation sans raccourcir les prises

La compensation de latence déplace maintenant toute la fenêtre de capture sur
l'horloge audio. Avec 100 ms, l'enregistrement récupère le signal jusqu'à 100 ms
après la fin prévue, au lieu de supprimer 100 ms et raccourcir le fichier.
La durée musicale est conservée, pour les répétitions comme pour les arrêts
manuels. La finalisation attend donc ce court délai avant de sauvegarder.

La duplication continue à placer la copie exactement à la fin des clips de la
piste, avec le même début dans la source et la même durée. Elle ne rajoute pas
la compensation à chaque copie. Aucun silence artificiel n'est ajouté pour
compenser la durée. Un silence réellement joué/enregistré reste dans la source :
l'éditeur permet d'en ajuster les limites comme auparavant.

La correction concerne les prochaines prises. Les anciens fichiers déjà
raccourcis ne contiennent pas la fin manquante : il faut refaire la prise pour
la récupérer. Les fichiers de projet restent compatibles avec la V0.16.

Vérification du vrai processeur AudioWorklet, de la capture et du WAV produit à
44,1 et 48 kHz, avec 0/100/500 ms, fin automatique et arrêt manuel : durée exacte
en échantillons, dernier échantillon non silencieux et copie contiguë. Arrêter
pendant le décompte annule toujours la prise.

## V0.16.2 : barre de projets

La gestion des projets occupe une barre dédiée entre le bandeau du logo et
les commandes de lecture. Elle ne sépare plus le transport de l’arrangement.
Les fonctions de sauvegarde et d’ouverture restent identiques.

## V0.16.1 : actions au-dessus de la grille

Les boutons **Vider la batterie** et **Annuler le vidage** sont placés juste
au-dessus de la grille de batterie, sous les réglages de rythme et leurs aides.
Leur fonctionnement reste identique.

## V0.16 : enregistrer et rouvrir ses projets

Le panneau **Projet**, entre le bandeau du logo et les commandes de lecture, permet de nommer son morceau,
d'en créer un nouveau et d'ouvrir ou enregistrer un fichier `.minidaw`.

Ce fichier contient les pistes, notes, patterns, tempo, mixage, effets, réglages
d'ampli et toutes les prises audio utilisées. Les sources audio complètes sont
conservées, y compris les portions masquées par les découpes et une éventuelle
nouvelle prise en attente de validation. Les clips dupliqués partagent leur source :
elle n'est stockée qu'une fois. Les samples des instruments et de la batterie
restent fournis par l'application. Il n'y a ni compte ni cloud.

### Premier enregistrement

1. Donne un nom au projet.
2. Clique sur **Enregistrer le projet** et choisis son emplacement si proposé.
3. Après tes modifications, clique à nouveau sur **Enregistrer le projet**.
4. Utilise **Ouvrir un projet** pour reprendre un fichier `.minidaw`.

**Enregistrer une copie** crée un autre fichier. Avec l'enregistrement direct,
la nouvelle copie devient le fichier actif. L'ancien fichier reste intact.

### Un dossier de morceaux sur Chrome ou Edge

Déplie **Mon dossier de projets**, puis **Choisir un dossier**. Les fichiers
`.minidaw` directement contenus dans ce dossier apparaissent dans une liste.
Clique sur un fichier pour l'ouvrir ; Enregistrer met ensuite ce fichier à jour.
Un premier enregistrement crée un nom disponible, avec un suffixe si nécessaire,
pour éviter d'écraser un autre morceau.

Le navigateur peut demander une autorisation d'accès. Le dossier est mémorisé
si possible ; après rechargement, utilise **Réautoriser le dossier** si nécessaire.
Le lien avec le dernier fichier actif n'est pas mémorisé après rechargement :
ouvre-le depuis la liste pour continuer à mettre à jour ce même fichier. Sinon,
Enregistrer crée un nouveau fichier disponible dans le dossier.
**Actualiser** relit la liste ; **Oublier ce dossier** retire seulement son accès
dans l'application, sans supprimer les fichiers.

### Firefox et autres navigateurs

L'application détecte les fonctions disponibles. Sans accès direct aux fichiers,
**Enregistrer le projet** télécharge un `.minidaw` ; **Ouvrir un projet** utilise
le sélecteur habituel. Conserve le téléchargement et gère les anciennes versions
dans tes dossiers. Le même format fonctionne avec les deux méthodes.
Le téléchargement d'une copie reste aussi disponible dans le panneau de dossier
sur les navigateurs compatibles.

### Copie de travail et limites

La copie de travail automatique reste dans le navigateur : métadonnées en
localStorage, prises en IndexedDB. Elle permet de reprendre la session sur la
même adresse et le même navigateur. Elle ne remplace pas un fichier enregistré
sur disque et n'écrit pas automatiquement dans ton dossier. Avant de changer
de projet, enregistre ton morceau pour le conserver séparément.

Le format, les références, l'intégrité et le décodage audio sont vérifiés avant
le remplacement de la session. Une erreur d'ouverture conserve le projet courant.
Les prises importées reçoivent de nouvelles références pour éviter les collisions
avec d'autres projets déjà présents dans le navigateur.

Limites de cette première version : fichier projet de 256 Mo maximum, 64 Mo par
source audio, 256 sources. La préparation et le chargement se font en mémoire ;
les commandes sont verrouillées pendant l'opération. Les périphériques choisis,
la compensation de latence et les réglages de vue sont des réglages de session,
ils ne font pas partie du fichier. Les anciens projets restent dans leur copie
de travail : ouvre l'application et enregistre-les en `.minidaw`.

Un `.minidaw` sert à reprendre le travail dans l'application : **ce n'est pas
un fichier audio du mix final**. Utilise **Exporter en WAV** pour le mix.

### Vider la batterie

Sélectionne la piste de batterie. Juste au-dessus de la grille de coups,
**Vider la batterie** retire tous les coups, sans supprimer la piste ni
modifier son kit, son volume ou son mixage. **Annuler le vidage** restaure les coups
et la longueur de répétition précédente. Cette annulation reste disponible tant
que tu n'as pas modifié les coups ou quitté la piste. La durée du morceau reste
inchangée. Ce bouton remplace l'ancien libellé générique « Effacer ».

### Vérifications

Compilation TypeScript et build Vite réussis. Tests du format avec un vrai WAV
stéréo, relecture audio après import, déduplication des sources, découpes, nouvelle
prise en attente, fichiers corrompus/incomplets et erreurs de décodage.
Tests d'interface avec API de fichiers simulées : sauvegarde, copie, ouverture,
nouveau projet, erreur d'écriture, téléchargement et navigation dans un dossier.
Tests du vidage de batterie, de l'annulation et du verrouillage en lecture.
Les fenêtres natives et les permissions restent à tester sur ton navigateur
avec un vrai dossier.

## V0.15 : 21 patterns de batterie

Le menu **Rythme** du séquenceur de batterie est regroupé par style :

- Rock & pop : Rock simple, Rock soutenu, Rock · charley ouvert, Pop entraînante,
  Ballade légère.
- Funk & disco : Funk · notes fantômes, Funk syncopé, Disco.
- Électronique : Dance, House, Électro dynamique.
- Hip-hop : Hip-hop droit, Mi-temps, Trap · doubles croches.
- Reggae & ska : Reggae · one drop, Reggae · contretemps, Ska rapide.
- Breakbeats : Drum & bass, Breakbeat syncopé.
- Transitions : Relance · dernier temps, Relance · montée.

Chaque motif dure une mesure en 4/4, sur la grille de doubles croches existante.
Il utilise uniquement les six percussions déjà disponibles. Les relances utilisent
la caisse claire ; il n'y a pas de nouveaux samples de toms ou de ride.

Une courte description et une plage de tempo indicative accompagnent le choix.
Le tempo du projet n'est jamais changé automatiquement. Les accents, les notes
fantômes et la force des coups légers sont intégrés à certains patterns ; il
n'y a pas de décalage aléatoire du placement ni de swing/triolets dans cette version.

Sélectionne un rythme, choisis **Sur** (une mesure ou tout le morceau), puis
**+ Ajouter le rythme**. Les coups existants sont conservés et les doublons évités.
Ajouter un autre rythme sur une mesure remplie combine les deux motifs. Pour
changer entièrement de groove, efface d'abord les coups concernés. Les anciens
patterns Rock simple, Dance et Mi-temps gardent leurs positions et vélocités.

Pour construire un morceau : pose un groove sur une mesure, utilise **Remplir le morceau** dans **Copier une
mesure** pour le prolonger, puis ajoute une relance dans une mesure de transition.
Tous les patterns fonctionnent avec le kit acoustique Pearl et le kit synthétique.
Les notes générées sont modifiables et sauvegardées comme auparavant.

## V0.14 : répéter un passage au piano ou à la batterie (historique)

**Ce fonctionnement a été remplacé par Copier une mesure dans la V0.18.**

Le panneau **Répéter un passage** est disponible dans le piano roll (tous les
instruments virtuels) et dans le séquenceur de batterie, sous le mixage.

1. Choisis **De la mesure** et **À la mesure** : même numéro pour une mesure,
   ou deux numéros pour une phrase de plusieurs mesures.
2. Choisis le nombre de **Copies**, de 1 à 8.
3. Clique sur **Répéter à la suite**. La destination est annoncée dans le panneau.

Les notes ou coups sont ajoutés à la mesure suivant la fin du passage déjà
présent sur la piste, sans nouvelle piste ni écrasement. Les mesures disponibles
sont remplies avant d'allonger le morceau si nécessaire. Pour répéter toute une
progression de quatre mesures, choisis 1 à 4. Pour un rythme d'une mesure,
choisis 1 à 1. Les réglages restent sur ce passage pour pouvoir répéter encore.

Les durées, les hauteurs et les vélocités sont conservées. Une note tenue qui
traverse une limite de sélection est copiée uniquement pour sa portion dans les
mesures choisies. Les notes originales restent entières. Les silences en fin
de phrase sont conservés, y compris lors de répétitions successives.

**Annuler la répétition** retire la dernière opération de répétition sur cette
piste, tant qu'aucune autre modification de notes n'a été faite. Cette annulation
ne réduit pas le nombre de mesures du morceau. L'historique n'est pas conservé
au rechargement, mais les répétitions et leurs silences sont sauvegardés dans le
projet. Effacer la piste remet également à zéro sa longueur de répétition.

Les commandes sont désactivées pendant la lecture et l'enregistrement. Le
fonctionnement des pistes audio et de leurs copies jointives reste inchangé.
Ce sont des copies indépendantes de notes, pas des boucles liées : modifier la
mesure originale ne modifie pas les copies déjà créées.

## V0.13.1 : répéter sur la même ligne

Les clips audio sont maintenant présentés sur une seule ligne dans l'éditeur,
comme dans l'arrangement. **Dupliquer la prise** ajoute une copie de la portion
sélectionnée à la fin de la piste entière, même si un clip plus ancien est
sélectionné. Les copies sont jointives, sans silence ajouté pour l'alignement.
L'option Aligner sur les temps continue d'agir sur les déplacements et les bords.

Exemple : une boucle de 2 secondes devient 4, puis 6 secondes, sur la même piste,
avec le même volume et les mêmes effets. Les fichiers ne sont pas recopiés.
Le morceau s'allonge si nécessaire et l'éditeur révèle la nouvelle copie.

Un menu **Clip** permet de choisir le segment à éditer, y compris si des clips
existants se chevauchent. Les chevauchements préexistants sont conservés et lus
en parallèle. Le clip sélectionné passe devant ; le curseur de lecture reste
visible au-dessus des clips. La liste détaillée des fichiers et téléchargements
est désormais repliable pour garder l'éditeur lisible.

Les anciennes positions et durées ne changent pas à l'ouverture. Les poignées
servent toujours à raccourcir ou révéler l'audio source ; ce n'est pas un outil
qui répète le son en étirant son bord. Utilise Dupliquer pour prolonger la piste.

## V0.13 : zoom, défilement et liaison des timelines

L'arrangement principal ne compresse plus toutes les mesures dans l'écran.
**Zoom arrangement**, de 25 à 400 %, change leur largeur ; le défilement
horizontal permet de parcourir le morceau. Les noms et contrôles des pistes
restent fixés à gauche. Sur beaucoup de pistes, un défilement vertical est aussi
disponible et la règle reste visible en haut de l'arrangement.

Au-dessus de l'arrangement :

- **Lier les vues** : défiler horizontalement dans l'arrangement ou dans l'éditeur
  audio, le piano roll ou la batterie amène l'autre vue au même temps musical.
  Les vues conservent leurs échelles distinctes. À l'activation, la dernière
  position consultée sert de repère. Changer de piste aligne le nouvel éditeur.
- **Suivre la lecture** : pendant la lecture ou la prise, les vues défilent quand
  le curseur approche du bord. Désactive cette option pour regarder ailleurs
  sans être ramené au passage joué. Si les vues sont liées, leur repère reste
  commun ; sinon chacune suit le curseur dans sa propre largeur visible.
- **Revenir au curseur** : ramène les deux vues à la position de lecture, même
  sans liaison active. À l'arrêt, la position revient au début comme auparavant.

La liaison et le suivi commencent désactivés. Ils concernent la navigation,
pas le son ni les positions des clips. L'audio garde son zoom de 50 à 400 % ;
le piano roll et la batterie gardent leurs échelles existantes. Les changements
de zoom conservent la position musicale dans les limites du défilement disponible.

Toutes les règles utilisent désormais les mêmes repères **Mesure** et **temps
1–2–3–4**. Sur les extrémités ou une vue assez large pour tout afficher, le
navigateur limite naturellement le défilement. Défiler verticalement dans le
piano roll ne déplace pas l'autre timeline.

## V0.12 : déplacer, raccourcir et dupliquer les prises

Sélectionne une piste audio et descends dans **Éditer les prises**, dans le panneau
Piste audio. Chaque clip apparaît sur sa propre ligne pour pouvoir le sélectionner
même lorsque plusieurs clips se superposent dans le temps ; ces lignes font
partie de la même piste et partagent ses effets et son volume.

- Glisse le corps d'un clip pour le déplacer dans le morceau.
- Glisse le bord gauche ou droit pour raccourcir la portion jouée, ou la révéler
  de nouveau dans les limites du fichier source.
- **Dupliquer la prise** crée un clip à la suite du clip sélectionné, aligné sur
  le temps suivant si l'alignement est actif. Les deux partagent le même fichier
  source ; leurs positions et leurs bords sont indépendants.
- **Aligner sur les temps** est actif par défaut. Décoche-le pour un ajustement
  libre, y compris les champs numériques en secondes.
- Le **Zoom** va de 50 à 400 % ; utilise le défilement horizontal pour te déplacer.
- Les champs Position, Début dans le fichier et Durée permettent aussi l'édition
  au clavier. Valide avec Entrée ou en quittant le champ. Échap annule la saisie.
- **Annuler la dernière édition** revient sur la dernière opération dans cet
  éditeur. Ce n'est pas encore un historique global et il ne survit pas au
  changement de piste ou au rechargement. Échap ou un geste annulé interrompt
  un déplacement en cours sans le valider.
- **Restaurer l'audio complet** remet le clip sélectionné sur l'intégralité du
  fichier source, à sa position actuelle dans le morceau.

L'édition se fait à l'arrêt. Les fichiers source ne sont jamais découpés : seuls
la position, le décalage dans le fichier et la durée changent. Les anciennes prises
sont compatibles (décalage initial zéro). Les modifications sont sauvegardées dans
le navigateur avec le projet. Les petits fondus anti-clic de lecture restent en
place, mais il n'y a pas encore de réglage manuel des fondus ni d'outil de découpe.

Le morceau s'allonge automatiquement lorsqu'une édition dépasse sa fin. Les clips
qui se chevauchent sont mixés ensemble. **Télécharger** récupère toujours le fichier
source entier, sans découpage ni effets. Refaire la prise conserve son comportement
précédent : après validation, elle remplace tous les clips de la piste.

## V0.11 : source audio et coloration Ampli

Sélectionne une piste audio puis choisis **Source de cette piste** : Basse,
Guitare électrique, Voix ou Autre. Ce choix décrit le contenu de la piste :
il ne change pas le périphérique ni le canal d'entrée. Les anciennes pistes
et les nouvelles pistes audio commencent sur Autre, sans effet Ampli.

La section repliable **Ampli** apparaît uniquement pour Basse et Guitare
électrique. Coche **Actif** pour l'entendre pendant la lecture :

- **Clair**, **Chaleureux**, **Rock** : trois caractères de saturation et coloration.
- **Gain**, 0–100 % : quantité de saturation.
- **Tonalité**, 0–100 % : plus sombre à gauche, plus brillante à droite.
- **Niveau de sortie**, −18 à +6 dB : équilibre le volume de l'effet.

L'Ampli précède l'égaliseur, le compresseur et la réverbération. Les vumètres
incluent donc son effet. Une part du signal direct (35 %) reste mélangée pour
la basse ; la guitare est entièrement traitée, avec un filtrage distinct.
Les réglages fonctionnent en cours de lecture. Le choix de source se fait à
l'arrêt et désactive l'Ampli pour éviter un changement de son involontaire.
Les curseurs sont conservés ; réactive Actif si tu veux reprendre leur effet.

Ce module apporte une première coloration de type ampli avec saturation douce
et filtres. Ce n'est pas une modélisation d'un ampli physique ni une simulation
de baffle par réponse impulsionnelle. Il ne traite jamais les pistes MIDI,
Voix ou Autre, même si des réglages d'ampli restent dans leurs métadonnées.

Les fichiers audio restent bruts. Le monitoring direct de la carte son ne passe
pas par cet effet ; l'Ampli s'entend à la réécoute. Ses paramètres et la source
sont sauvegardés avec le projet. Refaire la prise conserve ces réglages, et une
nouvelle piste issue du bouton Enregistrer hérite aussi de la source et de l'Ampli.
Les autres réglages de cette nouvelle piste suivent le comportement précédent.

Pour essayer : Source Basse, Ampli Actif, Chaleureux, Gain 30 %, Tonalité 50 %.
Compare avec Actif décoché et ajuste Niveau de sortie pour rapprocher les volumes.

## V0.10 : refaire une prise et surveiller les niveaux

### Refaire une prise sur la même piste

Dans une piste audio qui contient déjà des clips, active l'entrée puis clique
sur **Refaire la prise**. La piste sélectionnée est armée automatiquement.
La capture repart du début du morceau, avec le décompte et la compensation de
latence habituels. Les anciens clips de cette piste ne jouent pas pendant la
capture ; les autres pistes servent d'accompagnement.

Après l'arrêt, un panneau permet d'**Écouter la nouvelle**, **Écouter l'ancienne**,
puis **Garder la nouvelle prise** ou **Garder l'ancienne prise**. Arrête la lecture
pour changer de version ou valider. Les écoutes se font avec l'accompagnement.
Le nom, la couleur, le volume, le panoramique et les effets de la piste restent
identiques. Valider remplace l'ensemble des clips de cette piste par la nouvelle
prise ; cette première version ne remplace pas un passage isolé.

L'ancienne version reste dans le projet jusqu'à validation. La nouvelle prise
est sauvegardée dans IndexedDB et son choix en attente est conservé dans le
projet, même après rechargement. Un arrêt pendant le décompte ne remplace rien.
Si la sauvegarde échoue, Réessayer / Télécharger / Abandonner restent disponibles.
Le bouton Enregistrer habituel conserve son fonctionnement : une piste contenant
déjà des clips donne lieu à une nouvelle piste séparée.

### Volumes et vumètres

Chaque piste dispose d'un volume de −60 à +6 dB, par pas de 0,5 dB, et d'un champ
numérique directement saisissable. Entrée ou sortie du champ valide la saisie.
Les vumètres stéréo affichent les crêtes en dBFS après les effets, le volume et le
panoramique. Le témoin **CLIP** mémorise une crête atteignant 0 dBFS : clique dessus
pour le réinitialiser. Ce sont des indicateurs de crête, pas des mesures LUFS.

La **Sortie générale**, en haut, possède le même volume et un vumètre stéréo après
ce volume. Elle reçoit toutes les pistes, les préécoutes et les clics du décompte.
Baisser le volume général agit sur l'écoute, pas sur les WAV enregistrés. Les
réglages de volume sont sauvegardés avec le projet. Les vumètres ne mesurent pas
le gain d'entrée : le niveau de capture se règle toujours sur la carte son et
se surveille dans le panneau d'entrée audio.

Le lien **Entraînement basse** ouvre bass.trameworks.com dans un nouvel onglet.

## V0.9 : mixage par piste

Sélectionne une piste dans l'arrangement. Le panneau **Mixage et effets** apparaît
juste sous les boutons Lecture / Effacer de l'éditeur. Il peut être replié.
Les réglages fonctionnent sur les synthés, instruments enregistrés, batteries et
prises audio, et restent utilisables pendant la lecture. La préécoute des notes
et des instruments utilise aussi le mixage de la piste.

- **Panoramique** : gauche, centre ou droite ; bouton Recentrer.
- **Égaliseur** : graves en plateau à 200 Hz, médiums en cloche à 1 kHz,
  aigus en plateau à 4 kHz, de −12 à +12 dB. Activer puis ajuster les curseurs.
- **Compresseur** : Quantité règle conjointement seuil et ratio. Les réglages
  avancés donnent accès au seuil, ratio, attaque, relâchement et gain de sortie.
  La quantité ne modifie pas l'attaque, le relâchement ou le gain de sortie.
  Le gain de sortie est manuel, sans compensation automatique de volume.
- **Réverbération** : pièce courte de 1,5 s, quantité de 0 à 50 %.

Les trois effets ont chacun leur case **Actif**, pour comparer avant/après sans
perdre les réglages. Par défaut ils sont désactivés et le panoramique est centré.
Réinitialiser ne touche qu'au mixage de cette piste, pas à son volume ni à ses notes.
Les anciens projets reçoivent ces valeurs neutres et les réglages sont sauvegardés
avec le projet dans le navigateur.

Les effets traitent uniquement la lecture : les prises WAV restent brutes,
y compris avec le bouton Télécharger. Le monitoring direct de la carte son
reste indépendant des effets de l'application. Exporter en WAV inclut les effets
du mix. Pas encore de delay ni d'effets sur le master ; la coloration d'ampli
est disponible sur les pistes audio basse et guitare électrique.

Exemple pour la basse : commencer avec le compresseur à 30–40 %, attaque 20–35 ms,
relâchement 150 ms, gain de sortie 0 dB. Ajuster à l'oreille et comparer avec Actif.
Le seuil dépend du niveau enregistré. Éviter de monter systématiquement toutes
les bandes de l'égaliseur ; réduire une fréquence gênante fonctionne aussi.

## V0.8.1 : décompte avant enregistrement

Dans une piste audio, règle **Décompte avant la prise** : aucun, une mesure
(quatre temps) ou deux mesures (huit temps). Une mesure est proposée par défaut.
Le choix est sauvegardé avec le projet.

Quand tu enregistres, les instruments virtuels et les pistes audio attendent la
fin du décompte. Tu entends des clics au tempo du morceau, avec le premier temps
de chaque mesure accentué. Un grand chiffre affiche 1–2–3–4, répété si tu choisis
deux mesures. Un rappel du temps reste visible dans l'en-tête de l'éditeur.

Après le dernier temps complet, l'accompagnement et la capture commencent
ensemble. Les clics ne sont pas ajoutés au fichier enregistré. Arrêter pendant
le décompte annule la capture sans créer de fichier audio vide. La lecture simple
reste immédiate : le décompte concerne uniquement l'enregistrement. Les clics
s'arrêtent pendant la prise ; ce n'est pas encore un métronome continu.

## Premier enregistrement de basse ou guitare

1. Branche ta carte son et ton instrument. Sur une entrée adaptée, active le mode
   instrument / Hi-Z de la carte son.
2. Clique sur **Piste audio**. La nouvelle piste est automatiquement armée.
3. Choisis l'entrée audio et le canal : entrée 1/gauche, entrée 2/droite ou stéréo.
4. Clique sur **Activer l'entrée** et autorise l'accès audio dans le navigateur.
   Si les noms des entrées n'étaient pas visibles, ils apparaissent après
   autorisation. Changer de périphérique ou de canal coupe l'entrée : réactive-la.
5. Joue quelques notes et vérifie le niveau d'entrée. S'il atteint le rouge,
   baisse le gain sur la carte son. Le volume de la piste règle la réécoute,
   pas le niveau capturé.
6. Clique sur **Enregistrer avec l'accompagnement**. Les autres pistes partent
   du début et la prise est capturée en même temps.
7. Clique sur **Arrêter la prise** quand tu as terminé. Le morceau s’allonge
   automatiquement si tu dépasses sa dernière mesure. La limite affichée est
   de cinq minutes maximum et 64 Mo par prise.
8. La forme d'onde apparaît dans l'arrangement et dans la liste des prises.
   Lance Lecture pour entendre ta prise avec les autres pistes.

La capture demande au navigateur de désactiver l'annulation d'écho, la réduction
de bruit et le gain automatique. Les deux premières entrées exposées par le
navigateur sont accessibles ; les canaux ASIO propriétaires ne sont pas gérés.

**Aucun monitoring logiciel n'est envoyé vers les enceintes.** Pour t'entendre
pendant la prise, utilise le monitoring direct de la carte son. L'entrée reste
ouverte pour le niveau et les prises suivantes, jusqu'à **Couper l'entrée** ou
la fermeture de l'application.

## Plusieurs prises, import et réécoute

Si tu relances un enregistrement sur une piste contenant déjà une prise,
miniDAW crée une nouvelle piste audio : la précédente est conservée. Les prises
précédentes restent audibles tant que tu ne les mets pas en Muet.

**Importer un fichier audio** accepte les formats que le navigateur sait
décoder (notamment WAV et MP3). Taille maximale : 64 Mo par fichier. Un import
est ajouté après les clips existants sur la piste ; la longueur du morceau est
agrandie si nécessaire. Une piste vide place l'import au début.

Les clips audio restent ancrés en secondes lorsque le tempo change. Les notes
MIDI suivent le tempo. Le nombre de mesures est agrandi si nécessaire pour que
les prises restent audibles après un changement de tempo. Réduire explicitement
le nombre de mesures peut masquer une partie des clips sans effacer leurs données.

Chaque clip peut être téléchargé individuellement. Les prises enregistrées sont
du WAV PCM 16 bits stéréo au taux de l'horloge audio ; une entrée mono est copiée
sur les deux canaux. Le téléchargement d'un import conserve son fichier original.
Il s'agit de la source ; Exporter en WAV produit le mixage complet.

## Alignement et décalage

L'AudioWorklet capture le PCM sur la même horloge que les pistes de lecture,
avec un départ programmé après le chargement des instruments. Les limites de la
prise sont calculées en frames audio, sans utiliser l'heure de livraison des
messages JavaScript comme référence musicale.

La latence matérielle de ta carte et du navigateur doit encore être vérifiée
avec ta configuration réelle. Dans **Décalage de la prise**, tu peux avancer les
prochaines prises de 0 à 500 ms : la fenêtre de capture est décalée,
sans raccourcir la durée du WAV (depuis la V0.16.3).
Les anciennes prises ne sont pas modifiées. Pas encore de mesure automatique de
latence ni de déplacement des clips après capture.

## Sauvegarde locale

Les anciennes pistes MIDI et leurs sons sont repris automatiquement. Utilise le
même navigateur et la même adresse, port compris, pour retrouver ton projet.

Les fichiers audio sont sauvegardés dans **IndexedDB** ; seuls les réglages,
les références aux prises et les petites formes d'onde sont dans localStorage.
Les prises sont rechargées et décodées au lancement de la lecture après une
réouverture de la page. Aucune donnée n'est envoyée à un serveur.

Si une prise ne peut pas être sauvegardée, elle reste en mémoire et un encart
permet de **réessayer** ou de **la télécharger** avant de fermer l'onglet.
Télécharge les prises que tu souhaites conserver indépendamment du navigateur :
effacer les données du site supprime aussi cette sauvegarde locale.

La suppression d'une piste ou d'un clip le retire du projet. Le nettoyage des
fichiers audio devenus orphelins dans IndexedDB sera traité avec la gestion des
projets ; cette version privilégie la conservation des enregistrements.

## Fonctions MIDI conservées

- Lecture / arrêt, retour au début, tempo, mesures, volume et mute par piste.
- Deux boutons Lecture / Arrêter synchronisés ; l'en-tête de l'éditeur reste visible.
- Piano roll Do1–Do6 : dessin/effacement au clic maintenu, déplacement,
  redimensionnement et choix de durée des notes. Grille au 1/16.
- Accords majeur, mineur, 7, maj7, m7, sus2, sus4 et diminué, avec préécoute.
- Six synthés : doux, clavier FM, basse, nappe, pluck et lead rétro.
- Quatre instruments enregistrés : basse électrique, guitare acoustique,
  trompette et trombone. Les samples ne simulent pas encore slap, bends ou strumming.
- Batterie à six lignes : kick, snare, clap, charleys fermé/ouvert et crash.
- Kits synthétique et acoustique Pearl, avec variations de caisse claire/crash.
  Le clap du kit acoustique reste synthétique.
- Rythmes rock simple, dance et mi-temps, ajoutables sans doublons ni effacement.

## Crédits des samples

- Pearl Master Studio Pack 1 par **enoe**, via Oramics / Sampled, CC BY 3.0.
  Détails : `public/samples/pearl/CREDITS.md`.
- Tonejs Instruments, préparés et distribués par **Nicholaus P. Brosowsky**,
  CC BY 3.0 ; sources Karoryfer, Iowa et VSO2 selon le distributeur.
  Détails : `public/samples/instruments/CREDITS.md`.

Les fichiers de ces collections sont inclus et inchangés. Conserve leurs crédits.

## Limites et validations

Phase 2 : capture depuis l'entrée, choix du canal, niveau, armement, sauvegarde,
forme d'onde, import et lecture commune audio/MIDI sont implémentés.

Pas encore de lecture en boucle, pause/reprise ni métronome continu.
Les éditions de clips, effets, projets et export WAV sont décrits plus haut. L'édition musicale et les choix d'entrée se font à l'arrêt.

Compilation TypeScript et build Vite vérifiés. Tests du worklet simulant les
blocs audio : bornes exactes, capture multibloc, arrêt anticipé et compensation.
Tests du routage et des contraintes d'entrée sans monitoring, de la libération
du micro, de la création WAV et de la sauvegarde IndexedDB. Rendu audio réel d'une
prise test avec placement temporel, puis réouverture depuis un cache vide.
Tests React dans un DOM simulé : activation/armement, record/stop, prises
successives, forme d'onde, échec de sauvegarde et récupération, import,
persistance et préservation du MIDI. Les tests des accords et rythmes passent.

**La carte son réelle et la permission micro dans ton navigateur n'ont pas pu
être testées ici.** Le premier essai matériel doit vérifier le bon périphérique,
le canal, le niveau, la réécoute et le décalage éventuel.


V0.8.1 : tests du décompte à cinq tempos, zéro/une/deux mesures, correspondance
entre le départ de la capture et du transport, annulation des clics et des
indicateurs après arrêt. Test d'interface : choix et persistance du décompte,
annulation sans sauvegarde, puis prise normale. Rendu audio réel de quatre clics
à 120 BPM suivis de l'accompagnement au départ prévu.
