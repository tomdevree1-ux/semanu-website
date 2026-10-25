---
title: "Software creado con IA: los cinco riesgos"
description: "El software creado con IA funciona en la demo y falla en lo invisible: validación, API abiertas, fugas de datos y RGPD. Los cinco riesgos y cómo cerrarlos."
date: "2026-08-24"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/software-built-with-ai-cover.jpg"
---

Un formulario de presupuestos, un portal de clientes, una herramienta de planificación: con las herramientas de código con IA está en marcha en días en lugar de meses. Es un avance real. No aconsejamos a nadie volver atrás. Sin embargo, nuestro trabajo consiste en mirar bajo el capó de este tipo de aplicaciones y siempre aparece la misma imagen. El software hace lo que promete la demo. Los problemas están en todo lo que la demo no muestra.

**En resumen:** El software creado con IA suele funcionar sin fallos en la demo y falla en lo que no se ve: falta de validación de entradas, API abiertas para cualquiera que conozca la dirección, datos personales que se filtran, obligaciones del RGPD que nadie cubre y lógica de negocio que se ejecuta en el navegador en lugar de en el servidor. [Investigadores de la NYU comprobaron en 2021](https://arxiv.org/abs/2108.09293) que alrededor del cuarenta por ciento del código que un asistente de IA escribió en sus escenarios de prueba contenía vulnerabilidades. Cada uno de esos huecos se puede detectar y cerrar, a ser posible antes de la puesta en producción.

## Ahora todo el mundo crea su propio software y no es algo malo

La barrera para crear software se ha derrumbado en dos años. Lo que antes requería un equipo de desarrollo y medio año, hoy lo hace un empleado habilidoso en unas pocas semanas. Para una pyme es una oportunidad: usted conoce su propia operativa mejor que cualquier proveedor externo y por fin puede crear herramientas que encajan exactamente con su proceso.

El problema no es crear. Las herramientas optimizan para código que funciona, no para código seguro. Quien lo crea no suele tener la formación necesaria para ver la diferencia. La aplicación funciona, todos están contentos y nadie hace la pregunta que un desarrollador profesional hace primero: ¿qué pasa si alguien la usa mal?

## Los cinco huecos que siempre vuelven

Estos son los cinco patrones que más encontramos al revisar aplicaciones creadas por las propias empresas. Cada uno es invisible en una demo. Cada uno duele después de la puesta en producción.

### 1. Las entradas no se comprueban

Un formulario espera un nombre y una dirección de correo electrónico. ¿Qué ocurre si alguien pega un fragmento de código, un archivo de 2 gigabytes o un texto de diez mil caracteres? Sin validación de entradas, todo eso acaba sin filtrar en su base de datos o en los correos a su equipo. Empieza con basura en sus datos. Termina con un atacante que lee su base de datos a través de un campo de entrada.

### 2. La API está abierta para quien conozca la dirección

Detrás de cada aplicación hay una capa que lee y escribe los datos. Las herramientas de IA suelen montar esa capa sin comprobar quién llama a la puerta. Quien conozca la dirección o simplemente la adivine puede consultar directamente pedidos, datos de clientes o precios sin iniciar sesión nunca. Además, la dirección aparece a la vista en el código que recibe cada navegador.

### 3. Los datos personales se filtran por la puerta lateral

Mensajes de error que muestran la ficha completa del cliente, botones de exportación sin control de permisos, archivos de registro llenos de direcciones de correo: las aplicaciones hechas en casa rara vez filtran datos personales por la puerta principal y casi siempre por una puerta lateral olvidada. Una sola fuga basta para una notificación a la autoridad de protección de datos y una conversación incómoda con cada cliente afectado.

### 4. Nadie cubre el RGPD

¿Quién trata los datos, dónde se guardan, durante cuánto tiempo y con qué base jurídica? Una herramienta de IA no plantea esas preguntas y quien crea la aplicación normalmente tampoco. Así, de repente hay una aplicación que envía datos de clientes a un servicio fuera de la UE. Sin contrato de encargo del tratamiento, sin mención en la política de privacidad y sin que nadie se dé cuenta.

### 5. La lógica de negocio se ejecuta en el navegador

El clásico de los configuradores y las herramientas de presupuestos: el cálculo del precio está en el código que se envía al visitante. Cualquiera con un navegador puede leer y modificar ese código. En el mejor de los casos, un competidor descubre su estructura de descuentos. En el peor, alguien hace un pedido a un precio que ha escrito él mismo. Entonces usted tiene un problema jurídico, porque el pedido está confirmado.

## Por qué la demo no le dice nada

Una demo muestra el camino previsto: entradas correctas, un usuario bienintencionado y ningún atacante. Justo las tres suposiciones que caen tras la puesta en producción. Los usuarios reales hacen cosas inesperadas, los bots rastrean cada URL pública en pocos días y los formularios reciben su primera basura automatizada en la misma semana. La pregunta no es si algo saldrá mal. La pregunta es si alguien lo notará cuando ocurra. En las aplicaciones hechas en casa eso rara vez está previsto: casi siempre faltan registros y alertas.

## Lo que puede comprobar usted mismo hoy

Cuatro comprobaciones que no requieren formación técnica. Si falla en una, sabrá que hay más problemas.

1. **Introduzca algo incorrecto en cada campo.** Texto donde va un número, un campo obligatorio vacío, un nombre absurdamente largo. ¿Recibe mensajes de error claros o la aplicación hace cosas raras?
2. **Abra la aplicación en una ventana de incógnito.** Pegue la dirección de una página que debería estar detrás del inicio de sesión. Si aun así ve datos, la puerta está abierta.
3. **Pregunte por los contratos de encargo del tratamiento.** ¿Quién tiene uno con cada servicio externo que usa la aplicación? El silencio también es una respuesta.
4. **Pregunte dónde se ejecuta el cálculo del precio.** Si la respuesta es «en la propia aplicación», siga preguntando: ¿en el servidor o en el navegador?

## Hágalo revisar antes de la puesta en producción

Crear uno mismo y hacer revisar por profesionales no se excluyen. Van juntos. Una buena revisión abarca seis ámbitos: seguridad, datos personales y RGPD, funcionamiento con escenarios de prueba, arquitectura y lógica, rendimiento y uso en móvil, además de la continuidad. El resultado es un informe que indica para cada hallazgo qué es crítico y qué puede esperar. Después, su equipo sigue construyendo, ahora con los huecos cerrados.

¿La aplicación afecta a clientes, dinero o datos personales y quiere una base sólida? También puede encargar [software empresarial a medida](/es/services/business-software) que incluya validación, permisos y RGPD desde la primera línea de código.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">¿Lo ha creado usted y está casi listo para producción?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> desarrolla software empresarial a medida impulsado por la IA. La validación, el control de permisos y el RGPD forman parte de él desde el principio. Cuéntenos qué ha creado o quiere crear. Juntos definimos el siguiente paso.</p>
  <a href="/es/contact"><strong>Póngase en contacto →</strong></a>
</div>

## Preguntas frecuentes

**¿Es inseguro el software creado con IA?**
No por definición. Pero la probabilidad de huecos es mayor. Investigadores de la NYU comprobaron en 2021 que alrededor del cuarenta por ciento del código que escribió un asistente de IA contenía vulnerabilidades. Las herramientas optimizan para código que funciona, no para código seguro.

**¿Debo dejar entonces de crear con IA?**
No. Para muchas herramientas internas es el camino más rápido. Eso sí, haga revisar cualquier aplicación que afecte a clientes, dinero o datos personales antes de ponerla en producción. Igual que haría inspeccionar una cocina reformada por usted mismo antes de conectar el gas.

**¿Qué comprueba exactamente una revisión de software?**
Seis ámbitos: seguridad, datos personales y RGPD, funcionamiento con escenarios de prueba, arquitectura y lógica, rendimiento y uso en móvil, además de la continuidad. El resultado es un informe con una lista de prioridades en tres niveles.

**¿Dónde debe ejecutarse el cálculo del precio?**
En el servidor. El navegador muestra el precio. El servidor lo vuelve a calcular y lo confirma. Así nadie puede hacer un pedido a un precio que haya modificado él mismo.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"¿Es inseguro el software creado con IA?","acceptedAnswer":{"@type":"Answer","text":"No por definición. Pero la probabilidad de huecos es mayor. Investigadores de la NYU comprobaron en 2021 que alrededor del cuarenta por ciento del código que escribió un asistente de IA contenía vulnerabilidades. Las herramientas optimizan para código que funciona, no para código seguro."}},{"@type":"Question","name":"¿Debo dejar entonces de crear con IA?","acceptedAnswer":{"@type":"Answer","text":"No. Para muchas herramientas internas es el camino más rápido. Eso sí, haga revisar cualquier aplicación que afecte a clientes, dinero o datos personales antes de ponerla en producción. Igual que haría inspeccionar una cocina reformada por usted mismo antes de conectar el gas."}},{"@type":"Question","name":"¿Qué comprueba exactamente una revisión de software?","acceptedAnswer":{"@type":"Answer","text":"Seis ámbitos: seguridad, datos personales y RGPD, funcionamiento con escenarios de prueba, arquitectura y lógica, rendimiento y uso en móvil, además de la continuidad. El resultado es un informe con una lista de prioridades en tres niveles."}},{"@type":"Question","name":"¿Dónde debe ejecutarse el cálculo del precio?","acceptedAnswer":{"@type":"Answer","text":"En el servidor. El navegador muestra el precio. El servidor lo vuelve a calcular y lo confirma. Así nadie puede hacer un pedido a un precio que haya modificado él mismo."}}]}
</script>
