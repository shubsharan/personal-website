---
title: 'Let''s talk about the launch'
description: 'We did it, Joe'
publication: 'Failing Loudly'
pubDate: '2025-08-14'
canonicalURL: 'https://failingloudly.substack.com/p/lets-talk-about-the-launch'
---

Hello, friends! Welcome to Failing Loudly #5. I’m your host, Shub and I’m building Plotpoint, an interactive, location-based storytelling experience that gives you a reason to go outside, explore your city, and have an adventure with your friends. We launched our first story at the Outside Lands music festival in San Francisco, six days ago on August 8.

Let’s talk about it.

![We did it Joe Blank Template - Imgflip](https://substackcdn.com/image/fetch/$s_!CR1k!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F31e92559-3358-410a-a297-90518a6520c3_1048x819.jpeg)

* * *

## The game

Before we dive into our findings, let’s talk about the game itself. The story was called *The Touring Test,* and it was about a new hotshot AI startup called Kempelen Labs that was getting ready to release MIRA, a fully AI popstar that can create its own songs, produce its own live shows, and interact with its own fans. The users play the role of field debuggers recruited by Kempelen Labs to help ensure a smooth launch at the festival.

The game had 5 main levels:

1. **Password** – Users have to create a secure password, tackling increasingly frustrating validation requirements which stack to include things like OSL trivia, basic arithmetic, and even a chess puzzle. At the end, the user has to scroll to the bottom of a very long, very unhinged Terms and Conditions agreement which includes, amongst other things, [the entire script to the Bee Movie](https://www.youtube.com/watch?v=VAvc9htpqbE). Also, I made it so that the page would freeze if you scrolled too fast because I thought that was funny.

2. **Debug** – MIRA’s LLM is hallucinating and users need to fix it. This was a quick two step puzzle. First, users had to identify the headlining artist that MIRA had “accidentally” copied 99% of the lyrics from. Second, users had to look at a setlist and identify which performance featuring MIRA was impossible because the artist was not performing on that day.

3. **Servers** – Users had to go around the park to find NFC tags that designated server nodes they had to connect to. These tags were placed at food vendors who had given me permission in advance (Reem’s, Brenda’s, and Fowl + Fare)

4. **Teamwork** – Users had to unscramble a secret message exposing the fraud behind Kempelen Labs by adding at least 3 friends who all have different fragments of the final transmission.

5. **The End** – Users read logs of internal Slack messages at Kempelen Labs revealing that the AI is fake, and that MIRA is really a team of overseas developers manually hacking everything together. AI = Actually Indians, in a nod to [the hilarious Amazon Fresh story](https://www.washingtontimes.com/news/2024/apr/4/amazons-just-walk-out-stores-relied-on-1000-people/).

Check it out. Here are some screens from the game, as well as a look at the inbox view, where users received messages advancing the story, and a badges page where they earned badges for their progress.

A few eagle-eyed players were able to make the connection between Kempelen Labs and Wolfgang Von Kempelen, the 18th century Hungarian engineer behind [the Mechanical Turk](https://en.wikipedia.org/wiki/Mechanical_Turk), a famous con that involved a chess-playing automaton designed to impress the Empress of Austria, which was later revealed to be just some guy hiding in a machine.

![You like Jazz? in 24 different languages](https://substackcdn.com/image/fetch/$s_!n2tG!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F19ffc76f-15ff-42a2-9a49-21758721dc86_1280x720.jpeg)

* * *

## Expectations vs. Reality

When I started out, I had a handful of targets I was aiming for. In order for the Plotpoint launch to be a success, I was hoping for:

- **100 RSVPs** – We have 26 subscribers on this newsletter, and I get consistent engagement from 10-15 people online. My biggest goal here was to expand past my personal network. I was planning to reach out to 20 friends, get referred to 2-3 more friends each on average, and get some organic traffic.

- **50 players** – Not everyone who signs up plays, but I was hoping that at least half of the people who signed up would engage with the story during the festival.

- The last goal was simple: deliver the experience. I didn’t have any usage targets. I just wanted to pull this off without everything exploding.

How did we actually do?

- **465 RSVPs** – [420 replied “Attending”](https://www.youtube.com/watch?v=96NAk-hcIOc&list=RD96NAk-hcIOc&start_radio=1) and 45 replied “Maybe”

- **130 players** – Total across the entire weekend.

- It worked!

Holy cow. That was really something. What did we learn?

## Old-school marketing works

I’ve been struggling to break out of my personal bubble with online content. This makes sense. Only my followers see my stuff and I don’t have enough engagement to reach escape velocity.

What did work? Flyering.

I set up roughly 80 flyers across 3 streets in the city: Valencia, Hayes, and Divisadero. I only flyered for one day and I did not return to put back up flyers as they got taken down. Based on my extremely rough estimates, Hayes was the most successful area, followed by Divis.

In the future, I’d like to add some more granular tracking so I can see exactly which location each signup came from.

## I designed the game poorly

![](https://substackcdn.com/image/fetch/$s_!JqNs!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F15a31027-209f-4b55-a3da-1ef7269fb638_656x492.png)

*33.8% of players made it past the password puzzle*

Yikes, those drop-offs were scary to watch happen in real time. Only one-third of players made it past the first password puzzle and only 5.4% of users were able to finish the game.

We received 8 support requests during this weekend. 7 of them were about the password puzzle and 1 was letting me know our servers went down (we had too much traffic for my broke boy cloudflare plan and I had to upgrade lol)

What does this mean? It means I didn’t do a great job of designing a difficulty curve. Instead of letting users play right away and ramping up the difficulty towards the end, the game started off with the hardest puzzle and was up-and-down from there. I play video games, so I should have realized this. I suppose I just had so much else going on that this part of the design slipped my mind.

Oh well! A valuable learning for next time.

## A festival was not the best place to launch

Again, this is something that makes sense looking back. Music festivals are chaotic places with hundreds of things competing for your attention. You’re trying to get to the acts you want to see, you’re trying to meet up with different friend groups who are all roving, you’re eating, you’re drinking, you’re doing drugs, and you really need to pee but the lines aren’t moving.

It’s a lot.

This also likely played a large role in the initial drop-off rate. People showed up, tried the game, and immediately decided to nope out because it required more focus than they had. That’s not their fault!

Outside Lands was a pretty arbitrary launch window for me. I’m glad I did it, but I do not think I’m going to return to the festival circuit before I’ve done a lot more work.

## Businesses want to work together

I reached out to 16 businesses on Instagram on Wednesday, two days before the festival started. I told them about the scavenger hunt, and I asked if they would be willing to:

1. Let me place NFC tags at their booths

2. Offer a promo for users to encourage business while they’re there

Out of the 16 messages I sent, 8 businesses got back to me. 2 of them politely declined but told me to come back later when we might have more time to plan something. 6 of them said they would be happy to work together. None of them were able to offer a discount. It seems like we were simply too close to the event for them to shake up their plan, and many of them said that they did not have control over the POS system at the festival in the first place. That makes sense, and it’s good to know for later.

There’s something here, and I’m going to keep digging on this front.

## What’s next?

I’m taking most of this week to dig through the data and see if I can extract any more knowledge from the launch. I have a few ideas of what we could do next, but I’m going to let them marinate for a few more days before.

Here’s what I do know:

1. We need to launch new stories and we need to launch soon.

2. I thrive under pressure. Aggressive timelines keep me focused on delivering truly minimal MVPs.

3. Building in public is good for me. It makes me feel like I have to be accountable to someone else, and it lets me practice writing, which is what I enjoy.

Was our launch perfect? Absolutely not. Our servers went down, someone stole my NFC tags (why? asshole), and the overall product was an uneven, often janky experience.

Was our launch a success? Absolutely yes.

> *"If you're not embarrassed by the first version of your product, you've launched too late."***–** Reid Hoffman, Co-founder of LinkedIn

Check, and check. See you next week!
