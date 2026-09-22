---
title: Building a Russian Nesting Doll of Doom
description: 'A meaningless adventure in code injection, nested rendering, and video games'
publication: Failing Loudly
pubDate: '2026-08-24T20:08:40.000Z'
canonicalURL: 'https://failingloudly.substack.com/p/building-a-russian-nesting-doll-of'
draft: false
sync:
  source: failing-loudly
  id: 'https://failingloudly.substack.com/p/building-a-russian-nesting-doll-of'
  hash: 2d9773629cf065bb90257e47d77000fa73f8d9437fba6631f78fbf7e63c0a759
---
Last week, after a multiyear hiatus from Elon’s hellscape, I made a reluctant return to the Platform-Formerly-Known-As-Twitter. I hate this place for many reasons, but I finally started poking around to see what people are yapping about these days.

I came across this:

[View embedded media](<https://x.com/RobKnight__/status/2090106928668041363?s=46>)

This is fun for two reasons:

1.  There is a recent trend in software of trying to turn all of our tools and platforms from GUIs (Graphical User Interfaces) back into TUIs (Terminal User Interfaces) so that terminal agents can use them more easily.
    
2.  There is a longstanding tradition among developers of trying to get stuff to run in places it was never supposed to run.
    

In some ways, moving back into the terminal feels a little bit like abandoning books in favor of clay tablets.

<figure><a href="https://substackcdn.com/image/fetch/$s_!VnGO!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7ab2bddb-21f9-4080-bf0d-b546df9b877d_512x412.png"><div><img src="https://substackcdn.com/image/fetch/$s_!VnGO!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7ab2bddb-21f9-4080-bf0d-b546df9b877d_512x412.png" width="512" height="412" alt="" /><div><div></div></div></div></a><figcaption>it’s called a thesis statement</figcaption></figure>

But is this still true? The humble terminal has come a long way from where we left it years ago. Modern terminals can display pixel buffers, and we can even run entire browsers in the terminal. This, combined with decades of scripting, tooling, remote-accessibility, etc. means that we can do more in the back with less in front than ever before. For years, we put terminals inside our code editors. Now, the terminal has swallowed the editor.

That’s kind of funny.

The inversion of putting VSCode inside the terminal made me wonder: if a terminal can contain an entire graphical editor, what else can it contain?

This brought me to one of the most-asked questions in the history of software development: [can it run Doom?](https://fanlore.org/wiki/It_runs_DOOM)

For those unfamiliar, Doom is a 1993 video game developed by id Software that follows an angry Space Marine called Doomguy as he fights demons and zombies on Mars and Hell. For decades, aspiring hackers have been modifying the source code to Doom and trying to get it to run on new systems. In 2006, a YouTuber named KevlarGorilla released a video “Doom on Nintendo DS" which kicked off a frenzy of ports. People soon got Doom to run [on a TI-83 graphing calculator](https://www.ticalc.org/archives/files/fileinfo/360/36062.html), a [John Deere tractor](https://www.youtube.com/watch?v=eX86doleFCk), and a [pregnancy test](https://www.youtube.com/watch?v=V1gcoyo5Ssk).

This weekend, I decided to follow this hallowed tradition and graffiti my own mark on the slimy sewer tunnel of technological advancement.

* * *

* * *

<figure><a href="https://substackcdn.com/image/fetch/$s_!xZJW!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5b7fbad5-ed55-44b1-83ed-8d6a56d88e31_622x402.jpeg"><div><img src="https://substackcdn.com/image/fetch/$s_!xZJW!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5b7fbad5-ed55-44b1-83ed-8d6a56d88e31_622x402.jpeg" width="622" height="402" alt="" /><div><div></div></div></div></a></figure>

# Doomdoomdoom

Doomdoomdoom is an adventure in code injection, nested rendering, and scripting. These are seven layers of hell:

1.  Level 1 - A terminal on your computer ([Kitty](https://github.com/kovidgoyal/kitty))
    
2.  Level 2 - VSCode running inside your terminal ([terminal-code](https://github.com/zenbu-labs/terminal-code))
    
3.  Level 3 - Another terminal running inside VSCode
    
4.  Level 4 - A browser running inside that terminal ([terminal-browser](https://github.com/zenbu-labs/terminal-browser))
    
5.  Level 5 - a DOS emulator running inside that browser ([js-dos](https://github.com/caiiiycuk/js-dos) + [dosbox](https://github.com/jwilk-mirrors/dosbox))
    
6.  Level 6 - Doom II running inside the emulator
    
7.  Level 7 - [Another game of Doom](https://github.com/chocolate-doom/chocolate-doom) running inside Doom [via code injection](https://github.com/kgsws/doom-in-doom)
    

<figure><a href="https://substackcdn.com/image/fetch/$s_!DYtG!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7e3b8981-4840-4fd5-bc13-cc0c56788a51_820x560.gif"><div><img src="https://substackcdn.com/image/fetch/$s_!DYtG!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7e3b8981-4840-4fd5-bc13-cc0c56788a51_820x560.gif" width="820" height="560" alt="" /><div><div></div></div></div></a><figcaption>I have never been so unemployed</figcaption></figure>

# What did we learn?

Well first and foremost, I learned that I need a job before I become dangerously unhinged and start dedicating more and more of my time towards increasingly useless side quests.

But other than that, there were some interesting learnings here:

1.  We aren’t running an emulator inside an emulator. The inner Chocolate Doom game actually runs directly inside the outer Doom game by writing to a framebuffer that displays across four actual “walls” in the game.
    
2.  Doom has two files: doom.exe and doom.wad. The WAD file (literally “Where’s All the Data?”) is a file format id Software developed to store levels, textures, sprites, and sounds separately from the game engine in the .exe file. I originally thought the WAD was a library of static assets, but it turns out it can be hypnotized into its own application. The doom-in-doom project uses arbitrary code execution to borrow functions., install new hooks, and transfer control from the host executable to a new app. This is some real old-school systems programming stuff.
    
3.  Pixels and commands take different routes. While the actual images on screen flow outwards from doom &gt; doom &gt; emulator &gt; browser &gt; terminal &gt; vscode &gt; terminal, the actual keystrokes and commands you need to launch these layers and play the game flow differently. Getting inputs to flow down the chain without tripping over themselves (you don’t want a game command to trigger an action in the code editor it’s running inside) was a little tricky, so once the games were up and running, I switched over to the Chrome DevTools Protocol to channel inputs directly into js-dos’s command interface.
    
4.  Input ownership was harder than getting the actual thing to render. These exploits are well-documented at this point, so we know it can work. But actually getting the game to play itself programmatically was tricky for the reasons specified above. It took me a while to solve for browser focusing, nested terminals, keyboard locks, etc.
    
5.  I didn’t actually want to play Doom, I wanted my LLM to play Doom. This made the project architecture important. I used stuff like pinned runtimes, checksum-verified public assets, a deterministic private game bundle, repeatable recording path, and a native DOSBox reference path to give my clanker a stable platform where it could “learn” how to pierce this onion and play the game without endlessly spiraling and repeating its work.
    

Mostly, I reminded myself that software can be fun. The limitations we had back in the day meant that code was often shockingly composable and portable, and building this gimmick felt a little bit like reaching back in time to shake hands with the original developers. We have a 1993 video game, DOS emulation, WASM-era browser tooling, terminal graphics rendering, and nested applications all holding hands and working together in 2026.

# Conclusion

The practical lesson in all this is that nested applications require explicit ownership of time, input, memory, and rendering. The less practical lesson is that computers are extremely funny when asked to do something they weren’t designed to do.

* * *
