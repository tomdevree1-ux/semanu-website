/**
 * Localized copy for every outgoing email (DE/FR/EN), approved by Tom.
 *
 * PURE data module (no server-only) so the webhook, the outbox worker and the
 * preview script all read from one place. House copy rules apply: no dashes, no
 * hyphenated compounds ("Add on", "Email"), no comma before a coordinating
 * conjunction, Swiss "ss", French typographic apostrophes.
 *
 * Sign off is added by ./branded (localized "Tom von amai!"). Greeting is built
 * by greet(). To add a language: add its block to each table below + to SIGNOFF
 * in ./branded.
 */
import type { EmailLocale } from './branded';

const HI: Record<EmailLocale, string> = { de: 'Hallo', fr: 'Bonjour', en: 'Hi', es: 'Hola', nl: 'Hallo' };

/** Build the greeting line, e.g. greet('de','Tom') => "Hallo Tom,". */
export function greet(locale: EmailLocale, name?: string | null): string {
  const n = (name ?? '').trim();
  return `${HI[locale]}${n ? ' ' + n : ''},`;
}

/** 1. Order confirmation (customer, sent from the Stripe webhook after payment). */
export const CONFIRMATION: Record<
  EmailLocale,
  { subject: string; paragraphs: string[]; aboLabel: string; addonSub: string; questions: string }
> = {
  de: {
    subject: 'Willkommen bei amai! Ihr Website Abo ist aktiv',
    paragraphs: [
      'vielen Dank für Ihr Vertrauen. Ihr Website Abo ist nun aktiv.',
      'In den nächsten Werktagen melde ich mich persönlich bei Ihnen, um Ihre Inhalte, Wünsche und nächsten Schritte zu besprechen. So stellen wir sicher, dass Ihre neue Website gut zu Ihrem Unternehmen passt und von Anfang an professionell wirkt.',
    ],
    aboLabel: 'Ihr Abo',
    addonSub: 'Inklusive Add on: Logo und Markenrichtlinien.',
    questions: 'Wenn Sie in der Zwischenzeit Fragen haben, erreichen Sie mich jederzeit unter hello@amai.ch.',
  },
  fr: {
    subject: 'Bienvenue chez amai! Votre abonnement website est actif',
    paragraphs: [
      'merci beaucoup pour votre confiance. Votre abonnement website est maintenant actif.',
      'Dans les prochains jours ouvrables, je vous contacterai personnellement afin de discuter de vos contenus, de vos souhaits et des prochaines étapes. L’objectif est de créer un site web qui correspond vraiment à votre entreprise et qui donne une impression professionnelle dès le départ.',
    ],
    aboLabel: 'Votre abonnement',
    addonSub: 'Add on inclus: logo et charte de marque.',
    questions: 'Si vous avez des questions entre temps, vous pouvez me joindre à tout moment à hello@amai.ch.',
  },
  en: {
    subject: 'Welcome to amai! Your website subscription is active',
    paragraphs: [
      'thank you for your trust. Your website subscription is now active.',
      'Over the next few business days, I will personally get in touch to discuss your content, wishes and next steps. This helps make sure your new website fits your business and makes a professional impression from the start.',
    ],
    aboLabel: 'Your subscription',
    addonSub: 'Add on included: logo and brand guidelines.',
    questions: 'If you have any questions in the meantime, you can always reach me at hello@amai.ch.',
  },
  es: {
    subject: 'Bienvenido a amai! Su suscripción website está activa',
    paragraphs: [
      'gracias por su confianza. Su suscripción website ya está activa.',
      'En los próximos días laborables me pondré en contacto con usted personalmente, para hablar de sus contenidos, deseos y próximos pasos. Así nos aseguramos de que su nueva web encaje bien con su empresa y transmita profesionalidad desde el principio.',
    ],
    aboLabel: 'Su suscripción',
    addonSub: 'Add on incluido: logotipo y directrices de marca.',
    questions: 'Si tiene preguntas mientras tanto, puede contactarme en cualquier momento en hello@amai.ch.',
  },
  nl: {
    subject: 'Welkom bij amai! Uw website abonnement is actief',
    paragraphs: [
      'hartelijk dank voor uw vertrouwen. Uw website abonnement is nu actief.',
      'In de komende werkdagen neem ik persoonlijk contact met u op, om uw content, wensen en volgende stappen te bespreken. Zo zorgen we ervoor dat uw nieuwe website goed bij uw onderneming past en vanaf het begin professioneel overkomt.',
    ],
    aboLabel: 'Uw abonnement',
    addonSub: 'Add on inbegrepen: logo en merkrichtlijnen.',
    questions: 'Als u ondertussen vragen hebt, kunt u mij altijd bereiken via hello@amai.ch.',
  },
};

