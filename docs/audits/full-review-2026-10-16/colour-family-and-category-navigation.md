# Catalogue colour families and category navigation

## Implementation rules

1. Keep every exported SKU and product record intact. A colour family is a reviewed relationship between existing records; it does not merge, rename, or renumber them.
2. Match exact product-name keywords after removing only the verified Color value, the same brand, category and subcategory, all non-colour specifications, and an equal verified unit price/currency. Record any manually reviewed title wording exception by product ID and reason.
3. Review the images to confirm the object, style, construction, and artwork stay the same. Colour labels come from the catalogue Color field; images confirm identity and are not used to invent colour names.
4. Publish only explicit family records with unique colours, a stable shared family code, and both data and image review marked complete.
5. Show the shared family code followed by the chosen catalogue colour in brackets. Keep the original SKU as the internal operational key for ordering and history.
6. Show one clear colour-count badge at the top right of the catalogue card. Use labelled colour swatches; selecting one updates the current card in place with that SKU’s images, description, code, price, stock, specifications, and actions. The URL stays on the opened product.
7. The top catalogue category selector narrows the category first, then exposes that category’s subcategories. Both choices remain in the existing URL query model and keep other filters.

## Audit result

- Source catalogue reviewed: 4,257 products.
- Across the catalogue, candidate discovery found 470 possible name/specification groups; 8 groups have price mismatches and cannot be grouped.
- The original 61 reviewed families covered 157 SKUs.
- Apparel & Lifestyle → Polos & Tees had 118 price-matched source candidates. Review confirmed 97 new same-product colour families covering 471 SKUs. Eight candidate groups were already covered by approved families; one overlapped an existing family; five had duplicate colour labels and remained separate; seven image reviews did not support a safe grouping.
- Five Polos & Tees groups were excluded because one or more variants had only a size-chart image (Hummel Eduk, Ethel Recycle, Eunice, Genise, and Marks & Spencer Tipping). Three additional size-chart-only variants were excluded from otherwise verified groups. Two further groups were kept separate where the image showed a different garment or did not confirm a matching design.
- The added families were checked against source titles, brand, category/subcategory, non-colour specifications, equal listed price/currency, unique catalogue colour labels, and master images. The repeated-colour jersey candidates remain separate.
- The first review stage added 158 families covering 628 existing SKUs, coded MGC-FAM-001 through MGC-FAM-158. Original product IDs and SKUs remain unchanged.
- MGC-FAM-060 includes the six Adidas 100% Cotton Tipping Polo colours. No source-listed Pink option was found. MGC-FAM-061 includes the eight Allen Solly women’s polo colours.

## Full-catalogue colour review batch

- The complete source audit was repeated across all 4,257 products. Candidate families were compared on source title keywords, category/subcategory, brand, non-colour specifications, price/currency, and every candidate image set.
- 284 additional same-product colour families covering 820 existing SKUs passed the checks and image review. They span the catalogue beyond Polos & Tees; stable family codes continue at MGC-FAM-159 through MGC-FAM-442.
- MGC-FAM-063 was extended from two to six Adidas Clima Lite polo colours after reviewing all six master images. The shirt construction, specifications, and prices match; the source titles also name each variant’s tipping colour, recorded as reviewed title exceptions.
- The catalogue now has 442 reviewed families covering 1,452 existing SKUs. Product records, routes, and SKU identities remain unchanged. The detailed decision record is [colour-family-review-batch-2026-10-16.json](./colour-family-review-batch-2026-10-16.json).
- Candidate groups remain separate when prices/currencies differ, the same colour occurs more than once, a product image is missing or only a size chart, images show different artwork/construction, or the images do not establish the same design. This includes the sports jersey design groups, custom-made corrugated gift boxes, selected size-chart-only apparel, and mugs with visibly different forms.
- Unverified groups remain separate; colour grouping is never inferred from similar category names alone.

## Approved families

