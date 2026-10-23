---
title: "What does a 3D configurator cost? How it works"
description: "What does a 3D product configurator cost and how does the technology work? The chain (WebGL, CPQ, ERP), SaaS versus custom and when your product is ready."
date: "2026-07-30"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/3d-configurator-cost-cover.svg"
---

If you are looking into a 3D configurator, you probably already picture it. Your customer composes their own carport, garden room, sofa or machine on your website. They watch the 3D view and the price update live and order without days of back and forth over quotes. This guide explains how to get there: what a 3D configurator is, whether your product is suited for one, what it costs and whether to buy software or have it built.

**In short:** a 3D configurator is software that lets users compose a product visually online while it instantly calculates the price and checks whether the product can actually be manufactured. The system connects a visual engine (such as Three.js/WebGL) to a rule engine (CPQ) and passes the data on to ERP or CAD systems. Companies use it to quote faster, reduce order errors and sell more online.

## At a glance

- **Worth it when** products carry 5 or more variable attributes or quoting is labour intensive.
- **Returns:** as an illustration of typical orders of magnitude in the sector. A quoting process of days becomes a session of minutes. Wrong variant orders drop sharply once rules take over validation.
- **Technology:** the quality of the product and pricing logic (CPQ, ERP data) decides success, not just the 3D visuals.
- **SaaS or custom:** choose SaaS for standard catalogue products and custom for unique production processes.

## Why manufacturers are looking at 3D configurators now

Three developments converge. First, the labour shortage: experienced estimators are scarce. Every hour they spend on standard quotes is an hour not spent on real custom work. Second, speed as a buying factor: whoever shops for a carport or a custom machine part today expects an instant image and price, not a quote in five working days. Third, the cost of errors: every variant ordered or produced incorrectly burns margin and trust.

As an illustration, here are three scenarios we see recur across manufacturing. A pool supplier cuts its quoting process from days to a configuration session of a few minutes. A carport and garden room manufacturer watches misunderstandings about dimensions and options all but disappear, because the configurator only allows combinations that can be made. An industrial machine builder converts more enquiries because options are shown visually instead of described in a PDF. Exact numbers differ per company. The pattern is always the same: faster, fewer errors and less dependence on scarce specialists.

## How does a 3D configurator work? Terms and chain

The terms blur in practice, so here is the delineation. A **regular webshop** sells fixed catalogue items. A **product configurator** assembles the item from rules and options. A **quote calculator** computes a price from input fields. A full **CPQ system** (Configure, Price, Quote) also guards which combinations are valid and generates the quote. **CAD** is your engineers' technical drawing environment. The **3D visualisation in the browser** is a simplified model of it, built to load fast and run smoothly on any device.

The technical chain of a professional configurator looks like this:

**User interface** (what the user sees on screen) → **rule engine** (product and pricing logic) → **output** (quote, bill of materials, technical drawing)

The user moves in the visual layer. Meanwhile the rule engine guards what is possible and what it costs. Once the order is confirmed, the data flows to production: a bill of materials (BOM), cutting lists or a technical drawing. Two production strategies apply:

- **Configure-to-Order (CTO):** standard building blocks in endless combinations. The configurator picks and combines.
- **Engineer-to-Order (ETO):** true custom work where every order needs unique CAD drawings. The configurator then becomes the front end of your engineering.

## Is your product suited? The decision tree

**Yes, a configurator becomes interesting when:**

- drafting a quote manually takes more than 15 minutes;
- wrong variants are regularly ordered or produced;
- your product has 5 or more variable attributes (colour, dimensions, material, accessories).

**No or not yet, when:**

- only two or three fixed variants exist;
- every product is fully unique craftsmanship without fixed product rules.

**Note:** if partial standardisation is possible, it often pays to analyse and streamline your process first before you automate.

## The Configurator Readiness Score

Want to make it more objective? Score your company on five dimensions, 1 to 5 points each:

1. **Product variation:** how complex is the range?
2. **Clarity of product rules:** are they written down or do they live in heads and Excel?
3. **Visualisation need:** does your customer struggle to imagine the end result?
4. **Integration readiness:** is there a central ERP or CRM with reliable data?
5. **Quote volume:** do you handle more than twenty quotes a week?