/** 2. Password reset (portal account). */
export const RESET: Record<
  EmailLocale,
  { subject: string; paragraphs: string[]; ctaLabel: string; after: string }
> = {
  de: {
    subject: 'Setzen Sie Ihr amai! Passwort zurück',
    paragraphs: [
      'wir haben eine Anfrage erhalten, Ihr amai! Passwort zurückzusetzen.',
      'Mit dem Button unten können Sie ein neues Passwort wählen. Aus Sicherheitsgründen ist dieser Link nur begrenzt gültig.',
    ],
    ctaLabel: 'Passwort zurücksetzen',
    after: 'Wenn Sie keine Zurücksetzung angefordert haben, können Sie diese Email ignorieren. Ihr Konto bleibt unverändert.',
  },
  fr: {
    subject: 'Réinitialisez votre mot de passe amai!',
    paragraphs: [
      'nous avons reçu une demande de réinitialisation de votre mot de passe amai!.',
      'Vous pouvez choisir un nouveau mot de passe avec le bouton ci dessous. Pour votre sécurité, ce lien reste valable seulement pour une durée limitée.',
    ],
    ctaLabel: 'Réinitialiser le mot de passe',
    after: 'Si vous n’avez pas demandé de réinitialisation, vous pouvez ignorer cet email. Votre compte reste inchangé.',
  },
  en: {
    subject: 'Reset your amai! password',
    paragraphs: [
      'we received a request to reset your amai! password.',
      'You can choose a new password using the button below. For your security, this link will only be valid for a limited time.',
    ],
    ctaLabel: 'Reset password',
    after: 'If you did not request a password reset, you can safely ignore this email. Your account will remain unchanged.',
  },
  es: {
    subject: 'Restablezca su contraseña de amai!',
    paragraphs: [
      'hemos recibido una solicitud para restablecer su contraseña de amai!.',
      'Con el botón de abajo puede elegir una nueva contraseña. Por razones de seguridad, este enlace solo es válido durante un tiempo limitado.',
    ],
    ctaLabel: 'Restablecer la contraseña',
    after: 'Si no ha solicitado un restablecimiento, puede ignorar este email. Su cuenta permanece sin cambios.',
  },
  nl: {
    subject: 'Stel uw amai! wachtwoord opnieuw in',
    paragraphs: [
      'we hebben een verzoek ontvangen om uw amai! wachtwoord opnieuw in te stellen.',
      'Met de knop hieronder kunt u een nieuw wachtwoord kiezen. Om veiligheidsredenen is deze link slechts beperkt geldig.',
    ],
    ctaLabel: 'Wachtwoord opnieuw instellen',
    after: 'Als u geen aanvraag hebt gedaan, kunt u deze email negeren. Uw account blijft ongewijzigd.',
  },
};

/** 3. Platform invite (portal account). */
export const INVITE: Record<
  EmailLocale,
  { subject: string; paragraphs: string[]; ctaLabel: string; after: string }