| Family code | Existing product IDs | Verified colours |
|---|---|---|
| MGC-FAM-001 | MGC-0124, MGC-0125, MGC-0126, MGC-0127 | Black, Blue, Red, White |
| MGC-FAM-002 | MGC-0261, MGC-0262 | Peach, Pink |
| MGC-FAM-003 | MGC-0272, MGC-0273 | Black, Brown |
| MGC-FAM-004 | MGC-0292, MGC-0293 | Black, Maroon |
| MGC-FAM-005 | MGC-0321, MGC-0322, MGC-0323 | Black, Blue, Brown |
| MGC-FAM-006 | MGC-0324, MGC-0325 | Black, Navy Blue |
| MGC-FAM-007 | MGC-0437, MGC-0438 | Blue, Grey |
| MGC-FAM-008 | MGC-0511, MGC-0512 | Grey, Navy Blue |
| MGC-FAM-009 | MGC-0515, MGC-0516 | Blue, Silver |
| MGC-FAM-010 | MGC-0769, MGC-0770 | Blue, Green |
| MGC-FAM-011 | MGC-0780, MGC-0781, MGC-0782 | Blue, Grey, Sky Blue |
| MGC-FAM-012 | MGC-0843, MGC-0844, MGC-0845 | Black, Blue, Red |
| MGC-FAM-013 | MGC-0917, MGC-0918, MGC-0919 | Black, Blue, Red |
| MGC-FAM-014 | MGC-0920, MGC-0921, MGC-0922 | Black, Blue, Green |
| MGC-FAM-015 | MGC-0966, MGC-0965 | Black, Navy Blue |
| MGC-FAM-016 | MGC-1057, MGC-1058 | Black, Blue |
| MGC-FAM-017 | MGC-1086, MGC-1087 | Black, Blue |
| MGC-FAM-018 | MGC-1097, MGC-1098 | Black, Blue |
| MGC-FAM-019 | MGC-1138, MGC-1139 | Black, Yellow |
| MGC-FAM-020 | MGC-1232, MGC-1233, MGC-1234 | Pink, Purple, Yellow |
| MGC-FAM-021 | MGC-1378, MGC-1379 | Black, Grey |
| MGC-FAM-022 | MGC-1470, MGC-1471 | Black, Blue |
| MGC-FAM-023 | MGC-1480, MGC-1481 | Blue, Red |
| MGC-FAM-024 | MGC-1484, MGC-1485, MGC-1486, MGC-1487, MGC-1488, MGC-1490, MGC-1491, MGC-1492 | Beige, Black, Blue, Grey, Maroon, Orange, Red, Yellow |
| MGC-FAM-025 | MGC-1574, MGC-1575 | Black, Tan |
| MGC-FAM-026 | MGC-1628, MGC-1629 | Brown, Green |
| MGC-FAM-027 | MGC-1726, MGC-1727, MGC-1728 | Black, Olive Green, Tan |
| MGC-FAM-028 | MGC-1774, MGC-1775, MGC-1776, MGC-1777 | Black, Blue, Grey, Wine |
| MGC-FAM-029 | MGC-2121, MGC-2122 | Black, Red |
| MGC-FAM-030 | MGC-2123, MGC-2124 | Maroon, Navy Blue |
| MGC-FAM-031 | MGC-2178, MGC-2179 | White, Yellow |
| MGC-FAM-032 | MGC-2555, MGC-2556 | Navy Blue, Royal Blue |
| MGC-FAM-033 | MGC-2930, MGC-2931 | Black, Navy Blue |
| MGC-FAM-034 | MGC-2948, MGC-2949 | Black, Navy Blue |
| MGC-FAM-035 | MGC-3989, MGC-3990 | Green, Maroon |
| MGC-FAM-036 | MGC-4123, MGC-4124 | Black, Brown |
| MGC-FAM-037 | MGC-0054, MGC-0055, MGC-0056 | Black, Red, Silver |
| MGC-FAM-038 | MGC-0203, MGC-0204 | Black, Blue |
| MGC-FAM-039 | MGC-0282, MGC-0283 | Black, Orange |
| MGC-FAM-040 | MGC-0340, MGC-0341, MGC-0342, MGC-0343 | Blue, Brown, Green, Red |
| MGC-FAM-041 | MGC-0457, MGC-0458, MGC-0459 | Beige, Black, Dark Brown |
| MGC-FAM-042 | MGC-0736, MGC-0737 | Brown, Natural Brown |
| MGC-FAM-043 | MGC-0749, MGC-0750, MGC-0751 | Black, Blue, Red |
| MGC-FAM-044 | MGC-0994, MGC-0995 | Black, Blue |
| MGC-FAM-045 | MGC-1000, MGC-1001 | Black, Silver |
| MGC-FAM-046 | MGC-1024, MGC-1027 | Black, White |
| MGC-FAM-047 | MGC-1308, MGC-1309 | Black, Blue |
| MGC-FAM-048 | MGC-1380, MGC-1381, MGC-1382 | Black, Brown, Olive Green |
| MGC-FAM-049 | MGC-1860, MGC-1861 | Black, Tan |
| MGC-FAM-050 | MGC-1864, MGC-1865, MGC-1866 | Black, Navy Blue, Olive Green |
| MGC-FAM-051 | MGC-1870, MGC-1871 | Black, Blue |
| MGC-FAM-052 | MGC-2207, MGC-2211 | Grey Melange, White |
| MGC-FAM-053 | MGC-2375, MGC-2376 | Black, Navy Blue |
| MGC-FAM-054 | MGC-2528, MGC-2529 | Black, Charcoal Grey |
| MGC-FAM-055 | MGC-2619, MGC-2620 | Black, Blue |
| MGC-FAM-056 | MGC-2797, MGC-2798 | Siemens Green, Teal Blue |
| MGC-FAM-057 | MGC-2966, MGC-2967, MGC-2968 | Black, Navy Blue, Red |
| MGC-FAM-058 | MGC-4140, MGC-4141 | Black, White |
| MGC-FAM-059 | MGC-4145, MGC-4146 | Black, White |
| MGC-FAM-060 | MGC-2092, MGC-2093, MGC-2094, MGC-2095, MGC-2096, MGC-2097 | Green, Grey, Navy Blue, Red, Royal Blue, White |
| MGC-FAM-061 | MGC-2112, MGC-2113, MGC-2114, MGC-2115, MGC-2116, MGC-2117, MGC-2118, MGC-2119 | Black, Charcoal Grey, Grey, Navy Blue, Purple, Sky Blue, Turquoise Green, White |


