# Partage et transfert

CAScad garde les notebooks sur votre appareil. Pour en donner un à quelqu'un ou
le déplacer vers un autre appareil, choisissez l'un des moyens ci-dessous.
Chacun remplace le notebook ouvert côté réception, après avoir demandé s'il
contient du travail.

| Moyen | Réseau nécessaire | Taille | Idéal pour |
|-------|-------------------|--------|------------|
| [QRShare](#envoyer-vers-un-autre-appareil-avec-qrshare) | Non (QR codes) ou oui (connexion directe) | Toute | Déplacer un notebook vers un autre appareil, même hors ligne |
| [Lien contenant le notebook](#lien-contenant-le-notebook) | Pour envoyer le lien | Petits notebooks | Messages, courriels, pages de cours |
| [QR codes dans CAScad](#qr-codes-dans-cascad) | Non | Toute (animés) | Montrer un notebook sur un écran |
| [Du téléphone vers l'ordinateur](#du-téléphone-vers-lordinateur-p2p) | Oui | Toute | Un ordinateur sans caméra |
| Fichier (💾 Exporter, 📂 Importer) | — | Toute | Garder une copie, l'envoyer en pièce jointe |

## Envoyer vers un autre appareil avec QRShare

[QRShare](https://github.com/s-celles/QRShare) est une application web
compagnon qui transfère des fichiers entre deux appareils par **QR codes
animés** — sans compte, sans cloud, même sans aucun réseau — ou par une
connexion directe de pair à pair.
[Progressive Web Office](https://github.com/s-celles/progressive-web-office)
l'utilise de la même façon.

### Envoyer

1. Cliquez sur **📲 Envoyer vers un appareil**.
2. Choisissez le **transfert** :
   - **Sans réseau uniquement (QR codes)** — le notebook ne passe jamais par
     un réseau ;
   - **Sans réseau de préférence** (par défaut) — les QR codes sont conseillés,
     les modes réseau restent possibles ;
   - **Tous les modes** — QRShare peut proposer une connexion directe pour les
     gros notebooks.
3. Cliquez sur **Envoyer avec QRShare**. QRShare s'ouvre avec le notebook
   (`notebook.cascad.json`) prêt à être envoyé : ni téléchargement ni envoi
   sur Internet.

Si le QRShare utilisé ne sait pas recevoir de fichiers d'autres applications,
ou ne répond pas, le notebook est téléchargé et QRShare ouvre son écran
*Préparer un transfert*, où vous le sélectionnez.

La même fenêtre propose **Partager avec une autre application…** (la feuille
de partage du système, sur téléphones, tablettes et certains ordinateurs) et un
[lien contenant le notebook](#lien-contenant-le-notebook).

### Recevoir

1. Cliquez sur **📥 Recevoir** : QRShare ouvre son écran de réception.
2. Recevez le notebook dans QRShare (scannez les QR codes, ou acceptez la
   connexion).
3. Cliquez sur **Ouvrir dans …** dans QRShare : le notebook s'ouvre dans
   CAScad.

Seuls les fichiers venant de l'adresse de QRShare indiquée dans **Avancé**
sont acceptés, et seulement des notebooks CAScad, Giac ou Xcas.

### Réglages

Dans **Avancé**, vous pouvez utiliser une autre installation de QRShare, par
exemple une copie hébergée sur votre réseau. L'adresse et le choix du
transfert sont mémorisés sur cet appareil.

QRShare et CAScad sont des applications distinctes, toutes deux sous licence
GNU AGPL-3.0 : CAScad ouvre les pages publiques de QRShare et échange le
fichier avec lui dans le navigateur (protocole de transfert entre
applications de QRShare, version 1).

## Lien contenant le notebook

La fenêtre **📲 Envoyer vers un appareil** affiche un lien qui contient le
notebook lui-même, compressé, après le `#` de l'adresse (`…/CAScad/#nb=…`).
Les navigateurs n'envoient jamais cette partie à un serveur : le notebook
n'est stocké nulle part ailleurs que dans le lien. Cliquez sur **Copier le
lien** et collez-le dans un message, un courriel ou une discussion.

- Au-delà d'environ 8 Ko, certaines messageries ou certains clients de
  courriel peuvent couper le lien : envoyez plutôt le fichier, ou utilisez
  QRShare.
- Toute personne qui a le lien peut ouvrir le notebook.
- Le lien garde les cellules et leur contenu, mais pas leurs réglages
  (masquée, désactivée, verrouillée) ni le noyau.

Avec **📤 Partager** (sur les appareils qui ont une feuille de partage),
CAScad partage le fichier du notebook, ou ce lien quand les fichiers ne
peuvent pas être partagés.

## QR codes dans CAScad

**📤 Partager QR** affiche le notebook sous forme de QR codes à scanner avec
**📷 Scanner QR** sur un autre appareil qui utilise CAScad.

- Un petit notebook tient dans un seul QR code (un lien).
- Un notebook plus grand est affiché en **QR codes animés** : gardez la caméra
  sur l'écran jusqu'à ce que la barre de progression soit pleine. Les codes
  *fontaine* (par défaut) permettent de commencer à tout moment et de manquer
  des images ; les codes *séquentiels* sont des morceaux numérotés. Réglez la
  vitesse (images par seconde) et la taille des morceaux si la caméra a du mal.
- Avec un **mot de passe**, le notebook est chiffré (AES-GCM, clé dérivée du
  mot de passe) ; il est demandé à la réception. Le mot de passe n'est jamais
  mis dans les QR codes ni envoyé où que ce soit.

## Du téléphone vers l'ordinateur (P2P)

Pour un ordinateur sans caméra, un téléphone peut envoyer son notebook par une
connexion WebRTC directe :

1. Sur l'**ordinateur**, cliquez sur **📲 Recevoir du téléphone** : un QR code
   s'affiche.
2. Sur le **téléphone**, cliquez sur **📷 Scanner QR** et scannez-le.
3. Les deux appareils affichent le même **code à 4 chiffres** : vérifiez
   qu'ils sont identiques.
4. Le notebook est envoyé et s'ouvre sur l'ordinateur.

Les deux appareils ont besoin d'un accès à Internet : ils se trouvent grâce à
un serveur de mise en relation public (PeerJS) et à un serveur STUN, puis le
notebook passe directement de l'un à l'autre par un canal WebRTC chiffré.
L'ordinateur attend le téléphone pendant 5 minutes.
