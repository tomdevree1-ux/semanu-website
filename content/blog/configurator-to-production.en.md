---
title: "From configurator to production: your quote as the basis of your cutting list"
description: "How a configurator generates a cutting list, bill of materials and CAD file straight from the quote. No more retyping the same data."
date: "2026-11-24"
updated: "2026-11-24"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/configurator-to-production-cover.svg"
---

In most manufacturing companies we keep seeing business flows trapped in silos. Every phase starts by redoing the work of the previous one. The customer signs and then the real work begins: someone copies the order into a spreadsheet, calculates the dimensions, makes a cutting list and redraws the product for the workshop. That is not only double work but also very error prone. In this article we explain how our configurators make those steps unnecessary: what the customer chooses goes to production in one go and without errors.

**In short:** a configurator with well built product rules knows not only the price but also the parts, dimensions and operations of the configuration. As soon as the customer confirms the quote, the bill of materials, the cutting list, the cutting file or the CAD drawing is generated automatically. The quote and the production file come from the same source, so they can no longer differ.

## At a glance

- **The problem:** between quote and production there is almost always a colleague who enters everything again. That is where most errors arise.
- **The solution:** the same product rules that calculate the price also calculate the parts.
- **What comes out:** bill of materials, cutting list, cutting file, technical drawing or CAD file and a link to your webshop or ERP system.
- **The condition:** your product rules must be definable.

## Where it goes wrong today

Take a manufacturer of made to measure wardrobes. The salesperson prepares a quote for a wardrobe 2,340 mm wide with two drawers and a hanging rail. The customer signs and then work preparation does the job again: how wide is each section, how many side panels, which thickness, which length for the plinth, how many hinges. That ends up in a cutting list for the saw.

There are three places where this can go wrong:

1. **Retyping.** A dimension is copied incorrectly, an option is forgotten.
2. **Interpretation.** The salesperson meant something different from what the planner understands.
3. **Knowledge in people's heads.** The rule "above 600 mm wide there is a partition" is written down nowhere. If that one colleague is on holiday, things go wrong.

You know the result: a panel cut wrong, a second delivery, a customer who waits. And a planner who fills his days with calculations instead of real custom work questions.

## How a configurator solves this

The difference is not in the 3D image but in what lies behind it. Because a 3D configurator always has the geometry of the project, it becomes more than just a quoting tool. A configurator that also calculates the parts is an extension of your work preparation and the backbone of your organisation.

This is how it works:

**Customer choices** → **product rules** → **price and production data**

The product rules describe your product the way your workshop knows it. A few simple examples from practice:

- Each section equals the inner width divided by the number of sections, minus the thickness of the partitions.
- Above a certain width an extra support is added.
- A drawer needs two runners with a length that depends on the depth.
- A chosen colour determines the board and the edge banding.

The same rules that say what something costs also say which parts it consists of. If the customer chooses a different width, the price, the 3D image and the cutting list change at the same time.

## What comes out of the configurator

Which output you need depends on your product and your machines. The most common:

| Output | For whom | Example |
|---|---|---|
| Bill of materials (BOM) | Purchasing and warehouse | All parts with quantities and item numbers |
| Cutting list | Saw shop | Lengths and widths per board or profile, with material and thickness |
| Cutting file (DXF) | Laser cutter, CNC, sheet metal | The contours of every part, ready for the machine |
| Technical drawing | Workshop and assembly | Views with dimensions, as PDF |
| CAD file (STEP) | Engineering | The complete 3D model for further detailing |
| Order in your ERP | Planning and invoicing | The order with all lines, without retyping |

