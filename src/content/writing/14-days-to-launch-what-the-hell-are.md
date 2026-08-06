---
title: '14 Days to Launch – What the hell are we doing here?'
description: 'There''s a picture of my cat halfway through and if you don''t comment hi, it''s bad luck.'
publication: 'Failing Loudly'
pubDate: '2025-07-24'
canonicalURL: 'https://failingloudly.substack.com/p/14-days-to-launch-what-the-hell-are'
---

Hello friends! Welcome to Failing Loudly #2. I’m your host, Shub. We are currently 14 days away from launching Plotpoint at Outside Lands 2025. [In our previous episode](https://failingloudly.substack.com/p/lets-build-a-company-in-two-weeks), we talked about how I built a fake company to propose to the love of my life.

👋 There are 23 more of you here now than before. That’s very exciting. Today’s episode is more meme-heavy on the back-end, so stick around.

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!SrSC!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd819e7a3-1643-494e-84e9-03b627e53a93_220x220.gif" alt="" />
</figure>

## What the hell are we doing?

Good question. We’re starting a company, and that means we need to figure out what to build and how to sell it. We’re also running on a comically compressed timeline, and our budget is however much I’m saving by not Doordash-ing lunch every day this month, so we need to be smart about our resources.

Let’s break this down into two seven-day sprints:

- Sprint 1: Build app (75%) / Begin marketing (25%)

- Sprint 2: Scale marketing (75%) / Build launch story (25%)

Before we begin, let’s consult that Holy Tome of strategy: *The Lean Startup*, by Eric Ries. What wisdom does Eric have to get us started?

> **“Reading is good, action is better.”**
>
> – Eric Ries, *The Lean Startup*

Perfect!

*closes book*

## What are we building?

Plotpoint is a location-based storytelling experience. To test our idea, we need a story, and we need an experience. Here is the rough outline for what we’re going to produce over the next two weeks:

## What do we need?

1. We need authentication + authorization

2. We need a story page where potential users can learn about the story and all the fun stuff it offers before they decide to start playing.

3. We need a reader experience where users can read each page of the story.

4. We need a way to gate each page behind a series of challenges, so that the user can’t see the page until they solve all the challenges.

5. We need pages for each challenge.

6. We need a way to track a user’s progress so we know which gates they’ve unlocked and which pages they’re allowed to access.

7. We need a profile page where the user can see their reading list and do profile stuff like update their password, add a profile picture, etc.

8. We need the story itself – a specific arrangement of pages and challenges

## What would be nice to have?

1. Social features that encourage users to interact with one another

2. Gamification (points, badges, leaderboards)

3. Comments and reviews

4. Knowledge of how to do any of this (ha! good one…)

## What’s the stack?

For those of you who’ve touched enough grass to not know, a “stack” is the collection of technologies used to build and run a software product. If you have questions about why we’re picking something, or thoughts on what we should pick instead, tell me in the comments!

