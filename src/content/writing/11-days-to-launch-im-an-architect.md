---
title: '11 Days to Launch – I''m an architect now, actually.'
description: 'IT''S ALIVE! IT''S. A. LIIIIIIIIIVE!'
publication: 'Failing Loudly'
pubDate: '2025-07-28'
canonicalURL: 'https://failingloudly.substack.com/p/11-days-to-launch-im-an-architect'
---

Hello, friends! Welcome to Failing Loudly #3. I’m your host, Shub. We are currently 11 days away from launching a new product at Outside Lands 2025. Plotpoint is an interactive location-based storytelling experience that gives you a reason to go outside with your friends and engage with your surroundings in a new way.

Today, we’re going to talk about launching a waitlist and building out an MVP (Minimum Viable Product) that we can test on August 8th.

What are we talking about today?

1. We built a thing!

2. We launched a waitlist website!

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!OSXp!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd231007e-0cf9-4dd1-81d1-8640ec20d84b_640x360.jpeg" alt="" />
  <figcaption>Me, deploying my build to Cloudflare</figcaption>
</figure>

## 👀 Introducing… Plotpoint!

We have a semi-working version of an app. Here’s what’s working right now:

1. Users can sign up and log in with their emails (social signups next)

2. We can publish stories to the app and mark them as Published, Draft, or Archived. The story above is marked as Draft, which is why the button says Coming Soon.

3. We can add “Pages” to each story. In our system, pages are content nodes. They can be chapters, scenes, videos, images, audio recordings, etc. Anything a user will actually consume.

4. We can add “Challenges” to each page. Challenges are like gates you need to unlock in order to access a page. Here are some challenges I’ve set up:

    1.  **Waypoint**: Navigate to a location on the map

    2.  **Compass**: Follow the direction and distance displayed on a compass to find a location.

    3.  **Secret Location**: No visual clues, just a hint. The gate will unlock when you enter the secret location.

    4.  **Password**: Enter a text password or phrase.

    5.  **Passcode**: Enter a numeric code.

    6.  **Timer**: You can only unlock the gate during certain hours or days.

5. We can create “Saves” that track a user’s progress for a story.

6. We have a profile page where users can view their active stories.

I’d love to add more challenges over time so that anyone else who makes their own stories has a big box of legos they can use.

## 🛠️ How did we build this?

