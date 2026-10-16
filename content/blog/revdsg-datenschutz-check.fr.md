---
title: "Votre site respecte t il la loi suisse sur la protection des données ?"
description: "La nouvelle LPD suisse s'applique depuis le 1er septembre 2023. Beaucoup de sites de PME ne la respectent toujours pas. Ce que la loi exige et comment vous mettre en règle en sept étapes."
date: "2026-09-01"
updated: "2026-09-08"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/revdsg-datenschutz-check-cover.svg"
---

[La loi révisée sur la protection des données](https://www.fedlex.admin.ch/eli/cc/2022/491/de) s'applique depuis le 1er septembre 2023, soit trois ans jour pour jour. Pourtant, beaucoup de sites de PME suisses affichent encore une déclaration de confidentialité copiée quelque part sur le web. Elle cite des outils qui ne tournent pas. Ceux qui tournent vraiment restent invisibles.

Ce n'est presque jamais de la mauvaise volonté. Une agence a construit le site il y a des années puis plus personne n'y a touché. Sauf que la responsabilité ne revient ni à l'agence ni au module de formulaire. Elle vous revient.

**En bref :** un site suisse respecte la nLPD quand quatre choses sont vraies. La déclaration de confidentialité décrit honnêtement quelles données vous collectez et pourquoi. Les formulaires demandent uniquement le nécessaire. Les outils de mesure et de publicité se chargent seulement après un consentement. Et vous savez dans quel pays vos données se trouvent. Les amendes, jusqu'à 250'000 francs, frappent la personne responsable et non l'entreprise.

## Que demande la loi au site d'une PME ?

Quatre obligations concernent presque tous les sites d'entreprise.

Le **devoir d'information** est le plus visible. Quiconque collecte des données personnelles doit dire à l'avance, en langage clair, qui traite ces données, dans quel but et qui les reçoit. C'est le rôle de la déclaration de confidentialité. Elle doit correspondre à la réalité de votre site plutôt qu'à un modèle générique.

Vient ensuite le **droit d'accès**. Si une personne demande quelles données vous détenez sur elle, vous avez en principe 30 jours pour répondre gratuitement. Cela suppose de savoir où ces données se trouvent.

En cas de **violation de la sécurité** avec un risque élevé, vous annoncez l'incident au [préposé fédéral à la protection des données](https://www.edoeb.admin.ch) dans les meilleurs délais. Un formulaire de contact piraté ou un export de newsletter arrivé dans la mauvaise boîte peut déjà entrer dans cette catégorie.

Le **registre des activités de traitement** reste facultatif pour les entreprises de moins de 250 collaborateurs, tant qu'aucune donnée sensible et aucun profilage à risque élevé ne sont en jeu. La plupart des PME en sont donc dispensées. Tenir cette liste garde pourtant son utilité, car sans elle les trois autres obligations deviennent difficiles à assumer.

<img src="/blog/revdsg-datenschutz-check-visual.svg" alt="Deux sites comparés : à gauche une déclaration copiée avec du traçage qui se charge sans consentement, à droite un site conforme avec une vraie déclaration, un dialogue de consentement et un hébergement dans l'UE" style="display:block;width:100%;height:auto;margin:2.5rem 0;border-radius:0.5rem;border:1px solid #E9EEF6" />

## Qui est concerné et combien coûte une infraction ?

Toute entreprise ayant son siège en Suisse qui traite des données personnelles est concernée. Un formulaire de contact suffit. Même un site vitrine enregistre des adresses IP sur le serveur. Ce sont aussi des données personnelles.

Si vous vendez également à des clients dans l'UE ou si vous leur envoyez des newsletters, le RGPD s'applique en parallèle. Ses exigences en matière de consentement sont plus strictes. Respecter la seule loi suisse ne suffit alors pas.

Les amendes forment un premier volet : jusqu'à 250'000 francs, prononcées contre la personne physique responsable plutôt que contre la société. Vous ne pouvez donc pas les reporter sur l'entreprise. Dans les faits, les amendes restent rares et la loi s'applique sur plainte. Le dommage le plus réaliste est ailleurs. Les clients professionnels et les acheteurs publics demandent de plus en plus une preuve avant de signer. Une déclaration visiblement reprise du site d'un tiers fait alors mauvaise impression.

## Où se trouvent vos données et pourquoi cela compte ?

Les données personnelles peuvent quitter la Suisse si le pays de destination offre une protection adéquate. C'est le cas pour l'EEE. Pour les États Unis, le [Swiss US Data Privacy Framework](https://www.edoeb.admin.ch/en/15082024-new-swiss-us-data-privacy-framework) s'applique depuis le 15 septembre 2024 : vous pouvez transférer vers un prestataire américain certifié sans garantie supplémentaire, vers un prestataire non certifié vous ne le pouvez pas. Très peu d'exploitants de sites connaissent cette nuance.

Chez <span class="brand-mark">amai<span class="spark">!</span></span> nous hébergeons donc dans l'UE. La base de données et le stockage tournent sur Supabase dans une région européenne, la diffusion passe par Cloudflare, les emails par Resend. Les trois figurent nommément dans notre propre déclaration, finalité ainsi qu'emplacement compris. Voilà le niveau de détail que vise la loi.

## Comment mettre votre site en conformité en sept étapes ?

1. **Faites l'inventaire.** Listez chaque endroit où votre site collecte des données : formulaire de contact, newsletter, prise de rendez vous, chat, statistiques, cartes intégrées, vidéos et polices chargées depuis des serveurs tiers. La liste dépasse presque toujours ce que l'on imaginait.
2. **Réécrivez la déclaration.** Ne la copiez pas. Elle nomme vos outils réels, la finalité, la durée de conservation, les destinataires ainsi que l'adresse de contact pour les demandes d'accès. Une déclaration qui cite des services jamais utilisés constitue elle même une information fausse.
3. **Allégez vos formulaires.** Chaque champ demande une justification. Le numéro de téléphone, la date de naissance et la taille de l'entreprise s'accumulent vite alors qu'une demande d'offre exige un nom et une adresse email. Moins de champs augmente au passage le nombre de demandes.
4. **Ne chargez le traçage qu'après consentement.** Google Analytics, le pixel Meta et les balises de conversion Google Ads se placent derrière le dialogue de consentement. L'essentiel : ce dialogue doit vraiment retenir les scripts. Une bannière qui se contente d'informer pendant que tout se charge déjà en dessous relève du décor.
5. **Clarifiez les transferts à l'étranger.** Demandez à votre hébergeur puis à votre prestataire de newsletter où se trouvent les serveurs. Si quelque chose se trouve aux États Unis, vérifiez la certification sous le Data Privacy Framework. Comptez dix minutes par prestataire.
6. **Fixez les processus.** Une adresse pour les demandes d'accès que quelqu'un lit vraiment. Une note interne sur la personne qui alerte le préposé fédéral en cas de fuite. Trente jours paraissent confortables jusqu'au jour où la demande arrive pendant les vacances.
7. **Recontrôlez régulièrement.** Un nouveau module, une vidéo intégrée ou un compte publicitaire supplémentaire amène du traçage inédit. Sans contrôle, votre déclaration redevient fausse en six mois.

Ce dernier point, nous l'automatisons. Notre Feedback Loop observe chaque mois comment vous apparaissez sur Google ainsi que dans les réponses IA. Dans le même passage nous vérifions si de nouveaux scripts sont apparus sur le site ou si la déclaration s'est éloignée de la réalité. Vous trouvez ainsi l'écart vous même plutôt qu'une cliente le trouve pour vous.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Votre site respecte la loi suisse ?</strong>
  <p style="margin:0 0 1rem;color:#5B667C">Nous le vérifions gratuitement. Vous saurez quels scripts se chargent sans consentement, si votre déclaration correspond au site et où vos données se trouvent. Vous recevez aussi la liste des points à corriger en premier.</p>
  <a href="/fr/website-analyse"><strong>Demander un check gratuit →</strong></a>
</div>

## Une bannière cookies, elle est obligatoire en Suisse ?

La loi suisse n'exige pas de consentement pour les cookies purement techniques. La loi sur les télécommunications demande seulement d'informer les visiteurs puis de leur permettre de refuser. Un panier d'achat ou un choix de langue peut donc fonctionner sans clic.

La mesure d'audience et la publicité relèvent d'une autre logique. Dès que Google Analytics, le remarketing Ads ou un pixel entre en jeu, des données partent chez des tiers. Pour un public venant de l'UE, il vous faut alors un vrai consentement. Concrètement : un dialogue sobre avec des boutons d'égale importance pour accepter puis pour refuser, sans procédés trompeurs.

Pour Google Ads, cela produit un effet secondaire qui surprend beaucoup d'annonceurs. Sans consent mode correctement branché, vous perdez des données de conversion et vos campagnes optimisent sur des trous. Protection des données propre et publicité qui fonctionne relèvent ici du même travail.

## Questions fréquentes

**La loi s'applique aussi à mon petit site sans boutique ?**
Oui. Elle s'applique dès que des données personnelles sont traitées et ne fixe aucune taille minimale d'entreprise. Un formulaire de contact ou des journaux serveur contenant des adresses IP suffisent déjà. Les petites structures sont uniquement dispensées du registre des traitements tant qu'elles ne traitent pas de données sensibles.

**Une bannière cookies, elle est vraiment nécessaire ?**
Pas pour les cookies strictement nécessaires. Dès que vous chargez des outils de mesure, des pixels publicitaires ou des services intégrés de tiers, il vous faut un dialogue de consentement qui retient réellement ces scripts jusqu'à l'accord du visiteur. Pour un public dans l'UE, le RGPD s'ajoute par dessus.

**Combien coûte une infraction à la loi suisse sur la protection des données ?**
Les violations intentionnelles du devoir d'information ou du droit d'accès peuvent être sanctionnées par des amendes allant jusqu'à 250'000 francs. L'amende vise la personne physique responsable au sein de l'entreprise. La sanction suit en général une plainte. Le dommage le plus fréquent reste la perte de confiance des clients.

**Mon site peut être hébergé hors de Suisse ?**
Oui. Un hébergement dans l'EEE ne pose pas de problème puisqu'un niveau de protection adéquat y est reconnu. Pour un prestataire aux États Unis, le transfert sans garantie supplémentaire suppose une certification sous le Swiss US Data Privacy Framework. Dans tous les cas l'emplacement figure dans votre déclaration.

**Une déclaration issue d'un générateur suffit ?**
Comme point de départ oui, comme produit fini rarement. Un générateur ne connaît pas vos outils. Une déclaration qui cite des services que vous n'employez pas manque au devoir d'information. Il en va de même si elle passe sous silence ce qui tourne en arrière plan. Le vrai travail consiste à confronter le texte à ce qui se charge réellement sur vos pages.

*Cet article est une orientation générale et ne constitue pas un conseil juridique.*

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"La loi s'applique aussi à mon petit site sans boutique ?","acceptedAnswer":{"@type":"Answer","text":"Oui. Elle s'applique dès que des données personnelles sont traitées et ne fixe aucune taille minimale d'entreprise. Un formulaire de contact ou des journaux serveur contenant des adresses IP suffisent déjà. Les petites structures sont uniquement dispensées du registre des traitements tant qu'elles ne traitent pas de données sensibles."}},{"@type":"Question","name":"Une bannière cookies, elle est vraiment nécessaire ?","acceptedAnswer":{"@type":"Answer","text":"Pas pour les cookies strictement nécessaires. Dès que vous chargez des outils de mesure, des pixels publicitaires ou des services intégrés de tiers, il vous faut un dialogue de consentement qui retient réellement ces scripts jusqu'à l'accord du visiteur. Pour un public dans l'UE, le RGPD s'ajoute par dessus."}},{"@type":"Question","name":"Combien coûte une infraction à la loi suisse sur la protection des données ?","acceptedAnswer":{"@type":"Answer","text":"Les violations intentionnelles du devoir d'information ou du droit d'accès peuvent être sanctionnées par des amendes allant jusqu'à 250'000 francs. L'amende vise la personne physique responsable au sein de l'entreprise. La sanction suit en général une plainte. Le dommage le plus fréquent reste la perte de confiance des clients."}},{"@type":"Question","name":"Mon site peut être hébergé hors de Suisse ?","acceptedAnswer":{"@type":"Answer","text":"Oui. Un hébergement dans l'EEE ne pose pas de problème puisqu'un niveau de protection adéquat y est reconnu. Pour un prestataire aux États Unis, le transfert sans garantie supplémentaire suppose une certification sous le Swiss US Data Privacy Framework. Dans tous les cas l'emplacement figure dans votre déclaration."}},{"@type":"Question","name":"Une déclaration issue d'un générateur suffit ?","acceptedAnswer":{"@type":"Answer","text":"Comme point de départ oui, comme produit fini rarement. Un générateur ne connaît pas vos outils. Une déclaration qui cite des services que vous n'employez pas manque au devoir d'information. Il en va de même si elle passe sous silence ce qui tourne en arrière plan. Le vrai travail consiste à confronter le texte à ce qui se charge réellement sur vos pages."}}]}
</script>