1. [Supabase](https://supabase.com/) – Open sourced Postgres database, auth, API layer, file storage, etc.

2. [Cloudflare](https://www.cloudflare.com/) – Hosting and deployment. The *edge[^1]*, baby.

3. [Tanstack Start](https://tanstack.com/start/latest) – Full-stack React framework with SSR and server-functions

4. [Tanstack Query](https://tanstack.com/query/latest) – Asynchronous state (server state) management

5. [Shadcn](https://ui.shadcn.com/) – UI components

6. [Tailwind](https://tailwindcss.com/) – CSS styling framework

7. [Notion](https://www.notion.com/) – Project management, docs, CRM, etc. This is Business HQ.

8. [ChatGPT](https://chatgpt.com/) – Therapy

Now, you might be wondering how I’m actually going to write this code. In this era of “vibe-coding”, why don’t I just yell at [Replit](https://replit.com/), or [Lovable](https://lovable.dev/?gad_source=1&gad_campaignid=22087262552&gbraid=0AAAAA-VsFTIRmnNZLP3SIq35X9wuqzmRa&gclid=Cj0KCQjws4fEBhD-ARIsACC3d2_5pm60alQAvlzv6iHUKeZTSjwKe8p-X_l074zo9zs-Xmh1ABIgQGQaAqF9EALw_wcB#via=62e1f62), or [Bolt](https://bolt.new/), or even [v0](https://v0.dev/)? The answer to that is threefold:

1. I’m not skilled enough to afford spaghetti code. I’ve been down this rabbit hole before with other projects, and AI is more like a lazy employee than a magical savant. If you’re a crappy manager who doesn’t know what your employee is doing, they’re going to give you crappy work. You’re not going to know it’s crappy until it’s too late, and you won’t even know enough to tell them what to change to make it not-crappy. So, alas, I need to learn before I can delegate.

2. I consider myself a craftsman. This is not a good thing. I’m a painter and a writer, and I take immense pride in the design of what I’m building. This means my ego says I can hand-craft a better experience than what AI can churn out. This is unlikely to be true, but don’t you ever do stuff for the love of the game?

3. I’m a fucking sicko who likes making everything harder than it needs to be.

I will be using AI. Quite a bit, actually. I’ll just be using it to help me with syntax, debugging, etc. Tasks where I know enough to check its work. I’ll also be using it quite a bit for automating marketing tasks.

Which brings us to the next question…

## How do we get people to care?

Marketing is hard. I have yet to figure it out and if someone tells you they can figure it out for you, throw rocks at them before they try selling you a course.

That being said, here’s what I’m going to try. Once upon a time, I bought a business book. Like an actual physical book. It’s called *Traction*, by Gabriel Weinberg and Justin Mares. They built [DuckDuckGo](https://duckduckgo.com/).

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!BGM_!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F38358aac-dbee-4ee0-a591-24ad02155be0.heic" alt="" />
  <figcaption>Everybody say hi to Rich in the comments or it’s bad luck</figcaption>
</figure>

I quite like this book, actually. In it, the authors outline 19 channels you should experiment with to generate (you guessed it) traction.

> **“When going through the traction channels, try your best not to dismiss them as irrelevant for your company. Each traction channel has worked for startups of all kinds of phases.”**
>
> – Weinberg, Mares, *Traction*

Due to time, budget, and domain issues, some of these channels will be irrelevant for our company and can be dismissed, but here are the ones I think worth exploring:

1. **Targeting Blogs**: Asking other blogs to write about us

2. **Publicity**: Asking local press and media to write about us

3. **Unconventional PR**: Using publicity stunts or going above-and-beyond for our customers in a way that gets people talking.

4. **Social and Display Ads**: I have like $3 but if we kick Instagram maybe something falls out?

    <figure>
      <img src="https://substackcdn.com/image/fetch/$s_!n9tU!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe58c04d9-f806-41c2-a218-2546de4f75d2_600x417.jpeg" alt="" />
    </figure>

5. **Offline Ads**: For us, this basically means flyers. Unless you’re a pilot, in which case I’ll give you $500 for some skywriting.

6. **Content Marketing**: Running a blog or newsletter. Wait a second. This is a blog or newsletter. Are we… is this marketing right now???

    <figure>
      <img src="https://substackcdn.com/image/fetch/$s_!jTVb!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Feb5a83b8-d910-4961-9832-3cfa71a9e3a8_888x499.jpeg" alt="" />
      <figcaption>it*</figcaption>
    </figure>

7. **Viral Marketing**: Encouraging our users to refer other users.

* * *

8. **Business Development**: Partnerships with other businesses

9. **Existing Platforms**: Focusing growth efforts on existing megaplatforms that have already solved targeted distribution at scale. This is Facebook, Instagram, *REDACTED*, LinkedIn, etc. Maybe even Substack now.

10. **Offline Events**: Anyone want to hang out?

11. **Community Building**: Seriously, if anyone wants to hang out and talk about Plotpoint, let me know in the comments and I’ll make a Discord.

## How do we earn revenue?

Just kidding. Unless one of you is actually Marc Andreessen in a trench coat and wants to fund me, we’re going to need to make some money. We need to make money for two reasons:

1. Validation. No amount of user interviews or problem stack-ranking exercises will give us as strong a signal as people paying us money to use our product. We need validation before we step on the gas, because we need to know we’re driving in the right direction before we run out of fuel.

2. I have $3

## Monetization models

Lucky for us, I have a bazillion ideas on how this thing can make fat stacks. Let’s start with the easiest to test:

### Users

People could buy individual stories or subscribe to Plotpoint overall for access to more stories.

This one’s tricky. If our stuff is sick, people will pay, but we don’t want to charge too early, because we want to get as many users as we can to test our product. What do you think? How much would you pay to go on a weekend-long quest with your best friends? Would you pay $5? $10?

Seriously, let me know.

### **Sponsors**

This one’s fun. Businesses could sponsor stories. For example, if a story takes place in a coffee shop, maybe Sightglass, or Ritual wants to sponsor it so that everyone playing comes to their business to unlock a challenge. We can do promo deals, sponsored products, etc. Also, companies can sponsor stories overall as a way to engage with their customers in the real world.

Do you know a company? Are you a company? As of 2010’s Supreme Court Ruling in *Citizens United v. Federal Election Commission*[^2], corporations are people too, so any one of you could be a company right now and we’d never know it.

Anyways, if you think this could work, let me know. How much do you value a referral customer? Let’s chat about it.

## What’s next?

Okay, that’s enough *stratergizing* for one day. I’m going to get to work on building this damn thing. Walking the walk, so to speak.

What do you all think? I know today’s post was a departure from the love story I sneak-attacked (snuck-attacked?) you with last time, but was it interesting at all? I’m still trying to figure out what the best balance is for this newsletter.

## ‼️ I need your help ‼️

Should each edition be a more general update, or a deep-dive into a specific part of what we’re working?

- How technical should I get?

- How often should I send these out? Once a week? Twice a week? Once a week feels good, but we’re in such a short timeline that only 2 posts for this whole project feels ludicrous.

Seriously. Let me know in the comments. At some point, the void must shout back.

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!meEd!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F49ce08af-7551-4bf8-929e-fc529d690ca4_2400x2400.png" alt="" />
</figure>

* * *

[^1]: https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/
[^2]: https://www.fec.gov/legal-resources/court-cases/citizens-united-v-fec/