1. We created a backend using [supabase](https://supabase.com/). When we add information to our database, our app will pick it up and update accordingly. This is where we save information like users, stories, saves, etc.

2. We wrote the front-end code using existing component libraries like [shadcn](https://ui.shadcn.com/) so that we could move quickly. All we did was update the styling for colors using a tool called [tweakcn](https://tweakcn.com/).

3. For the Waypoint Challenge, we are using open-source tools like [MapLibre](https://maplibre.org/) (Mapping), [OpenStreetMaps](https://www.openstreetmap.org/#map=5/38.01/-95.84) (Location data and map tiles) and [Turf](https://turfjs.org/) (geospatial analysis).

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!Aqvf!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F849759d1-f162-44cb-b4ab-e4df273aed3e_3840x2160.png" alt="" />
  <figcaption>this is what our database looks like</figcaption>
</figure>

Why do we have so many tables all linked together? Wouldn’t it be easier to have one big “file” that has all the data we need for each story?

Yes, and no. In the early 1970s, computer scientist Edgar Codd proposed a concept called [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization). Basically, what this means is that it’s a smarter idea to make a bunch of modular tables that all work together, because it makes it easier to edit individual parts without disrupting the entire operation. For example, we can easily change the structure for pages or gates without having to worry too much about changing the structure for everything else. At some point, we can even break gates out into their own tables for location gates, password gates, etc, but this structure is good enough for now, and it lets us move quickly.

Let’s zoom out for a moment and look at the big picture. Why are we putting so much thought into our backend structure? Shouldn’t we just hard code everything and figure it out later?

Maybe! If the goal is to just deliver one game to play at Outside Lands, then that’s definitely what I would do. But we have higher aspirations than that, and I think it’s worth putting a little more effort in at the beginning so that we can continue to move quickly down the road.

I’d like to create a platform where anyone can create and publish their own stories. I’m hacking together this first one, sure, but I’d like to invite writers and creators everywhere to join us and start creating stories for locations that are special to them, all across the world.

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!0Jap!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd95eec65-e032-47f1-95ea-d46c87361bc5_245x152.gif" alt="" />
</figure>

## 🗒️ What’s next for product?

First off, I’m incredibly excited to have made so much progress. We are essentially ready to go at this point. There are some rough edges that need to be cleaned up and everything looks quite ugly at this point, but most of the features we need to get started are ready to go.

I’d also like to take a moment to say that I’m proud of myself. I’m not a software developer, and I’ve never had to code for a living. When I started kicking this idea around, I didn’t have any idea what I was doing. I still don’t, but at least I know how to figure stuff out and I feel like I’m learning a lot every single day. Fun!

Next, I’m going to move on to building the actual story that we’ll be playing together at Outside Lands. This is going to take some time and I want to try to get as creative as I can. If you have any ideas for fun puzzles or riddles we can use, let me know and I’ll try to incorporate them!

In terms of the product, here’s what’s left:

1. We need to add something called Anonymous Authentication so that people can start stories without creating a profile first (lower barrier to entry) and then create an account later on to save their progress.

2. We need to make the styling for each section more flexible so that we can get creative with how each challenge and page is displayed. Right now, everything looks like the same blog post format.

## 👀 We launched a waitlist!

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!4kn9!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F82de5a1b-fe35-474f-bb6b-d861faeee780_4800x4800.png" alt="" />
  <figcaption>Check it out at plotpoint.io</figcaption>
</figure>

We launched a [waitlist website](https://plotpoint.io/) on Saturday. It’s extremely janky and it’s only one page, but it does the job. Here’s how it works:

1. Users can enter their emails to get on the waitlist

2. They receive a welcome message (automated via [Mailchimp](https://mailchimp.com/))

3. That’s it, that’s the website

I’m using the plotpoint.io domain I bought last year when I set this up to propose to Malak. Someone bought plotpoint.com in 1997 and has been sitting on that domain ever since. I’d love to buy it from them one day but, for now, .io will have to work.

## 📊 Let’s talk numbers

<figure>
  <img src="https://substackcdn.com/image/fetch/$s_!Qbfr!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff1523016-d33d-4872-a878-8b6dc45f914f_1024x1190.png" alt="" />
  <figcaption>Substack stats after 1 week</figcaption>
</figure>

I created this Substack newsletter on July 20th and published my first post ([Let’s Build a Company in Two Weeks](https://failingloudly.substack.com/p/lets-build-a-company-in-two-weeks)) on July 22nd. That means we’ve been building publicly for just about one week, and we have 11 days left to get as many waitlist users as possible.

1. We have 24 subscribers.

    1.  12 of you joined from my initial launch announcement, 11 of you joined directly from my first post, and 1 of you joined after my second post

    2.  Open rates are good! At least for our first couple posts, it looks like most of you are actually reading these. Thank you!

2. We have 24 users on our waitlist

    1.  10 people subscribe to this Substack and have joined the Waitlist.
        (Gold star for this group. I love you more than the others.)

    2.  14 people sub to this Substack but not the Waitlist
        (Please join at [plotpoint.io](http://plotpoint.io)!)

    3.  14 people have joined the waitlist but don’t follow this Substack
        (I will cross-promote later, because I think this Substack is a better way to engage with users while I’m building this than a traditional marketing campaign would be.)

## 🚀 What’s next?

We’ve made some great progress, but now is when things get real.

1. We need to create our launch story

2. We need to clean up the product so it’s ready enough

3. We need to kick marketing into gear

4. I really need to break into Reels and Tiktok, but I think I’m actually clueless about that. Does you any tips or, even better, would you like to help me?

As of now, I know almost everyone on this mailing list personally. That’s amazing, because it means my friends and family are showing up to support me. Thank you! I love all of you equally (ignore what I said above).

The next step is to break out of this bubble. I need to start bringing in people from outside my personal network. There are a couple ways I plan on doing this:

1. **Ask all of you to share my content with your networks**

* * *

2. **Use existing platforms**: I’m posting daily—sometimes twice daily—on Substack Notes. Engagement has been quite low so far, but I’m going to keep at it and hope people find me there. I’m also posting on LinkedIn (tragically, I’ve seen the most engagement here), and Instagram (only my existing network)

3. **Physical Marketing**: I want to connect with people in San Francisco, who might be curious about this type of thing, and who might be going to Outside Lands next month. So… I guess I’ll go outside and see what kind of interest I can drum up. I’ll report back on this later this week.

That’s all for today!

If you liked what you read, please like, comment, subscribe, share, etc.