- **Score 5 to 10:** not ready yet. Get your data and processes in order first.
- **Score 11 to 18:** orientation phase. Consider SaaS or a basic configurator.
- **Score 19 to 25:** a strong business case for a 3D configurator, possibly a custom one.

## Functionality: basic versus professional

| Functionality | Basic configurator | Professional 3D configurator |
|---|---|---|
| 3D visualisation | Standard WebGL with 360 degree rotation | Real time light and shadow, AR view on location |
| Pricing | Static matrix or basic rules | Dynamic pricing logic, optionally tied to live material prices |
| Integrations | None or an ecommerce plugin | Two way link with ERP (SAP, Dynamics 365, Exact, Odoo) |
| Output | PDF quote for the customer | Automatic bill of materials (BOM), cutting lists and CAD files (STEP/DXF) |
| Business rules | Limited to simple choices | Complex dependencies: change X and Y is no longer available |

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#F4F6FA;border:1px solid #E9EEF6">
  <strong style="display:block;font-size:1.05rem;color:#16233D;margin-bottom:0.6rem">From our practice</strong>
  <p style="margin:0 0 0.75rem">At a manufacturer of outdoor buildings we sat down to get the product rules on paper: which combinations are possible, which are not and why not. That turned out to be harder than anyone expected. The knowledge was not missing. It lived in people's heads and not on paper. What one colleague took for granted, another did slightly differently.</p>
  <p style="margin:0 0 0.75rem">The project was already running. Every rule that still had to be worked out held up the build.</p>
  <p style="margin:0 0 0.75rem">That is exactly the added benefit of a proper analysis up front. A configurator forces you to write out your own product rules, right down to the exceptions nobody had ever recorded. That exercise would have had value without a configurator too.</p>
  <p style="margin:0;font-size:0.875rem">Out of respect for the client we name no names.</p>
</div>

## Garbage in, garbage out: data quality decides

Not the 3D rendering but the quality of your product data and business rules determines the lion's share of success. A beautiful 3D view of a product that cannot be manufactured produces disappointed customers and manual repair work. That is why every serious configurator project starts by making product rules, pricing structure and exceptions explicit. That is analysis work, not rendering work.

## Buy SaaS software or have it custom built?

| Criterion | SaaS platform (e.g. Threekit, Expivi) | Custom (your own application) |
|---|---|---|
| Speed to market | Fast: weeks | Longer: months |
| Costs | Monthly recurring licence | One off build plus maintenance |
| Flexibility | You adapt your process to the software | The software follows your exact workflow |
| Source code and right of use | No access to the source code | Full source code and a perpetual right of use; your product rules and data stay yours |

The rule of thumb: if you sell a catalogue product with options, SaaS takes you a long way. Is your product logic itself your competitive edge? Must the configurator hook deep into your ERP and production? Then custom nearly always wins over time.

## What does a 3D configurator cost?

These are indicative market ranges, not a price list. The exact price depends on product complexity, integrations and visualisation requirements.

- **Basic or entry configurator (€10,000 to €25,000):** visual display with basic pricing and output by email or PDF.
- **Mid-size product configurator (€25,000 to €60,000):** Three.js visualisation, an ERP link (for instance Exact or Business Central) and extensible rule logic.
- **Complex enterprise CPQ/3D solution (€60,000 to €150,000 and up):** fully integrated with CAD generation, SAP or Dynamics, ETO processes and multiple languages.

Never compare on build price alone. The cost of a wrongly specified project (a rebuild, change orders, a configurator nobody uses) almost always exceeds the difference between two quotes.

## From project to delivery: five steps

1. **Analysis and readiness check:** is the product configurable and is there a business case?
2. **Data structure and product rules:** the specification document with acceptance criteria.
3. **Architecture and choice of build partner:** compare quotes against the same document.
4. **Build:** iterative sprints with demos and acceptance tests against the specification.
5. **Integration, aftercare and optimisation:** go live, measure and keep managing the rules yourself.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Wondering whether your product is configurable?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> builds custom 3D configurators. We start from your product rules and connect the configurator to your quoting and order process.</p>
  <a href="/en/services/3d-configurators"><strong>Read more about 3D configurators →</strong></a>
