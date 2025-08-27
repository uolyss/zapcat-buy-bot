# Zapcat Buy Bot (Telegram)

Bot gratuit & personnalisable qui publie un message façon **Wen Buy!** à chaque achat de **ZAPCAT**.

## Variables d'environnement
Voir `.env.example`.

## Déploiement (Render)
1. Crée un repo GitHub et push ces fichiers.
2. Va sur https://render.com → New + Web Service → Connecte ton repo.
3. Runtime: Node 18+, Build command: `npm install`, Start command: `npm start`.
4. Ajoute les variables d'env depuis `.env.example`.
5. Déploie. Laisse tourner (free tier OK).

## Notes
- Anti-doublons simple par `lastTx` (mémoire). En cas de redémarrage, un doublon léger peut arriver.
- Tu peux ajuster l'esthétique du message dans `index.js` (emojis, lignes, etc.).
