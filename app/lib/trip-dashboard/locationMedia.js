const locationMediaMappings = [
  {
    id: "subic-boardwalk",
    matches: ["subic bay boardwalk", "sunset walk near subic bay", "morning bay loop", "sunset viewpoint"],
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Subic_Bay_Boardwalk.jpg",
    alt: "Subic Bay Boardwalk waterfront in Olongapo",
    attribution: "Photo: RioHondo (Wikimedia Commons, CC BY-SA 3.0)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Subic_Bay_Boardwalk.jpg",
  },
  {
    id: "olongapo-city-hall",
    matches: ["olongapo city hall"],
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Olongapo_City_Hall,_Aug_2025.jpg",
    alt: "Olongapo City Hall facade",
    attribution: "Photo: Ralff Nestor Nacor (Wikimedia Commons, CC BY-SA 4.0)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Olongapo_City_Hall,_Aug_2025.jpg",
  },
  {
    id: "rizal-triangle",
    matches: ["rizal triangle"],
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/OlongapoCityTrianglejf718.JPG",
    alt: "Rizal Triangle area in Olongapo City",
    attribution: "Photo: Ramon FVelasquez (Wikimedia Commons, CC BY-SA 3.0)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:OlongapoCityTrianglejf718.JPG",
  },
  {
    id: "hotel-waterfront",
    matches: ["hotel check-in", "beachside lunch"],
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Acea_Subic_Bay.jpg",
    alt: "Hotel facade in the Subic Bay waterfront area",
    attribution: "Photo: Miariniel (Wikimedia Commons, CC BY-SA 4.0)",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Acea_Subic_Bay.jpg",
  },
  {
    id: "subic-bay-view",
    matches: ["airport transfer", "city center", "kalaklan", "local lunch and market stop"],
    imageUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Subic_Bay_from_Olongapo-Bugallon_Road,_Olongapo_City,_Aug_2025_(1).jpg",
    alt: "View of Subic Bay from Olongapo",
    attribution: "Photo: Ralff Nestor Nacor (Wikimedia Commons, CC BY-SA 4.0)",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Subic_Bay_from_Olongapo-Bugallon_Road,_Olongapo_City,_Aug_2025_(1).jpg",
  },
];

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getLocationMedia(name, district) {
  const haystack = `${normalize(name)} ${normalize(district)}`;

  const matched = locationMediaMappings.find((entry) =>
    entry.matches.some((needle) => haystack.includes(normalize(needle))),
  );

  return matched || null;
}

