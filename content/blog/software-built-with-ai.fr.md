---
title: "Logiciel construit avec l'IA : les cinq risques"
description: "Un logiciel construit avec l'IA tourne en démo et échoue sur l'invisible : validation, API ouvertes, fuites de données, RGPD. Les cinq risques expliqués."
date: "2026-08-24"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/software-built-with-ai-cover.jpg"
---

Un formulaire de devis, un portail client, un outil de planning : avec les outils de code IA, c'est opérationnel en quelques jours au lieu de plusieurs mois. C'est un vrai progrès. Nous ne conseillons à personne de revenir en arrière. Pourtant, nous regardons sous le capot de ces applications par métier et le même tableau ressort à chaque fois. Le logiciel fait ce que la démo promet. Les problèmes se trouvent dans tout ce que la démo ne montre pas.

**En bref :** Un logiciel construit avec l'IA tourne le plus souvent sans accroc en démo et échoue sur ce qu'on ne voit pas : validation des saisies absente, API ouvertes à qui connaît l'adresse, données personnelles qui fuient, obligations RGPD couvertes nulle part et logique métier qui tourne dans le navigateur au lieu du serveur. [Des chercheurs de NYU ont constaté en 2021](https://arxiv.org/abs/2108.09293) qu'environ quarante pour cent du code écrit par un assistant IA dans leurs scénarios de test contenait des vulnérabilités. Chacune de ces failles peut être repérée et corrigée, de préférence avant la mise en ligne.

## Tout le monde construit soi-même et ce n'est pas un mal

La barrière pour créer un logiciel s'est effondrée en deux ans. Ce qui demandait une équipe de développement et six mois, un collaborateur habile le fait aujourd'hui en quelques semaines. Pour une PME, c'est une chance : vous connaissez votre fonctionnement mieux que n'importe quel prestataire et vous pouvez enfin créer des outils qui collent exactement à votre processus.

Le problème n'est pas la construction. Les outils optimisent pour du code qui fonctionne, pas pour du code sûr. La personne qui construit n'a le plus souvent pas le bagage pour voir la différence. L'application tourne, tout le monde est content et personne ne pose la question qu'un développeur professionnel pose en premier : que se passe-t-il quand quelqu'un l'utilise mal ?

## Les cinq failles qui reviennent toujours

Voici les cinq schémas que nous rencontrons le plus souvent dans les revues d'applications construites en interne. Chacun est invisible en démo. Chacun fait mal après la mise en ligne.

### 1. Les saisies ne sont pas contrôlées

Un formulaire attend un nom et une adresse e-mail. Que se passe-t-il si quelqu'un y colle un bout de code, un fichier de 2 gigaoctets ou un texte de dix mille caractères ? Sans validation, tout cela atterrit sans filtre dans votre base de données ou dans les e-mails envoyés à votre équipe. Cela commence par du bruit dans vos données. Cela finit par un attaquant qui lit votre base via un champ de saisie.

### 2. L'API est ouverte à qui connaît l'adresse

Derrière chaque application se trouve une couche qui lit et écrit les données. Les outils IA montent souvent cette couche sans contrôler qui frappe à la porte. Qui connaît l'adresse ou la devine peut alors consulter directement commandes, données clients ou prix sans jamais se connecter. De plus, l'adresse figure en clair dans le code que chaque navigateur reçoit.

### 3. Les données personnelles fuient par la porte de côté

Des messages d'erreur qui affichent la fiche client complète, des boutons d'export sans contrôle des droits, des fichiers de logs pleins d'adresses e-mail : les applications construites en interne fuient rarement par la porte d'entrée et presque toujours par une porte de côté oubliée. Une fuite suffit pour une notification à l'autorité de protection des données et une conversation pénible avec chaque client concerné.

### 4. Le RGPD n'est couvert nulle part

Qui traite les données, où sont-elles stockées, combien de temps et sur quelle base légale ? Un outil IA ne pose pas ces questions et la personne qui construit le plus souvent non plus. Et voilà une application qui envoie des données clients vers un service hors de l'UE. Sans contrat de sous-traitance, sans mention dans la politique de confidentialité et sans que personne ne s'en rende compte.

### 5. La logique métier tourne dans le navigateur

Le classique des configurateurs et des outils de devis : le calcul de prix se trouve dans le code envoyé au visiteur. Quiconque a un navigateur peut lire et modifier ce code. Au mieux, un concurrent découvre votre structure de remises. Au pire, quelqu'un commande à un prix qu'il a saisi lui-même. Vous avez alors un problème juridique, car la commande est confirmée.

## Pourquoi la démo ne vous dit rien

Une démo montre le chemin attendu : des saisies correctes, un utilisateur bienveillant et aucun attaquant. Précisément les trois hypothèses qui tombent après la mise en ligne. Les vrais utilisateurs font l'inattendu, les bots scannent chaque URL publique en quelques jours et les formulaires reçoivent leur premier spam automatisé dans la semaine. La question n'est pas de savoir si cela tourne mal. La question est de savoir si quelqu'un le remarque quand cela arrive. C'est rarement prévu dans les applications construites en interne : journalisation et alertes manquent presque toujours.