Important: do not do it all at once. A first phase that is too broad is one of the best known pitfalls in configurator and CPQ projects. Analysts such as [Constellation Research](https://www.constellationr.com/research/think-big-get-most-out-configure-price-quote-systems) therefore recommend a broad vision with a phased rollout. [Tacton](https://www.tacton.com/?p=37882) also names too broad a scope in the first phase as a cause of failed projects. Start small with just the quote and then build towards a cutting list as PDF or Excel. After that comes the link to your ERP or your machines.

## Who benefits most?

The return is highest when:

- your product is **made to measure** but follows **fixed rules** (wardrobes, stairs, gates, canopies, garages, sheet metal);
- your work preparation spends **a lot of time** turning quotes into production data;
- **errors between sales and workshop** happen regularly and cost money;
- you depend on **one or two people** who know the rules.

Is every product you make completely unique, without fixed rules and built up from scratch each time? Then a configurator cannot replace engineering. It can still become a lead generator that gets customers interested in your product and leads them to contact your company.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#F4F6FA;border:1px solid #E9EEF6">
  <strong style="display:block;font-size:1.05rem;color:#16233D;margin-bottom:0.6rem">From our practice</strong>
  <p style="margin:0 0 0.75rem">At a manufacturer of prefab structures the sales department made the quotes. Work preparation then drew every order again from scratch. A change by the customer meant double work: adjusting the quote and adjusting the drawings.</p>
  <p style="margin:0 0 0.75rem">When we wrote out the product rules for the configurator, it turned out that the drawings and order lists could come from the same rules as the price. Since then the configurator makes them itself. Work preparation still checks them. Drawing from zero is no longer needed.</p>
  <p style="margin:0;font-size:0.875rem">Out of respect for our client we do not name names.</p>
</div>

## How do you get started?

1. **Is your business flow optimised?** A configurator will question your business flow whether you like it or not. It pays to review it internally beforehand and see where it can be improved.
2. **Write out your product rules.** Which choices are there, which combinations are not possible and how do the parts follow from the dimensions? This is the most important work and a valuable exercise even without a configurator.
3. **Choose your first output.** Start with what takes the most time: usually the quote or the bill of materials.
4. **Test with real orders.** Let the configurator run alongside your current way of working for a month and compare the results.
5. **Connect step by step.** First a file that someone checks, then a direct link to your ERP or your machines.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Want to know what your configurator could deliver?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> builds configurators that do not stop at the quote. We start from your product rules and let the configurator produce bills of materials, cutting lists and drawings tailored to your workshop.</p>
  <a href="/en/services/3d-configurators"><strong>Read more about 3D configurators →</strong></a>
</div>

## Frequently asked questions

**Does my work preparation still have anything to do?**
Certainly, only the repetitive work disappears and time is freed up for innovation and quality control. Their knowledge then no longer sits only in their heads but also in the configurator.

**Does this work with my existing machines?**
Usually it does. A business analysis at the start makes this clear. Cutting lists and bills of materials can be delivered as Excel or CSV, cutting files as DXF. The formats your machines read determine what the configurator produces.

**Do I need an ERP?**
No, our configurators already take over part of the ERP work. Do you have an ERP system after all? Then we will gladly connect the configurator to your existing platform.

**What if a customer asks for something that does not fit the rules?**
Then the configurator flags it as a special request and your team takes over. The standard runs automatically, the exception gets human attention.

**Is this the same as a CPQ system?**
CPQ calculates configuration, price and quote. What is described here goes one step further: the same rules also produce the production data. You can see it as CPQ that runs all the way into the workshop.

Further reading: [What does a 3D configurator cost? How it works](/en/blog/3d-configurator-cost) · [5 ERP integration mistakes and how to avoid them](/en/blog/erp-integration-mistakes) · Constellation Research, [Think Big to Get the Most Out of Configure, Price, Quote Systems](https://www.constellationr.com/research/think-big-get-most-out-configure-price-quote-systems).

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Does my work preparation still have anything to do?","acceptedAnswer":{"@type":"Answer","text":"Certainly, only the repetitive work disappears and time is freed up for innovation and quality control. Their knowledge then no longer sits only in their heads but also in the configurator."}},{"@type":"Question","name":"Does this work with my existing machines?","acceptedAnswer":{"@type":"Answer","text":"Usually it does. A business analysis at the start makes this clear. Cutting lists and bills of materials can be delivered as Excel or CSV, cutting files as DXF. The formats your machines read determine what the configurator produces."}},{"@type":"Question","name":"Do I need an ERP?","acceptedAnswer":{"@type":"Answer","text":"No, our configurators already take over part of the ERP work. Do you have an ERP system after all? Then we will gladly connect the configurator to your existing platform."}},{"@type":"Question","name":"What if a customer asks for something that does not fit the rules?","acceptedAnswer":{"@type":"Answer","text":"Then the configurator flags it as a special request and your team takes over. The standard runs automatically, the exception gets human attention."}},{"@type":"Question","name":"Is this the same as a CPQ system?","acceptedAnswer":{"@type":"Answer","text":"CPQ calculates configuration, price and quote. What is described here goes one step further: the same rules also produce the production data. You can see it as CPQ that runs all the way into the workshop."}}]}
</script>
