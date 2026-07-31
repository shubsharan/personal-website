---
title: 'Let''s Build a Company in Two Weeks'
description: 'Or: How I Learned to Stop Worrying and Love the Launch'
publication: 'Failing Loudly'
pubDate: '2025-07-22'
canonicalURL: 'https://failingloudly.substack.com/p/lets-build-a-company-in-two-weeks'
---

Hello, friends! Welcome to the first edition of *Failing Loudly.* I’m your host, Shubhankar Sharan. Since this is our inaugural transmission, I feel a bit like I’m shouting into the void, but hey: if we’re going to shout, we might as well make it interesting.

We’re going to build, market, and launch a new product in two weeks.

We’re starting today. Right now. In fact, we’ve already started. The launch date is August 8, 2025: Day 1 of Outside Lands, right here in foggy San Francisco.

That’s... 17 days away.

Is it enough time? Definitely not. Can we do it? Maybe!

Let’s get into it.

## This is a love story

Before we begin, some background: I love a lot of things. Some of these things include: writing fiction; product design; the city of San Francisco; taking long walks up steep hills; and Malak Haidari.

Last July, I combined all of them into one hare-brained scheme, and used it to pitch the biggest deal of my life: marriage.

This is the story of how I built a fake company to propose to my girlfriend.

It was June. The ring was burning a hole in my pocket and, like any good stakeholder, Malak had set clear expectations: We needed to get this deal over the line before the end of Q2.

Her requirements:

1. It should feel specific to us

2. It should feel like I put a lot of effort into it

3. No public spectacles (she will leave me if I do it at a ballgame)

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!08OL!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F798a9644-6490-458b-9717-51e362a4e51e_667x374.jpeg" alt="" />
  <figcaption>It’s like Dumb Starbucks, except even dumber</figcaption>
</figure>

Here’s something about Malak: she’s knows what’s going on around town. A new coffee shop opened up in the Richmond? A Michelin-starred chef is leaving his restaurant to open a smashburger popup? There’s a secret garden hidden in an alley somewhere that presents an incredible picnicking opportunity? She already knows about it, and she’s already been. The woman loves to explore, adventure, galavant, and (most importantly) enjoy a sweet treat. That’s the what.

The where is easy: San Francisco. We love San Francisco so much. It’s provided the perfect backdrop for our romance. I knew that whatever I did, the city had to play a prominent role. I also didn’t want to make this a sentimental stroll through our past. I wanted this to be about our future—about creating new memories, new experiences, new emotions together.

> “Remember when is the lowest form of conversation.”
> – Tony Soprano

## Welcome to Plotpoint

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!9BFG!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F65bcde95-3ff1-4e2d-bedd-57fcea43a574_2400x2400.png" alt="" />
  <figcaption>I made it a little janky on purpose so she wouldn’t suspect it was me. Yes, this is a humblebrag.</figcaption>
</figure>

Plotpoint is a location-based storytelling experience. Think scavenger hunts meets Pokemon Go, meets geocaching, meets a murder mystery dinner party. Imagine a crime thriller set across town, or a series of cozy romances set in your local coffee shop. The premise is simple: people are begging for an excuse to go outside, to engage with the real world, and to use their phones for something other than doomscrolling.

I ended up writing a short story about a detective investigating an art heist and, ultimately, her ex-partner/lover who might be missing/on the run.

The gameplay loop is simple: to progress, you go to a real-world location, solve a clue, and unlock the next location.

I’ll walk you through the specifics later, but some of the chapters included:

1. A QR code planted at Ritual Coffee in Hayes Valley

2. Decoding a morse code transmission

3. Following a scripted tour through Chinatown at night

4. Finding a word in one of Shakespeare’s plays by hunting down a specific edition from a library, and unscrambling the proper act, scene, and line numbers.

Over two weeks (hmm… eerily similar to our current timeline…), I prototyped a low-code solution using Webflow for the front-end, and an extremely janky Cloudflare Worker for the back-end. It was my first time writing meaningful code, and I had no idea how to do anything. It was all hard-coded and relied on me manually going in to rebuild the app at every step to unlock the next chapter. Twilio rejected my application to send SMS messages (Twilio, if you’re reading this… we should talk), so I scrambled to create a fake Google Voice number and secretly send us unlock messages and hints while she wasn’t looking. The morning of the proposal, the person who was supposed to provide florals for the arch decided not to come because they wanted to sleep in, so my friend Noah had to hit Trader Joes at opening and buy as many bouquets as he could hold. I pretended to be blind and incapable of finding parking so that he had time to set up. Honestly? It was a mess.

It was also a lot of fun and, most importantly, it was a success.

So, that’s the idea. We’re going to do Plotpoint, but for real this time. That same sense of magic and adventure. That same reason to go outside and explore a new neighborhood, or look at your old stomping grounds in a different light.

* * *

## Our mission, should we choose to accept it

Being a founder is an intensely personal experience. Especially in the early innings, the company is direct reflection of the team and, if it’s a team of one, that means it’s a direct reflection of you.

For me, that means I need to ***love*** what I’m building, or nothing gets done. Maybe there are other mercenary-minded T1000s out there who can grind it out, fueled by sheer intellectual stimulation, but that’s not me. I find Sudoku intellectually stimulating. Doesn’t mean I want to become a professional Sudoku player. I love Plotpoint. I love the idea behind it, and I love what it represents. That’s why it might work.

Let’s see what we’re up against:

- 90% of startups fail[^1]

- 10% of startups fail in their first year

- 42% of startups fail due to misreading market demand[^2]

- 82% of businesses that failed in 2023 failed due to cash-flow issues[^3]

What does this mean for us?

- We’re probably going to blow up

- We’re probably not going to blow up right away

- We need to validate the market ASAP (more on this later)

- We need to make enough cash to stay in the game

## What’s next?

I’m going to do what I do best: build.

As we go, I’m going to walk you through my process step-by-step. We’re going to talk about market validation, building an MVP, generating buzz and marketing, and defining what success looks like. Later on, I’ll revisit the initial Plotpoint story and walk you through how I built that prototype, what I learned from the experience, and what you can do to avoid my mistakes.

That’s all for today. Thank you for allowing me to shout into the void. I hope the void shouts back.

If you liked what you read, please like, comment, subscribe, share, etc. Alert the Almighty Algorithm to our presence and maybe one day it will turn a baleful, Lovecraftian eye in our direction.

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!jCnG!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5863c6db-f052-476e-ace9-b755269ba69d_1080x1113.jpeg" alt="" />
</figure>

[^1]: https://www.failory.com/blog/startup-failure-rate
[^2]: https://www.cbinsights.com/research/report/startup-failure-reasons-top/
[^3]: https://www.fundera.com/blog/small-business-statistics