> = {
  de: {
    subject: 'Sie wurden zu amai! eingeladen',
    paragraphs: [
      'Sie wurden zur amai! Plattform eingeladen.',
      'Richten Sie Ihr Konto mit dem Button unten ein. Sobald Ihr Konto bereit ist, haben Sie Zugang zu Ihrem Portal und verfolgen alles rund um Ihre Website an einem Ort.',
    ],
    ctaLabel: 'Einladung annehmen',
    after: 'Bei Fragen können Sie einfach auf diese Email antworten.',
  },
  fr: {
    subject: 'Vous êtes invité chez amai!',
    paragraphs: [
      'vous avez été invité sur la plateforme amai!.',
      'Configurez votre compte avec le bouton ci dessous. Une fois votre compte prêt, vous accédez à votre portail et suivez tout ce qui concerne votre site web au même endroit.',
    ],
    ctaLabel: 'Accepter l’invitation',
    after: 'Pour toute question, vous pouvez simplement répondre à cet email.',
  },
  en: {
    subject: 'You have been invited to amai!',
    paragraphs: [
      'you have been invited to the amai! platform.',
      'Set up your account using the button below. Once your account is ready, you can access your portal and follow everything related to your website in one place.',
    ],
    ctaLabel: 'Accept invitation',
    after: 'If you have any questions, feel free to reply to this email.',
  },
  es: {
    subject: 'Le han invitado a amai!',
    paragraphs: [
      'ha sido invitado a la plataforma amai!.',
      'Configure su cuenta con el botón de abajo. En cuanto su cuenta esté lista, tendrá acceso a su portal y podrá seguir todo lo relacionado con su web en un solo lugar.',
    ],
    ctaLabel: 'Aceptar la invitación',
    after: 'Si tiene preguntas, puede responder simplemente a este email.',
  },
  nl: {
    subject: 'U bent uitgenodigd voor amai!',
    paragraphs: [
      'u bent uitgenodigd voor het amai! platform.',
      'Stel uw account in met de knop hieronder. Zodra uw account klaar is, hebt u toegang tot uw portaal en volgt u alles rondom uw website op één plek.',
    ],
    ctaLabel: 'Uitnodiging accepteren',
    after: 'Bij vragen kunt u gewoon op deze email antwoorden.',
  },
};

/** 4. Free website analysis delivery (prospect; PDF attached). */
export const REPORT: Record<EmailLocale, { subject: string; paragraphs: string[] }> = {
  de: {
    subject: 'Ihre Website Analyse ist bereit',
    paragraphs: [
      'Ihre kostenlose Website Analyse ist fertig. Sie finden sie als PDF im Anhang.',
      'Ich habe mir Ihre Website angeschaut und einige konkrete Punkte zusammengefasst, mit denen Sie Ihre Sichtbarkeit, Ladezeit und Wirkung verbessern können.',
      'Wenn Sie möchten, bespreche ich die Ergebnisse gerne persönlich mit Ihnen und zeige, welche Schritte am meisten Wirkung hätten. Antworten Sie einfach auf diese Email.',
    ],
  },
  fr: {
    subject: 'Votre analyse de site web est prête',
    paragraphs: [
      'votre analyse gratuite de site web est prête. Vous la trouverez en pièce jointe au format PDF.',
      'J’ai examiné votre site web et résumé quelques points concrets qui vous permettent d’améliorer votre visibilité, votre temps de chargement et votre impact.',
      'Si vous le souhaitez, je discute volontiers des résultats avec vous personnellement et vous montre les étapes qui auraient le plus d’effet. Répondez simplement à cet email.',
    ],
  },
  en: {
    subject: 'Your website analysis is ready',
    paragraphs: [
      'your free website analysis is ready. You will find it attached as a PDF.',
      'I took a look at your website and summarised a few concrete points that help you improve your visibility, loading speed and impact.',
      'If you like, I am happy to go through the results with you personally and show which steps would have the most effect. Just reply to this email.',
    ],
  },
  es: {
    subject: 'Su análisis de sitio web está listo',
    paragraphs: [
      'su análisis gratuito de sitio web está listo. Lo encontrará adjunto en formato PDF.',
      'he revisado su sitio web y he resumido algunos puntos concretos con los que puede mejorar su visibilidad, su tiempo de carga y su impacto.',
      'Si lo desea, comento los resultados con usted personalmente con mucho gusto y le muestro qué pasos tendrían más impacto. Responda simplemente a este email.',
    ],
  },
  nl: {
    subject: 'Uw website analyse is klaar',
    paragraphs: [
      'uw gratis website analyse is klaar. U vindt ze als PDF in de bijlage.',
      'ik heb uw website bekeken en enkele concrete punten samengevat waarmee u uw zichtbaarheid, laadtijd en impact kunt verbeteren.',
      'Als u wilt, bespreek ik de resultaten graag persoonlijk met u en laat ik zien welke stappen het meeste effect zouden hebben. Antwoord gewoon op deze email.',
    ],
  },
};
