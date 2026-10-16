---
title: "¿Cumple tu web la ley suiza de protección de datos?"
description: "La ley suiza revisada de protección de datos se aplica desde el 1 de septiembre de 2023. Muchas webs de pymes siguen sin cumplirla. Qué exige la revDSG y cómo cumplirla en siete pasos."
date: "2026-09-01"
updated: "2026-09-08"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/revdsg-datenschutz-check-cover.svg"
---

[La ley suiza revisada de protección de datos](https://www.fedlex.admin.ch/eli/cc/2022/491/de) se aplica desde el 1 de septiembre de 2023, hoy hace exactamente tres años. Aun así, muchas webs de pymes suizas siguen mostrando una política de privacidad que alguien copió de otro sitio. Nombra herramientas que no se usan. Las que sí funcionan quedan sin mencionar.

Casi nunca es mala fe. Una agencia montó la web hace años y después nadie volvió a mirarla. El detalle es que la responsabilidad no recae en la agencia ni en el plugin del formulario. Recae en ti.

**En resumen:** una web suiza cumple la revDSG cuando se dan cuatro cosas. La política de privacidad describe con honestidad qué datos recoges y para qué. Los formularios piden solo lo necesario. Las herramientas de analítica y de publicidad cargan únicamente después del consentimiento. Y sabes en qué país están tus datos. Las multas de hasta 250'000 francos recaen sobre la persona responsable, no sobre la empresa.

## ¿Qué exige la revDSG a la web de una pyme?

Cuatro obligaciones afectan a casi cualquier web de empresa.

El **deber de informar** es el más visible. Quien recoge datos personales debe decir de antemano, en lenguaje claro, quién trata esos datos, para qué fin y quién los recibe. Para eso sirve la política de privacidad. Tiene que coincidir con la realidad de tu web en lugar de con una plantilla cualquiera.

Luego está el **derecho de acceso**. Si alguien pregunta qué datos tienes sobre él, por regla general dispones de 30 días para responder de forma gratuita. Eso solo funciona si sabes dónde están esos datos.

Ante una **violación de seguridad** con riesgo elevado, notificas el incidente al [comisionado federal de protección de datos](https://www.edoeb.admin.ch) lo antes posible. Un formulario de contacto hackeado o una exportación de newsletter en el buzón equivocado ya puede entrar en esa categoría.

El **registro de actividades de tratamiento** es voluntario para empresas de menos de 250 personas, siempre que no haya datos sensibles ni perfilado de alto riesgo. La mayoría de las pymes queda fuera de esa obligación. Mantener la lista sigue siendo útil, porque sin ella las otras tres obligaciones se vuelven difíciles de cumplir.

<img src="/blog/revdsg-datenschutz-check-visual.svg" alt="Dos webs comparadas: a la izquierda una política copiada con rastreo que carga sin consentimiento, a la derecha una web conforme con política real, diálogo de consentimiento y alojamiento en la UE" style="display:block;width:100%;height:auto;margin:2.5rem 0;border-radius:0.5rem;border:1px solid #E9EEF6" />

## ¿A quién afecta y cuánto cuesta un incumplimiento?

Afecta a toda empresa con sede en Suiza que trate datos personales. Basta con un formulario de contacto. Incluso una web puramente informativa registra direcciones IP en el servidor. Eso también son datos personales.

Si además vendes a clientes en la UE o les envías newsletters, el RGPD se aplica en paralelo. Sus exigencias de consentimiento son más estrictas. Cumplir solo la ley suiza no cierra el tema en ese caso.

Las multas son una parte: hasta 250'000 francos, impuestas a la persona física responsable en lugar de a la sociedad. Así que no puedes trasladarlas a la empresa. En la práctica se multa poco y la ley actúa por denuncia. El daño más realista es otro. Los clientes empresariales y los compradores públicos piden cada vez más una prueba antes de firmar. Una política de privacidad tomada visiblemente de otra web deja entonces mala impresión.

## ¿Dónde están tus datos y por qué importa?

Los datos personales pueden salir de Suiza si el país de destino ofrece una protección adecuada. Para el EEE es el caso. Para Estados Unidos rige desde el 15 de septiembre de 2024 el [Swiss US Data Privacy Framework](https://www.edoeb.admin.ch/en/15082024-new-swiss-us-data-privacy-framework): puedes transferir datos a un proveedor estadounidense certificado sin garantías adicionales, a uno no certificado no. Muy pocos responsables de webs conocen ese matiz.

Por eso en <span class="brand-mark">amai<span class="spark">!</span></span> alojamos en la UE. La base de datos y el almacenamiento corren sobre Supabase en una región europea, la entrega pasa por Cloudflare, el correo por Resend. Los tres aparecen por su nombre en nuestra propia política, incluyendo finalidad además de ubicación. Ese es el nivel de detalle al que apunta la ley.

## ¿Cómo pones tu web en regla en siete pasos?

1. **Haz inventario.** Anota cada punto donde tu web recoge datos: formulario de contacto, newsletter, reserva de citas, chat, estadísticas, mapas incrustados, vídeos y tipografías cargadas desde servidores ajenos. La lista casi siempre resulta más larga de lo que uno pensaba.
2. **Reescribe la política de privacidad.** No la copies. Nombra tus herramientas reales, la finalidad, el plazo de conservación, los destinatarios además de la dirección de contacto para solicitudes de acceso. Una política que enumera servicios que no usas ya es en sí una información falsa.
3. **Adelgaza los formularios.** Cada campo necesita un motivo. El teléfono, la fecha de nacimiento y el tamaño de la empresa se acumulan rápido aunque para una oferta te baste con un nombre y una dirección de email. Menos campos aumentan de paso el número de solicitudes.
4. **Carga el rastreo solo tras el consentimiento.** Google Analytics, el píxel de Meta y las etiquetas de conversión de Google Ads van detrás del diálogo de consentimiento. Lo importante: ese diálogo debe retener de verdad los scripts. Un aviso que solo informa mientras por debajo ya carga todo es puro decorado.
5. **Aclara las transferencias al extranjero.** Pregunta a tu proveedor de alojamiento y al de newsletter dónde están los servidores. Si algo está en Estados Unidos, comprueba la certificación bajo el Data Privacy Framework. Son diez minutos por proveedor.
6. **Fija los procesos.** Una dirección para solicitudes de acceso que alguien lea de verdad. Una nota interna sobre quién avisa al comisionado tras una filtración. Treinta días parecen muchos hasta que la solicitud llega en vacaciones.
7. **Revisa con regularidad.** Un plugin nuevo, un vídeo incrustado o una cuenta publicitaria adicional trae rastreo nuevo. Sin control, tu política vuelve a estar desfasada en medio año.

Ese último punto lo automatizamos. Nuestro Feedback Loop mira cada mes cómo apareces en Google además de en las respuestas de IA. En el mismo repaso comprobamos si han aparecido scripts nuevos en la web o si la política se ha alejado de la realidad. Así encuentras tú el hueco en lugar de que lo encuentre una clienta.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">¿Cumple tu web la revDSG?</strong>
  <p style="margin:0 0 1rem;color:#5B667C">Lo comprobamos gratis. Sabrás qué scripts cargan sin consentimiento, si tu política coincide con la web y dónde están tus datos. Recibes también la lista de puntos que conviene arreglar primero.</p>
  <a href="/es/website-analyse"><strong>Solicitar un check revDSG gratis →</strong></a>
</div>

## ¿Hace falta un aviso de cookies en Suiza?

La ley suiza no exige consentimiento para las cookies puramente técnicas. La ley de telecomunicaciones pide únicamente informar a la visita además de permitir el rechazo. Un carrito de la compra o una preferencia de idioma pueden funcionar sin ningún clic.

La analítica y la publicidad son otra historia. En cuanto entra Google Analytics, el remarketing de Ads o un píxel, hay datos que van a terceros. Para público de la UE necesitas entonces un consentimiento real. En la práctica: un diálogo sobrio con botones igual de visibles para aceptar o rechazar, sin trucos oscuros.

Para Google Ads esto trae un efecto secundario que sorprende a muchos anunciantes. Sin un consent mode bien conectado pierdes datos de conversión y tus campañas acaban optimizando sobre huecos. Protección de datos limpia y publicidad que funciona son aquí el mismo trabajo.

## Preguntas frecuentes

**¿La revDSG se aplica también a mi web pequeña sin tienda?**
Sí. La ley entra en juego en cuanto se tratan datos personales y no fija ningún tamaño mínimo de empresa. Un formulario de contacto o los registros del servidor con direcciones IP ya bastan. Las empresas pequeñas solo quedan exentas del registro de actividades mientras no traten datos sensibles.

**¿Necesito de verdad un aviso de cookies?**
Para las cookies estrictamente necesarias no. En cuanto cargas herramientas de analítica, píxeles publicitarios o servicios incrustados de terceros, necesitas un diálogo de consentimiento que retenga esos scripts hasta que la persona acepte. Para público de la UE se suma además el RGPD.

**¿Cuánto cuesta incumplir la revDSG?**
Las infracciones intencionadas del deber de informar o del derecho de acceso pueden sancionarse con multas de hasta 250'000 francos. La multa apunta a la persona física responsable dentro de la empresa. La sanción suele llegar tras una denuncia. El daño más habitual es la pérdida de confianza de clientes.

**¿Puede alojarse mi web fuera de Suiza?**
Sí. El alojamiento en el EEE no plantea problemas porque allí se reconoce un nivel de protección adecuado. Con proveedores en Estados Unidos solo puedes transferir sin garantías adicionales si están certificados bajo el Swiss US Data Privacy Framework. En cualquier caso la ubicación debe figurar en tu política.

**¿Basta una política de privacidad de un generador?**
Como punto de partida sí, como producto final pocas veces. Un generador no conoce tus herramientas. Una política que enumera servicios que no empleas incumple el deber de informar. Lo mismo ocurre si calla lo que corre por detrás. El trabajo real consiste en contrastar el texto con lo que de verdad se carga en tus páginas.

*Este artículo es una orientación general y no constituye asesoramiento jurídico.*

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"¿La revDSG se aplica también a mi web pequeña sin tienda?","acceptedAnswer":{"@type":"Answer","text":"Sí. La ley entra en juego en cuanto se tratan datos personales y no fija ningún tamaño mínimo de empresa. Un formulario de contacto o los registros del servidor con direcciones IP ya bastan. Las empresas pequeñas solo quedan exentas del registro de actividades mientras no traten datos sensibles."}},{"@type":"Question","name":"¿Necesito de verdad un aviso de cookies?","acceptedAnswer":{"@type":"Answer","text":"Para las cookies estrictamente necesarias no. En cuanto cargas herramientas de analítica, píxeles publicitarios o servicios incrustados de terceros, necesitas un diálogo de consentimiento que retenga esos scripts hasta que la persona acepte. Para público de la UE se suma además el RGPD."}},{"@type":"Question","name":"¿Cuánto cuesta incumplir la revDSG?","acceptedAnswer":{"@type":"Answer","text":"Las infracciones intencionadas del deber de informar o del derecho de acceso pueden sancionarse con multas de hasta 250'000 francos. La multa apunta a la persona física responsable dentro de la empresa. La sanción suele llegar tras una denuncia. El daño más habitual es la pérdida de confianza de clientes."}},{"@type":"Question","name":"¿Puede alojarse mi web fuera de Suiza?","acceptedAnswer":{"@type":"Answer","text":"Sí. El alojamiento en el EEE no plantea problemas porque allí se reconoce un nivel de protección adecuado. Con proveedores en Estados Unidos solo puedes transferir sin garantías adicionales si están certificados bajo el Swiss US Data Privacy Framework. En cualquier caso la ubicación debe figurar en tu política."}},{"@type":"Question","name":"¿Basta una política de privacidad de un generador?","acceptedAnswer":{"@type":"Answer","text":"Como punto de partida sí, como producto final pocas veces. Un generador no conoce tus herramientas. Una política que enumera servicios que no empleas incumple el deber de informar. Lo mismo ocurre si calla lo que corre por detrás. El trabajo real consiste en contrastar el texto con lo que de verdad se carga en tus páginas."}}]}
</script>