## Ce que vous pouvez vérifier vous-même aujourd'hui

Quatre contrôles qui ne demandent aucun bagage technique. Si vous échouez à l'un d'eux, vous savez qu'il y a plus.

1. **Saisissez quelque chose de faux dans chaque champ.** Du texte là où un chiffre est attendu, un champ obligatoire vide, un nom absurdement long. Recevez-vous des messages d'erreur propres ou l'application se comporte-t-elle bizarrement ?
2. **Ouvrez l'application en navigation privée.** Collez l'adresse d'une page qui devrait se trouver derrière la connexion. Si vous voyez quand même des données, la porte est ouverte.
3. **Demandez les contrats de sous-traitance.** Qui en a un avec chaque service externe utilisé par l'application ? Le silence est aussi une réponse.
4. **Demandez où tourne le calcul de prix.** Si la réponse est « dans l'application », demandez précisément : sur le serveur ou dans le navigateur ?

## Faites-le tester avant la mise en ligne

Construire soi-même et faire tester par des professionnels ne s'excluent pas. Les deux vont ensemble. Une bonne revue couvre six domaines : sécurité, données personnelles et RGPD, comportement fonctionnel avec scénarios de test, architecture et logique, performances et usage mobile, ainsi que la continuité. Le résultat est un rapport qui indique pour chaque constat ce qui est critique et ce qui peut attendre. Votre équipe continue ensuite à construire, désormais avec les failles refermées.

L'application touche des clients, de l'argent ou des données personnelles et vous voulez une base solide ? Vous pouvez aussi faire développer un [logiciel d'entreprise sur mesure](/fr/services/business-software) qui intègre validation, droits d'accès et RGPD dès la première ligne de code.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Construit vous-même et presque prêt pour la mise en ligne ?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> développe des logiciels d'entreprise sur mesure propulsés par l'IA. Validation, contrôle des droits et RGPD y sont intégrés dès le départ. Dites-nous ce que vous avez construit ou voulez construire. Ensemble, nous définissons la prochaine étape.</p>
  <a href="/fr/contact"><strong>Prendre contact →</strong></a>
</div>

## Questions fréquentes

**Un logiciel construit avec l'IA est-il dangereux ?**
Pas par définition. La probabilité de failles est toutefois plus élevée. Des chercheurs de NYU ont constaté en 2021 qu'environ quarante pour cent du code écrit par un assistant IA contenait des vulnérabilités. Les outils optimisent pour du code qui fonctionne, pas pour du code sûr.

**Dois-je alors arrêter de construire avec l'IA ?**
Non. Pour beaucoup d'outils internes, c'est la voie la plus rapide. Faites cependant tester toute application qui touche des clients, de l'argent ou des données personnelles avant sa mise en ligne. Exactement comme on fait inspecter une cuisine rénovée soi-même avant de raccorder le gaz.

**Que contrôle exactement une revue logicielle ?**
Six domaines : sécurité, données personnelles et RGPD, comportement fonctionnel avec scénarios de test, architecture et logique, performances et usage mobile, ainsi que la continuité. Le résultat est un rapport avec une liste de priorités à trois niveaux.

**Où le calcul de prix doit-il tourner ?**
Sur le serveur. Le navigateur affiche le prix. Le serveur le recalcule et le confirme. Ainsi, personne ne peut commander à un prix qu'il a modifié lui-même.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Un logiciel construit avec l'IA est-il dangereux ?","acceptedAnswer":{"@type":"Answer","text":"Pas par définition. La probabilité de failles est toutefois plus élevée. Des chercheurs de NYU ont constaté en 2021 qu'environ quarante pour cent du code écrit par un assistant IA contenait des vulnérabilités. Les outils optimisent pour du code qui fonctionne, pas pour du code sûr."}},{"@type":"Question","name":"Dois-je alors arrêter de construire avec l'IA ?","acceptedAnswer":{"@type":"Answer","text":"Non. Pour beaucoup d'outils internes, c'est la voie la plus rapide. Faites cependant tester toute application qui touche des clients, de l'argent ou des données personnelles avant sa mise en ligne. Exactement comme on fait inspecter une cuisine rénovée soi-même avant de raccorder le gaz."}},{"@type":"Question","name":"Que contrôle exactement une revue logicielle ?","acceptedAnswer":{"@type":"Answer","text":"Six domaines : sécurité, données personnelles et RGPD, comportement fonctionnel avec scénarios de test, architecture et logique, performances et usage mobile, ainsi que la continuité. Le résultat est un rapport avec une liste de priorités à trois niveaux."}},{"@type":"Question","name":"Où le calcul de prix doit-il tourner ?","acceptedAnswer":{"@type":"Answer","text":"Sur le serveur. Le navigateur affiche le prix. Le serveur le recalcule et le confirme. Ainsi, personne ne peut commander à un prix qu'il a modifié lui-même."}}]}
</script>
