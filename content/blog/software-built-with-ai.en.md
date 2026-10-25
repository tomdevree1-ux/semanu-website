---
title: "Software built with AI: the five risks"
description: "Software built with AI works in the demo and fails on what you don't see: validation, open APIs, leaking data and GDPR. The five risks and how to fix them."
date: "2026-08-24"
updated: "2026-10-23"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/software-built-with-ai-cover.jpg"
---

A quote form, a client portal, a planning tool: with AI coding tools it is up and running in days instead of months. That is real progress. We advise nobody to go back. Still, we look under the hood of these applications for a living and the same picture comes out every time. The software does what the demo promises. The problems sit in everything the demo does not show.

**In short:** Software built with AI usually runs flawlessly in the demo and fails on what you do not see: missing input validation, APIs open to anyone who knows the address, personal data leaking, GDPR duties covered nowhere and business logic running in the browser instead of on the server. [NYU researchers found in 2021](https://arxiv.org/abs/2108.09293) that roughly forty percent of the code an AI assistant wrote in their test scenarios contained vulnerabilities. Each of these gaps can be found and closed, preferably before go-live.

## Everyone builds their own now and that is no bad thing

The barrier to making software has collapsed in two years. What used to take a development team and half a year, a handy employee now does in a few weeks. For an SME that is an opportunity: you know your own operation better than any external builder and you can finally make tools that fit your process exactly.

The problem is not the building. The tools optimise for working code, not for safe code. The builder usually lacks the background to see the difference. The app works, everyone is happy and nobody asks the question a professional developer asks first: what happens when someone uses this the wrong way?

## The five gaps that keep coming back

These are the five patterns we encounter most often in reviews of self-built applications. Each one is invisible in a demo. Each one hurts after go-live.

### 1. Input is not checked

A form expects a name and an email address. What happens when someone pastes in a piece of code, a 2 gigabyte file or a text of ten thousand characters? Without input validation all of it lands unfiltered in your database or in the emails to your team. It starts with junk in your data. It ends with an attacker reading your database through an input field.

### 2. The API is open to anyone who knows the address

Behind every app sits a layer that fetches and writes the data. AI tools often set up that layer without checking who is knocking. Anyone who knows or simply guesses the address can then request orders, customer data or prices directly without ever logging in. On top of that, the address sits in plain sight in the code every browser receives.

### 3. Personal data leaks through the side door

Error messages that show the entire customer record, export buttons without permission checks, log files full of email addresses: self-built apps rarely leak personal data through the front door and almost always through a forgotten side door. One leak is enough for a notification to the data protection authority and an awkward conversation with every affected customer.

### 4. GDPR is covered nowhere

Who processes the data, where does it live, how long is it kept and on what legal basis? An AI tool does not ask those questions and usually neither does the builder. Suddenly an app is sending customer data to a service outside the EU. No processing agreement, no mention in the privacy statement and nobody aware of it.

### 5. The business logic runs in the browser

The classic from configurators and quote tools: the price calculation sits in the code sent to the visitor. Anyone with a browser can read and change that code. At best a competitor reads off your discount structure. At worst someone orders at a price they typed in themselves. Then you have a legal problem, because the order is confirmed.

## Why the demo tells you nothing

A demo shows the expected path: correct input, a well-meaning user and no attacker at all. Precisely the three assumptions that fall apart after go-live. Real users do unexpected things, bots scan every public URL within days and forms receive their first automated junk within the week. The question is not whether it goes wrong. The question is whether anyone notices when it does. In self-built apps that is rarely arranged: logging and alerts are almost always missing.

## What you can check yourself today

Four checks that need no technical background. Fail one and you know there is more going on.

1. **Enter something wrong in every field.** Text where a number belongs, an empty required field, an absurdly long name. Do you get tidy error messages or does the app act strangely?
2. **Open the app in an incognito window.** Paste the address of a page that should sit behind the login. If you still see data, the door is open.
3. **Ask about the processing agreements.** Who holds one with every external service the app uses? Silence is an answer too.
4. **Ask the builder where the price calculation runs.** If the answer is "in the app itself", ask the follow-up question: on the server or in the browser?

## Have it tested before you go live

Building it yourself and testing it professionally do not exclude each other. They belong together. A good review covers six domains: security, personal data and GDPR, functional behaviour with test scenarios, architecture and logic, performance and mobile use, plus continuity. The result is a report that marks per finding what is critical and what can wait. Your team simply keeps building afterwards, now with the gaps closed.

Does the app touch customers, money or personal data and do you want it on a solid foundation? Then you can also have [custom business software](/en/services/business-software) built that has validation, permissions and GDPR in place from the first line of code.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Built it yourself and almost ready for go-live?</strong>
  <p style="margin:0 0 1rem;color:#5B667C"><span class="brand-mark">semanu</span> builds custom business software with AI as the engine. Validation, permission checks and GDPR are part of it from the start. Tell us what you have built or want to build. Together we work out the next step.</p>
  <a href="/en/contact"><strong>Get in touch →</strong></a>
</div>

## Frequently asked questions

**Is software built with AI unsafe?**
Not by definition. The odds of gaps are higher though. NYU researchers found in 2021 that roughly forty percent of the code an AI assistant wrote contained vulnerabilities. The tools optimise for working code, not for safe code.

**Should I stop building with AI then?**
No. For many internal tools it is the fastest route. Do have an app that touches customers, money or personal data tested before it goes live. Just as you would have a self-renovated kitchen inspected before connecting the gas.

**What exactly does a software review check?**
Six domains: security, personal data and GDPR, functional behaviour with test scenarios, architecture and logic, performance and mobile use, plus continuity. The result is a report with a priority list in three levels.

**Where should the price calculation run?**
On the server. The browser shows the price. The server calculates it again and confirms it. That way nobody can place an order at a price they changed themselves.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Is software built with AI unsafe?","acceptedAnswer":{"@type":"Answer","text":"Not by definition. The odds of gaps are higher though. NYU researchers found in 2021 that roughly forty percent of the code an AI assistant wrote contained vulnerabilities. The tools optimise for working code, not for safe code."}},{"@type":"Question","name":"Should I stop building with AI then?","acceptedAnswer":{"@type":"Answer","text":"No. For many internal tools it is the fastest route. Do have an app that touches customers, money or personal data tested before it goes live. Just as you would have a self-renovated kitchen inspected before connecting the gas."}},{"@type":"Question","name":"What exactly does a software review check?","acceptedAnswer":{"@type":"Answer","text":"Six domains: security, personal data and GDPR, functional behaviour with test scenarios, architecture and logic, performance and mobile use, plus continuity. The result is a report with a priority list in three levels."}},{"@type":"Question","name":"Where should the price calculation run?","acceptedAnswer":{"@type":"Answer","text":"On the server. The browser shows the price. The server calculates it again and confirms it. That way nobody can place an order at a price they changed themselves."}}]}
</script>