## New Polos & Tees families (MGC-FAM-062–158)

| Family code | Product IDs | Verified colours |
|---|---|---|
| MGC-FAM-062 | MGC-2087, MGC-2088, MGC-2089, MGC-2090, MGC-2091 | Black, Navy Blue, Royal Blue, Teal Blue, White |
| MGC-FAM-063 | MGC-2098, MGC-2099, MGC-2100, MGC-2101, MGC-2102, MGC-2103 | Black, Grey, Navy Blue, Royal Blue, White, Yellow |
| MGC-FAM-064 | MGC-2104, MGC-2105, MGC-2106, MGC-2107, MGC-2108, MGC-2109, MGC-2110, MGC-2111 | Black, Charcoal Grey, Grey, Navy Blue, Purple, Sky Blue, Turquoise Green, White |
| MGC-FAM-065 | MGC-2154, MGC-2155, MGC-2156, MGC-2157, MGC-2158, MGC-2159 | Black, Maroon, Navy Blue, Red, Royal Blue, White |
| MGC-FAM-066 | MGC-2160, MGC-2161, MGC-2162, MGC-2163 | Black, Navy Blue, Red, Royal Blue |
| MGC-FAM-067 | MGC-2133, MGC-2134 | Black, Royal Blue |
| MGC-FAM-068 | MGC-2139, MGC-2140, MGC-2141 | Black, Maroon, Red |
| MGC-FAM-069 | MGC-2142, MGC-2143, MGC-2145, MGC-2146, MGC-2147, MGC-2148 | Black, Dark Grey, Navy Blue, Royal Blue, White, Yellow |
| MGC-FAM-070 | MGC-2196, MGC-2197, MGC-2198, MGC-2199, MGC-2200, MGC-2201, MGC-2202, MGC-2203, MGC-2204 | Black, Dark Grey, Green, Maroon, Navy Blue, Red, Royal Blue, Sky Blue, White |
| MGC-FAM-071 | MGC-2214, MGC-2215, MGC-2216, MGC-2217 | Beige, Green, White, Yellow |
| MGC-FAM-072 | MGC-2164, MGC-2165, MGC-2169, MGC-2170 | Black, Charcoal Grey, Navy Blue, Red |
| MGC-FAM-073 | MGC-2205, MGC-2208, MGC-2209, MGC-2210 | Black, Maroon, Navy Melange, Red |
| MGC-FAM-074 | MGC-2219, MGC-2221, MGC-2222 | Grey Melange, Navy Blue, Red |
| MGC-FAM-075 | MGC-2224, MGC-2227, MGC-2231, MGC-2232 | Black, Green, White, Yellow |
| MGC-FAM-076 | MGC-2149, MGC-2150, MGC-2151, MGC-2152 | Black, Dark Grey, Grey Melange, Navy Melange |
| MGC-FAM-077 | MGC-2125, MGC-2126, MGC-2127, MGC-2128, MGC-2129, MGC-2130, MGC-2131 | Black, Dark Grey, Mustard, Red, Royal Blue, Sky Blue, White |
| MGC-FAM-078 | MGC-2187, MGC-2188, MGC-2189, MGC-2190, MGC-2191, MGC-2192, MGC-2193, MGC-2194, MGC-2195 | Black, Olive Green, Light Pink, Navy Blue, Red, Royal Blue, Teal Blue, White, Wine |
| MGC-FAM-079 | MGC-2264, MGC-2265, MGC-2266, MGC-2267 | Black, Maroon, Navy Blue, White |
| MGC-FAM-080 | MGC-2268, MGC-2269, MGC-2271, MGC-2272, MGC-2273, MGC-2274 | Black, Green, Maroon, Navy Blue, Red, Royal Blue |
| MGC-FAM-081 | MGC-2312, MGC-2314, MGC-2315, MGC-2317 | Ice Blue, Red, Royal Blue, Wine |
| MGC-FAM-082 | MGC-2286, MGC-2287 | Black, White |
| MGC-FAM-083 | MGC-2180, MGC-2181, MGC-2182, MGC-2183, MGC-2184, MGC-2185, MGC-2186 | Black, Ice Blue, Navy Blue, Red, Royal Blue, White, Yellow |
| MGC-FAM-084 | MGC-2318, MGC-2322 | Black, White |
| MGC-FAM-085 | MGC-2171, MGC-2173, MGC-2174, MGC-2175, MGC-2176, MGC-2177 | Black, Maroon, Navy Blue, Red, Royal Blue, Sky Blue |
| MGC-FAM-086 | MGC-2328, MGC-2329 | Grey, White |
| MGC-FAM-087 | MGC-2332, MGC-2333, MGC-2334, MGC-2335, MGC-2336 | Black, Green, Grey, Navy Blue, White |
| MGC-FAM-088 | MGC-2325, MGC-2326, MGC-2327 | Black, Grey, White |
| MGC-FAM-089 | MGC-2346, MGC-2347, MGC-2348 | Black, Navy Blue, White |
| MGC-FAM-090 | MGC-2349, MGC-2350, MGC-2351, MGC-2352, MGC-2353, MGC-2354 | Teal Blue, Black, Maroon, Red, Royal Blue, White |
| MGC-FAM-091 | MGC-2378, MGC-2379, MGC-2380, MGC-2381, MGC-2382 | Light blue, Light Grey, Light Pink, Purple, White |
| MGC-FAM-092 | MGC-2360, MGC-2361 | Black, Navy Blue |
| MGC-FAM-093 | MGC-2370, MGC-2371 | Black, White |
| MGC-FAM-094 | MGC-2355, MGC-2356 | Black, Navy Blue |
| MGC-FAM-095 | MGC-2358, MGC-2359 | Black, White |
| MGC-FAM-096 | MGC-2362, MGC-2363, MGC-2364, MGC-2365, MGC-2366 | Grey, Red, White, Black, Royal Blue |
| MGC-FAM-097 | MGC-2386, MGC-2388, MGC-2389, MGC-2390, MGC-2391, MGC-2392, MGC-2393, MGC-2394 | Black, Mustard, Navy Blue, Olive Green, Wine, Sky Blue, Purple, White |
| MGC-FAM-098 | MGC-2406, MGC-2407, MGC-2409, MGC-2410, MGC-2411 | Black, Grey Melange, Red, Royal Blue, Sky Blue |
| MGC-FAM-099 | MGC-2414, MGC-2415, MGC-2416 | Navy Blue, Sky Blue, White |
| MGC-FAM-100 | MGC-2417, MGC-2418, MGC-2419, MGC-2420 | Charcoal Grey, Maroon, Sky Blue, White |
| MGC-FAM-101 | MGC-2399, MGC-2400, MGC-2401, MGC-2402 | Black, Navy Blue, Red, White |
| MGC-FAM-102 | MGC-2403, MGC-2404, MGC-2405 | Maroon, Royal Blue, White |
| MGC-FAM-103 | MGC-2395, MGC-2396, MGC-2397, MGC-2398 | Charcoal Grey, Green Melange, Grey, White |
| MGC-FAM-104 | MGC-2424, MGC-2425, MGC-2426, MGC-2427, MGC-2428 | Black, Navy Blue, Sky Blue, Teal Blue, White |
| MGC-FAM-105 | MGC-2421, MGC-2422, MGC-2423 | Black, Charcoal Grey, Navy Blue |
| MGC-FAM-106 | MGC-2437, MGC-2438, MGC-2439, MGC-2440, MGC-2441, MGC-2442, MGC-2443, MGC-2444, MGC-2445 | Black, Blue, Mustard, Olive Green, Pink, Sky Blue, Wine, Purple, White |
| MGC-FAM-107 | MGC-2453, MGC-2454, MGC-2455, MGC-2456, MGC-2457, MGC-2458 | Black, Charcoal Grey, Grey Melange, Navy Blue, Royal Blue, White |
| MGC-FAM-108 | MGC-2446, MGC-2447, MGC-2448, MGC-2449, MGC-2450, MGC-2451, MGC-2452 | Black, Charcoal Grey, Grey, Navy Blue, Royal Blue, Teal Blue, White |
| MGC-FAM-109 | MGC-2693, MGC-2694, MGC-2695, MGC-2696, MGC-2697, MGC-2698, MGC-2699, MGC-2700, MGC-2701, MGC-2702, MGC-2704, MGC-2705, MGC-2706, MGC-2707, MGC-2708, MGC-2709 | Dark Grey, Ice Blue, Magenta, Maroon, Navy Blue, Olive Green, Red, Simens Green, Wine, Beige, Light Grey, Mustard, Orange, Peach, Royal Blue, Sky Blue |
| MGC-FAM-110 | MGC-2463, MGC-2464, MGC-2465 | Black, Navy Blue, White |
| MGC-FAM-111 | MGC-2459, MGC-2460 | Black, White |
| MGC-FAM-112 | MGC-2474, MGC-2475 | Black, Navy Blue |
| MGC-FAM-113 | MGC-2466, MGC-2467, MGC-2468, MGC-2469, MGC-2470 | Black, Green, Navy Blue, White, Wine |
| MGC-FAM-114 | MGC-2471, MGC-2472, MGC-2473 | Black, Light blue, White |
| MGC-FAM-115 | MGC-2484, MGC-2485, MGC-2486, MGC-2487, MGC-2488 | Black, Grey, Navy Blue, Red, White |
| MGC-FAM-116 | MGC-2489, MGC-2491, MGC-2492 | Black, Navy Blue, Red |
| MGC-FAM-117 | MGC-2481, MGC-2482, MGC-2483 | Black, Navy Blue, White |
| MGC-FAM-118 | MGC-2476, MGC-2477, MGC-2478, MGC-2479, MGC-2480 | Black, Navy Blue, Red, Royal Blue, White |
| MGC-FAM-119 | MGC-2518, MGC-2520, MGC-2521, MGC-2522 | Black, Royal Blue, Sky Blue, White |
| MGC-FAM-120 | MGC-2512, MGC-2513, MGC-2514, MGC-2515, MGC-2516, MGC-2517 | Black, Maroon, Olive Green, Simens Green, White, Teal Green |
| MGC-FAM-121 | MGC-2505, MGC-2506, MGC-2507, MGC-2508, MGC-2509, MGC-2510, MGC-2511 | Black, Dark Grey, Grey, Navy Blue, Royal Blue, Sky Blue, White |
| MGC-FAM-122 | MGC-2495, MGC-2496, MGC-2497, MGC-2498, MGC-2499 | Black, Navy Blue, Siemens Green, Teal Green, White |
| MGC-FAM-123 | MGC-2500, MGC-2502, MGC-2503, MGC-2504 | Black, Grey, Navy Blue, White |
| MGC-FAM-124 | MGC-2592, MGC-2593, MGC-2594, MGC-2595, MGC-2596, MGC-2597, MGC-2598, MGC-2599, MGC-2600, MGC-2601, MGC-2602 | Black, Dark Grey, Grey, Maroon, Navy Blue, Red, Royal Blue, Sky Blue, Teal Blue, White, Yellow |
| MGC-FAM-125 | MGC-2574, MGC-2575, MGC-2576, MGC-2577, MGC-2578, MGC-2579, MGC-2580, MGC-2581 | Black, Charcoal Grey, Grey Melange, Navy Blue, Red, Royal Blue, Teal Blue, White |
| MGC-FAM-126 | MGC-2603, MGC-2604, MGC-2605, MGC-2606, MGC-2607, MGC-2608, MGC-2609 | Teal Blue, Charcoal Grey, Grey, Navy Blue, Red, Royal Blue, White |
| MGC-FAM-127 | MGC-2611, MGC-2612, MGC-2613, MGC-2614, MGC-2615, MGC-2616, MGC-2617 | Black, Dark Grey, Grey Melange, Navy Blue, Red, Royal Blue, Teal Blue |
| MGC-FAM-128 | MGC-2583, MGC-2584 | White, Black |
| MGC-FAM-129 | MGC-2563, MGC-2564, MGC-2565, MGC-2567, MGC-2568, MGC-2569, MGC-2570, MGC-2571, MGC-2572, MGC-2573 | Black, Dark Grey, Grey Melange, Petrol Blue, Red, Red Melange, Royal Blue, Teal Blue, White, White Melange |
| MGC-FAM-130 | MGC-2621, MGC-2622, MGC-2623, MGC-2624, MGC-2626 | Teal Blue, Black, Dark Grey, Grey, Navy Blue |
| MGC-FAM-131 | MGC-2532, MGC-2533, MGC-2534 | Black, Pink, Sky Blue |
| MGC-FAM-132 | MGC-2557, MGC-2558, MGC-2559, MGC-2560 | Black, Maroon, Navy Blue, Royal Blue |
| MGC-FAM-133 | MGC-2684, MGC-2685, MGC-2686, MGC-2687, MGC-2688, MGC-2689 | Black, Dark Grey, Light blue, Pink, Purple, White |
| MGC-FAM-134 | MGC-2561, MGC-2562 | Green, Yellow |
| MGC-FAM-135 | MGC-2536, MGC-2537, MGC-2538, MGC-2539, MGC-2540, MGC-2541, MGC-2542, MGC-2544 | Black, Green, Maroon, Navy Blue, Pink, Red, Royal Blue, Yellow |
| MGC-FAM-136 | MGC-2628, MGC-2639, MGC-2643, MGC-2653 | Black, Grey Melange, Navy Blue, White |
| MGC-FAM-137 | MGC-2630, MGC-2636, MGC-2655 | Black, Cream, White |
| MGC-FAM-138 | MGC-2631, MGC-2656 | Black, White |
| MGC-FAM-139 | MGC-2633, MGC-2635, MGC-2637, MGC-2638, MGC-2641, MGC-2642, MGC-2644, MGC-2645, MGC-2646, MGC-2648, MGC-2649, MGC-2650, MGC-2651, MGC-2652 | Black, Charcoal Melange, Green Melange, Green, Lime Green, Maroon, Navy Blue, Purple, Red, Royal Blue, Sky Blue, Teal Blue, Teal Green, Turquoise Green |
| MGC-FAM-140 | MGC-2640, MGC-2647, MGC-2657 | Grey Melange, Royal Blue, Yellow |
| MGC-FAM-141 | MGC-2659, MGC-2680 | Black, White |
| MGC-FAM-142 | MGC-2661, MGC-2664, MGC-2681 | Black, Cream, White |
| MGC-FAM-143 | MGC-2667, MGC-2683 | Grey Melange, Yellow |
| MGC-FAM-144 | MGC-2530, MGC-2531 | Red, Royal Blue |
| MGC-FAM-145 | MGC-2545, MGC-2546, MGC-2547, MGC-2548, MGC-2549, MGC-2550, MGC-2551, MGC-2552, MGC-2553 | Black, Dark Grey, Grey Melange, Navy Blue, Navy Melange, Red, Red Melange, Royal Blue, White |
| MGC-FAM-146 | MGC-2712, MGC-2713, MGC-2715, MGC-2716, MGC-2717, MGC-2718, MGC-2719, MGC-2720, MGC-2721, MGC-2722, MGC-2723, MGC-2724, MGC-2725, MGC-2726, MGC-2727, MGC-2728, MGC-2729, MGC-2730 | Beige, Black, Green Melange, Ice Blue, Lavender, Light Grey, Magenta, Maroon, Mustard, Navy Blue, Peach, Purple, Red, Siemens Green, Teal Blue, Teal Green, White, Wine |
| MGC-FAM-147 | MGC-2690, MGC-2691 | White, Yellow |
| MGC-FAM-148 | MGC-2731, MGC-2732, MGC-2733, MGC-2735, MGC-2736, MGC-2737, MGC-2738, MGC-2739, MGC-2740 | Black, Charcoal Melange, Green, Navy Blue, Orange, Red, Royal Blue, White, Yellow |
| MGC-FAM-149 | MGC-2750, MGC-2752 | Black, White |
| MGC-FAM-150 | MGC-2741, MGC-2742, MGC-2743, MGC-2744, MGC-2745, MGC-2746, MGC-2747, MGC-2748 | Black, Grey Melange, Light blue, Navy Blue, Red, Sky Blue, Turquoise Green, White |
| MGC-FAM-151 | MGC-2774, MGC-2775 | Light blue, White |
| MGC-FAM-152 | MGC-2776, MGC-2777 | Grey, White |
| MGC-FAM-153 | MGC-2779, MGC-2780, MGC-2781 | Maroon, Yellow, Grey |
| MGC-FAM-154 | MGC-2796, MGC-2799 | Mustard, Yellow |
| MGC-FAM-155 | MGC-2783, MGC-2785, MGC-2786, MGC-2787, MGC-2788 | Black, Grey, Maroon, Royal Blue, Yellow |
| MGC-FAM-156 | MGC-2805, MGC-2806, MGC-2807, MGC-2808, MGC-2810, MGC-2811, MGC-2812, MGC-2813 | Black, Dark Grey, Grey Melange, Ice Blue, Maroon, Navy Blue, Olive Green, White |
| MGC-FAM-157 | MGC-2800, MGC-2801, MGC-2802, MGC-2803, MGC-2804 | Black, Grey, Navy Blue, Sky Blue, White |
| MGC-FAM-158 | MGC-2373, MGC-2374 | Wine, White |

## Routine review before adding another family

1. Run `npm run catalogue:colours:candidates` and open every image path for the proposed members.
2. Confirm the same item and design, matching name keywords, brand, category path, non-colour specifications, exact catalogue colours, and matching price/currency.
3. Exclude the family if any key differs, an image is missing/ambiguous, duplicate colours occur, or two same-colour SKUs show different designs.
4. Add the family to `src/data/catalogue/colourFamilies.json` with a new family ID/code and review flags; document any title exception with its product ID and evidence-based reason.
5. Run `npm run catalogue:colours:validate`, the focused catalogue tests, and `npm run build`; then inspect the card, quick view, and each colour option locally.
