# UI Research Digest for Victoria Tort

> Updated: April 10, 2026  
> Scope: client-facing e-commerce UI and 3D constructor shell  
> Positioning: warm premium bakery e-commerce with Apple-level clarity, not an Apple clone

## Why this exists

This digest translates current web design and e-commerce UX guidance into rules that fit this project:

- local bakery brand, not a global tech store;
- Russian-language UI;
- mixed product model: standard catalog + premium 3D cake constructor;
- existing stack: Next.js, Tailwind 4, HeroUI, Framer Motion.

The goal is not to imitate reference sites literally. The goal is to extract the structural logic behind strong interfaces and apply it to a bakery storefront.

## Source base

Primary sources reviewed on April 10, 2026:

- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Baymard, Product Page UX 2026: https://baymard.com/blog/current-state-ecommerce-product-page-ux
- Baymard, Homepage & Category Navigation UX 2025: https://baymard.com/blog/ecommerce-navigation-best-practice
- Baymard, Guest Checkout prominence: https://baymard.com/blog/make-guest-checkout-prominent
- Baymard UX research overview: https://baymard.com/product/ux-best-practice-guidelines
- NN/g, 5 Visual-design Principles in UX: https://media.nngroup.com/media/articles/attachments/Principles_Visual_Design-Letter.pdf
- NN/g, Images on Mobile: https://www.nngroup.com/videos/mobile-images/

Pattern references used as style and flow benchmarks:

- Apple Store: https://www.apple.com/store/
- Apple buy flow: https://www.apple.com/shop/buy-mac/macbook-air/13-inch-m1
- Nike PDP: https://www.nike.com/t/hyperice-hyperboot-shoes-0v8aYsXz
- Aesop PDP: https://www.aesop.com/us/p/body-hand/hand/reverence-aromatique-hand-wash/

## Core findings

### 1. Visual hierarchy matters more than decoration

Apple HIG repeatedly centers hierarchy, harmony, and consistency. NN/g reinforces the same idea through scale, visual hierarchy, balance, and contrast. The practical implication is simple:

- the most important decision on each screen must dominate the composition;
- the interface should not ask the eye to process several equally loud elements at once;
- typography, spacing, and contrast should carry the UI more than effects.

For this project:

- the homepage should clearly prioritize `catalog`, `constructor`, and trust;
- the product page should clearly prioritize `image`, `price`, `weight`, and `add to cart`;
- the cart and checkout should clearly prioritize `summary`, `next step`, and `confidence`.

### 2. Premium UI is usually restrained, not effect-heavy

Apple uses restraint, not noise. Aesop does the same in a warmer and more editorial way. Premium perception usually comes from:

- strong proportions;
- calm spacing;
- disciplined color use;
- excellent product media;
- polished typography;
- consistent surfaces.

It usually does not come from:

- generic gradients everywhere;
- blurred glass cards as the main identity;
- excessive corner radius on every element;
- “luxury” shadows with weak content inside.

### 3. Homepage UX should help users choose a path quickly

Baymard’s 2025 homepage and category navigation benchmark reports mediocre-to-poor performance for much of the market. That is important because many stores still fail at a basic task: helping users decide where to go next.

For this bakery, the homepage should support three clear entry paths:

- browse ready-made products;
- launch the 3D constructor;
- build trust through ingredients, craftsmanship, social proof, and pickup clarity.

If the homepage spends too much vertical space on empty visual atmosphere or placeholder imagery, it weakens both conversion and perceived quality.

### 4. Product list pages must optimize scanning and decision confidence

Users browse category pages fast. They compare visually, skim prices, and decide which cards deserve attention. That means:

- card composition must be scannable in under a second;
- click targets must be unambiguous;
- filters and sort controls must feel immediate and low-friction;
- the page header should explain what kind of assortment the user is browsing.

Baymard also highlights ambiguity when one visual block appears to be “one thing” but performs multiple incompatible actions. This is directly relevant to cards that are entirely clickable while also containing a strong embedded CTA.

### 5. Product pages carry the buying decision

Baymard’s 2026 product-page benchmark reports that much of the market still performs only at a mediocre level, especially on mobile. Strong product pages reduce doubt by making the buying decision easy.

For this project, a strong PDP should make these items obvious immediately:

- what the cake looks like;
- what category or occasion it fits;
- how price changes with weight;
- what the pickup model is;
- what details matter before ordering.

Nike is a useful reference for choice clarity: options are obvious, the CTA stays strong, and delivery or pickup information is visible without burying the buy flow.

### 6. Checkout friction must be treated as a design problem

Baymard’s guest-checkout guidance is relevant even though this project currently requires auth before checkout. The main principle is broader than guest checkout itself:

- do not turn account handling into the most visually dominant or confusing part of the purchase flow;
- keep the route to purchase obvious;
- show order totals and pickup conditions early.

If account gating remains, the UI should still minimize surprise and make recovery paths explicit.

### 7. Mobile design should use imagery carefully

NN/g notes that decorative mobile imagery often adds height and load time without adding meaning. This is especially relevant here because premium bakery UI can easily drift into “large beige rectangles with almost no information”.

For mobile, imagery should either:

- show the product clearly;
- create trust;
- demonstrate the constructor;
- or support a decision.

If an image is only filling space, it is weakening the interface.

### 8. The best fit for this project is a synthesis, not a clone

The right direction is:

- Apple for clarity, restraint, composition, and calm interaction;
- Nike for action-focused product selection and shipping/pickup clarity;
- Aesop for warmth, tactility, ingredient storytelling, and premium softness.

This blend is better suited to a bakery than a direct Apple Store copy.

## Translation into design rules for this repo

### Visual system

- Use a warm neutral palette with one restrained caramel accent.
- Use surfaces and borders to organize space; do not rely on shadow as the main hierarchy tool.
- Reduce decorative blur usage.
- Let photography and 3D output carry visual richness.

### Typography

- The current hierarchy should become tighter and more intentional.
- Headings can feel premium and slightly editorial, but body text and controls must stay highly readable in Russian.
- Avoid mixing too many font personalities.

### Layout

- Prioritize rhythm and information density over dramatic empty space.
- Keep desktop layouts airy, but not hollow.
- Make mobile sections shorter, more decisive, and more content-rich.

### Components

- Product cards should be cleaner and less interaction-ambiguous.
- PDP buy blocks should feel more “decisive”.
- Cart and checkout should feel lighter and more reassuring.
- Constructor UI should become a premium shell around the 3D scene, not a wall of controls.

## What “anti-AI” means for this project

“Anti-AI” here does not mean ugly or anti-modern. It means avoiding common generated-interface failure modes:

- generic SaaS card grids;
- too many soft shadows and pills with no hierarchy;
- empty hero sections with placeholder atmosphere;
- purple gradients or dark glossy defaults unrelated to the brand;
- design decisions that ignore product photography;
- fake premium built from blur, not composition.

The redesign should feel designed by someone who understood:

- what is being sold;
- what users need to know before ordering;
- how bakery products should look tactile and desirable;
- why the constructor is the signature feature, not just another page.

## Recommended north star

Build a `warm premium system`:

- premium enough to feel deliberate and modern;
- warm enough to feel like a real confectionery brand;
- structured enough to perform like strong e-commerce;
- restrained enough to avoid AI-template aesthetics.
