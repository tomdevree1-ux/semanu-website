---
title: "Is your website compliant with Swiss data protection law?"
description: "The revised Swiss Data Protection Act has applied since 1 September 2023. Many SME websites still fall short. What the revDSG requires and how to meet it in seven steps."
date: "2026-09-01"
updated: "2026-09-08"
author: "Tom"
authorImage: "/team/tom.png"
cover: "/blog/revdsg-datenschutz-check-cover.svg"
---

[The revised Swiss Data Protection Act](https://www.fedlex.admin.ch/eli/cc/2022/491/de) took effect on 1 September 2023, three years ago to the day. Even so, plenty of Swiss SME websites still carry a privacy notice that somebody copied from elsewhere on the web. It lists tools that are not in use. The ones actually running go unmentioned.

This is rarely bad faith. An agency built the site years ago and nobody looked at it again since. The catch is that the agency does not carry the responsibility. Neither does the form plugin. You do.

**In short:** a Swiss website meets the revDSG when four things are true. The privacy notice honestly describes what data you collect and why. Forms ask only for what you need. Analytics and advertising tools load only after consent. And you know which country your data sits in. Fines of up to CHF 250'000 land on the responsible individual, not on the company.

## What does the revDSG require from an SME website?

Four duties apply to almost every company site.

The **duty to inform** is the visible one. Anyone collecting personal data has to state beforehand, in plain language, who processes the data, for what purpose and who receives it. That is what the privacy notice is for. It has to match the reality of your site rather than some template.

Then there is the **right of access**. If someone asks what data you hold about them, you normally have 30 days to answer, free of charge. That only works if you know where the data lives in the first place.

For a **data breach** with a high risk to the people affected, you report the incident to the [Swiss data protection commissioner](https://www.edoeb.admin.ch) as quickly as possible. A hacked contact form or a newsletter export sitting in the wrong inbox can already qualify.

The **record of processing activities** is voluntary for companies with fewer than 250 employees, as long as no sensitive data and no high risk profiling are involved. Most SMEs are therefore off the hook. The list is still worth keeping, because without it the other three duties are hard to handle properly.

<img src="/blog/revdsg-datenschutz-check-visual.svg" alt="Two websites compared: on the left a copied privacy notice with tracking that loads without consent, on the right a revDSG compliant site with a real notice, a consent dialog and EU hosting" style="display:block;width:100%;height:auto;margin:2.5rem 0;border-radius:0.5rem;border:1px solid #E9EEF6" />

## Who is affected and what does a breach cost?

Every company based in Switzerland that processes personal data is affected. A contact form is enough. Even a plain brochure site logs IP addresses on the server. Those are personal data too.

If you also sell to customers in the EU or send newsletters there, the GDPR applies in parallel. Its consent requirements are stricter. Meeting the revDSG alone does not finish the job in that case.

Fines are one part of the story: up to CHF 250'000, imposed on the responsible individual rather than on the business. You cannot simply pass them back to the company. In practice fines are rare and the law is enforced on complaint. The more realistic damage is different. Business clients and public buyers increasingly ask for proof before they sign anything. A privacy notice that obviously came from someone else's website makes a poor first impression.

## Where does your data sit and why does it matter?

Personal data may leave Switzerland if the destination country offers adequate protection. For the EEA that is the case. For the United States, the [Swiss US Data Privacy Framework](https://www.edoeb.admin.ch/en/15082024-new-swiss-us-data-privacy-framework) has applied since 15 September 2024: you may transfer data to a certified US provider without extra safeguards, to an uncertified one you may not. Very few site owners know that distinction.

That is why we host in the EU at <span class="brand-mark">amai<span class="spark">!</span></span>. Database and storage run on Supabase in an EU region, delivery through Cloudflare, email through Resend. All three appear by name in our own privacy notice, including purpose and location. That level of detail is what the law is asking for.

## How do you make your website compliant in seven steps?

1. **Take inventory.** List every place your site collects data: contact form, newsletter, appointment booking, chat, statistics, embedded maps, videos and fonts loaded from other servers. The list is almost always longer than expected.
2. **Rewrite the privacy notice.** Do not copy one. It names your actual tools, the purpose, the retention period, the recipients and the contact address for access requests. A notice listing services you never use is itself misinformation.
3. **Trim your forms.** Every field needs a reason. Phone number, date of birth and company size pile up quickly, even though a quote request needs a name and an email address. Fewer fields also lift your enquiry rate.
4. **Load tracking only after consent.** Google Analytics, the Meta pixel and Google Ads conversion tags belong behind the consent dialog. What matters is that the dialog genuinely holds the scripts back. A banner that only informs while everything already loads underneath is cosmetics.
5. **Clear up foreign transfers.** Ask your host and your newsletter provider where the servers stand. If something sits in the United States, check the certification under the Data Privacy Framework. That takes ten minutes per provider.
6. **Define the processes.** An address for access requests that someone actually reads. An internal note on who informs the commissioner after a leak. Thirty days sounds generous until the request arrives during the holidays.
7. **Recheck regularly.** A new plugin, an embedded video or an extra ad account brings new tracking along. Without a check your notice is out of date again within six months.

That last point is the one we automate. Our Feedback Loop looks every month at how you show up on Google and in AI answers. In the same pass we check whether new scripts appeared on the site or whether the privacy notice has drifted away from reality. That way you find the gap yourself instead of a customer finding it.

<div style="margin:2.5rem 0;padding:1.5rem 1.75rem;border-radius:0.75rem;background:#E9F3EE;border:1px solid #C7EBD8">
  <strong style="display:block;font-size:1.15rem;color:#16233D;margin-bottom:0.4rem">Does your website meet the revDSG?</strong>
  <p style="margin:0 0 1rem;color:#5B667C">We check it for free. You learn which scripts load without consent, whether your privacy notice matches the site and where your data sits. You also get a list of the points worth fixing first.</p>
  <a href="/en/website-analyse"><strong>Request a free revDSG check →</strong></a>
</div>

## Do you need a cookie banner in Switzerland?

The revDSG does not demand consent for purely technical cookies. Swiss telecommunications law only requires you to inform visitors and let them refuse. A shopping cart or a language setting may therefore work without a click.

Analytics and advertising are a different matter. As soon as Google Analytics, Ads remarketing or a pixel is involved, data goes to third parties. For visitors from the EU you then need real consent. In practice that means a lean dialog with equally prominent buttons for accept and reject, without dark patterns.

For Google Ads this has a side effect that surprises many advertisers. Without a properly wired consent mode you lose conversion data and your campaigns end up optimising on gaps. Clean data protection and working advertising are the same job here.

## Frequently asked questions

**Does the revDSG apply to my small website without a shop?**
Yes. The law applies as soon as personal data is processed. It sets no minimum company size. A contact form or server logs containing IP addresses are already enough. Small companies are merely exempt from the record of processing activities, as long as they handle no sensitive data.

**Do I really need a cookie banner?**
Not for cookies that are strictly necessary. As soon as you load analytics tools, advertising pixels or embedded third party services, you need a consent dialog that genuinely holds those scripts back until the visitor agrees. For an audience in the EU the GDPR applies on top.

**What does a breach of the revDSG cost?**
Intentional breaches of the duty to inform or the duty to provide access can be fined up to CHF 250'000. The fine targets the responsible individual inside the company. Enforcement usually follows a complaint. The more common damage is lost trust with customers and buyers.

**May my website be hosted outside Switzerland?**
Yes. Hosting in the EEA is unproblematic because an adequate level of protection is recognised there. For providers in the United States you may transfer without extra safeguards only if they are certified under the Swiss US Data Privacy Framework. Either way the location belongs in your privacy notice.

**Is a generated privacy notice good enough?**
As a starting point yes, as a finished product rarely. A generator does not know your tools. A notice that lists services you do not use fails the duty to inform. So does one that stays silent about what runs in the background. Reconciling the text with what actually loads on your pages is the real work.

*This article is general guidance and not legal advice.*

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Does the revDSG apply to my small website without a shop?","acceptedAnswer":{"@type":"Answer","text":"Yes. The law applies as soon as personal data is processed. It sets no minimum company size. A contact form or server logs containing IP addresses are already enough. Small companies are merely exempt from the record of processing activities, as long as they handle no sensitive data."}},{"@type":"Question","name":"Do I really need a cookie banner?","acceptedAnswer":{"@type":"Answer","text":"Not for cookies that are strictly necessary. As soon as you load analytics tools, advertising pixels or embedded third party services, you need a consent dialog that genuinely holds those scripts back until the visitor agrees. For an audience in the EU the GDPR applies on top."}},{"@type":"Question","name":"What does a breach of the revDSG cost?","acceptedAnswer":{"@type":"Answer","text":"Intentional breaches of the duty to inform or the duty to provide access can be fined up to CHF 250'000. The fine targets the responsible individual inside the company. Enforcement usually follows a complaint. The more common damage is lost trust with customers and buyers."}},{"@type":"Question","name":"May my website be hosted outside Switzerland?","acceptedAnswer":{"@type":"Answer","text":"Yes. Hosting in the EEA is unproblematic because an adequate level of protection is recognised there. For providers in the United States you may transfer without extra safeguards only if they are certified under the Swiss US Data Privacy Framework. Either way the location belongs in your privacy notice."}},{"@type":"Question","name":"Is a generated privacy notice good enough?","acceptedAnswer":{"@type":"Answer","text":"As a starting point yes, as a finished product rarely. A generator does not know your tools. A notice that lists services you do not use fails the duty to inform. So does one that stays silent about what runs in the background. Reconciling the text with what actually loads on your pages is the real work."}}]}
</script>
