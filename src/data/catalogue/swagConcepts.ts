export type SwagConcept = {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: string[];
  specNote: string;
  shape: "pen" | "bottle" | "tee" | "hoodie" | "apron" | "bag" | "box" | "magnet" | "mousepad" | "cap" | "notebook" | "backpack" | "mug" | "sleeve" | "lanyard";
  image: string;
  price: "";
};

const conceptNote = "Concept direction only — material, dimensions, print method and production details to be confirmed.";

/** Original Monkcraft swag concepts. These are visual ideas, not catalogue stock. */
export const SWAG_CONCEPTS: SwagConcept[] = [
  { id: "mark-up-pen", name: "The Big Idea Pen", category: "Desk energy", description: "For sharp notes, quick sketches and ideas worth keeping.", specs: ["Black or white body", "Clip or click style", "Ink option to confirm"], specNote: conceptNote, shape: "pen", image: "/marketing/swag-concepts/pen.png", price: "" },
  { id: "hydration-station", name: "Sip Happens Bottle", category: "Everyday carry", description: "A clean everyday bottle for commutes, desk days and team trips.", specs: ["Black or white finish", "Bottle capacity to confirm", "Lid and insulation to confirm"], specNote: conceptNote, shape: "bottle", image: "/marketing/swag-concepts/bottle.png", price: "" },
  { id: "team-tee", name: "The Team Tee", category: "Wear it", description: "An easy team uniform for events, launches and offsites.", specs: ["Black or white colourway", "Size range confirmed at brief", "Fit and fabric to confirm"], specNote: conceptNote, shape: "tee", image: "/marketing/swag-concepts/tee.png", price: "" },
  { id: "good-vibes-hoodie", name: "Off-Clock Hoodie", category: "Wear it", description: "A comfy layer for cool offices, travel days and cooler offsites.", specs: ["Black or white colourway", "Size range confirmed at brief", "Fit and fabric to confirm"], specNote: conceptNote, shape: "hoodie", image: "/marketing/swag-concepts/hoodie.png", price: "" },
  { id: "the-work-mode-apron", name: "The Maker Apron", category: "Made for the moment", description: "A practical extra for workshops, cafés and hands-on team days.", specs: ["Black or white body", "Pocket layout to confirm", "Fit and strap details to confirm"], specNote: conceptNote, shape: "apron", image: "/marketing/swag-concepts/apron.png", price: "" },
  { id: "carry-the-culture-tote", name: "The Carry-All Tote", category: "Everyday carry", description: "A reusable grab-and-go bag for work, events and everyday errands.", specs: ["Black or white body", "Handle length to confirm", "Fabric and capacity to confirm"], specNote: conceptNote, shape: "bag", image: "/marketing/swag-concepts/tote.png", price: "" },
  { id: "welcome-kit-box", name: "The First-Day Box", category: "Unbox the good stuff", description: "A neat welcome-kit starting point, sized around the gifts inside.", specs: ["Black or white outer look", "Box style to confirm", "Insert planned around selected gifts"], specNote: conceptNote, shape: "box", image: "/marketing/swag-concepts/gift-box.png", price: "" },
  { id: "desk-side-magnet", name: "The Desk Buddy Magnet", category: "Little extras", description: "A small, useful add-on for lockers, whiteboards or the fridge.", specs: ["Black or white face", "Shape and finish to confirm", "Magnet backing to confirm"], specNote: conceptNote, shape: "magnet", image: "/marketing/swag-concepts/fridge-magnet.png", price: "" },
  { id: "mousepad-main-character", name: "Main Character Desk Pad", category: "Desk energy", description: "Give the work zone a tidy, comfortable desk upgrade.", specs: ["Black or white base", "Desk-pad size to confirm", "Surface and edge finish to confirm"], specNote: conceptNote, shape: "mousepad", image: "/marketing/swag-concepts/mouse-pad.png", price: "" },
  { id: "off-duty-cap", name: "The Off-Duty Cap", category: "Wear it", description: "An easy team extra for event days, travel and after-hours plans.", specs: ["Black or white colourway", "Fit and closure to confirm", "Material to confirm"], specNote: conceptNote, shape: "cap", image: "/marketing/swag-concepts/cap.png", price: "" },
  { id: "plot-twist-notebook", name: "The Plot-Twist Notebook", category: "Desk energy", description: "A pocket for fresh plans, very good ideas and the odd plot twist.", specs: ["Black or white cover", "Page format to confirm", "Binding and paper to confirm"], specNote: conceptNote, shape: "notebook", image: "/marketing/swag-concepts/notebook.svg", price: "" },
  { id: "get-it-done-pack", name: "The Get-It-Done Pack", category: "Everyday carry", description: "A hands-free backpack concept for commutes, events and team travel.", specs: ["Black or white colourway", "Capacity and compartments to confirm", "Fit and fabric to confirm"], specNote: conceptNote, shape: "backpack", image: "/marketing/swag-concepts/backpack.svg", price: "" },
  { id: "meeting-fuel-mug", name: "The Meeting-Fuel Mug", category: "Everyday carry", description: "A desk-to-commute mug concept for the team's daily drink of choice.", specs: ["Black or white finish", "Capacity to confirm", "Lid and insulation to confirm"], specNote: conceptNote, shape: "mug", image: "/marketing/swag-concepts/travel-mug.svg", price: "" },
  { id: "laptop-plus-one", name: "Laptop's Plus-One Sleeve", category: "Everyday carry", description: "A simple protective sleeve concept for laptops on the move.", specs: ["Black or white finish", "Laptop size to confirm", "Lining and closure to confirm"], specNote: conceptNote, shape: "sleeve", image: "/marketing/swag-concepts/laptop-sleeve.svg", price: "" },
  { id: "badge-of-honour", name: "Badge of Honour Lanyard", category: "Little extras", description: "A useful event-day essential for teams, visitors and conference crews.", specs: ["Black or white strap", "Width and length to confirm", "Clip and safety breakaway to confirm"], specNote: conceptNote, shape: "lanyard", image: "/marketing/swag-concepts/lanyard.svg", price: "" },
];