</div>

## When is a 3D configurator a bad idea?

- When your product data is chaos: clean up first, automate second.
- With a small range without custom options: a good product page is enough.
- If sales run entirely on personal relationships and your audience is not active online.

## Frequently asked questions

**Is a 3D configurator the same as a CPQ system?**
No. CPQ (Configure, Price, Quote) is the rule engine that guards which combinations are valid and what they cost. The 3D configurator is the visual layer on top. A good solution combines both. 3D without CPQ is a demo, not a sales tool.

**When do you choose Three.js/WebGL and when server side rendering?**
Three.js/WebGL renders in the browser and is the standard for interactive product configuration: fast, no installation and it works on mobile. Server side rendering makes sense for photorealistic images of extremely heavy models. It does add latency and server costs. For most manufacturers WebGL is the right choice.

**Do I need CAD files to build a 3D configurator?**
Not necessarily. Existing CAD models speed up the work. They are too heavy for the browser, though. They are always simplified into web models. Without CAD files, a 3D artist builds the models from drawings or photos.

**Can a 3D configurator work without a connected ERP system?**
Yes, certainly in a first phase. The configurator then delivers quotes and orders by email or PDF. The biggest gains do come from the integration, because orders, bills of materials and prices then flow through automatically without retyping.

**How does a 3D configurator perform on mobile?**
WebGL runs on modern smartphones. Heavy models do need optimisation: fewer polygons, compressed textures and an interface that works on a small screen. Make mobile performance a requirement from day one, not an afterthought.

**Can I manage product rules and prices myself after delivery?**
That is how it should be. Demand an admin environment in which your own team adjusts options, prices and rules without a developer. If every price change requires the builder, you have built a dependency instead of a sales tool.

Further reading: Gartner, Market Guide for CPQ Application Suites · McKinsey & Company, publications on digitisation in manufacturing · technical documentation of [Three.js](https://threejs.org/docs/) and the major CAD platforms (Autodesk, PTC, Siemens).

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is a 3D configurator the same as a CPQ system?","acceptedAnswer":{"@type":"Answer","text":"No. CPQ (Configure, Price, Quote) is the rule engine that guards which combinations are valid and what they cost. The 3D configurator is the visual layer on top. A good solution combines both. 3D without CPQ is a demo, not a sales tool."}},{"@type":"Question","name":"When do you choose Three.js/WebGL and when server side rendering?","acceptedAnswer":{"@type":"Answer","text":"Three.js/WebGL renders in the browser and is the standard for interactive product configuration: fast, no installation and it works on mobile. Server side rendering makes sense for photorealistic images of extremely heavy models. It does add latency and server costs. For most manufacturers WebGL is the right choice."}},{"@type":"Question","name":"Do I need CAD files to build a 3D configurator?","acceptedAnswer":{"@type":"Answer","text":"Not necessarily. Existing CAD models speed up the work. They are too heavy for the browser, though. They are always simplified into web models. Without CAD files, a 3D artist builds the models from drawings or photos."}},{"@type":"Question","name":"Can a 3D configurator work without a connected ERP system?","acceptedAnswer":{"@type":"Answer","text":"Yes, certainly in a first phase. The configurator then delivers quotes and orders by email or PDF. The biggest gains do come from the integration, because orders, bills of materials and prices then flow through automatically without retyping."}},{"@type":"Question","name":"How does a 3D configurator perform on mobile?","acceptedAnswer":{"@type":"Answer","text":"WebGL runs on modern smartphones. Heavy models do need optimisation: fewer polygons, compressed textures and an interface that works on a small screen. Make mobile performance a requirement from day one, not an afterthought."}},{"@type":"Question","name":"Can I manage product rules and prices myself after delivery?","acceptedAnswer":{"@type":"Answer","text":"That is how it should be. Demand an admin environment in which your own team adjusts options, prices and rules without a developer. If every price change requires the builder, you have built a dependency instead of a sales tool."}}]}
</script>
