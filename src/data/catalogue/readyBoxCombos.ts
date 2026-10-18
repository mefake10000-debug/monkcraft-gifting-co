import { getProductById } from "@/data/catalogue/products";
import { getPackagingById } from "@/data/catalogue/packaging";
import type { BoxProductSnapshot, PackagingOption } from "@/data/catalogue/boxTypes";
import { formatPricing } from "@/lib/pricing";

export type ReadyBoxCombo = {
  id: string;
  name: string;
  occasion: string;
  description: string;
  products: BoxProductSnapshot[];
  productLabels: string[];
  packaging: PackagingOption;
  packagingLabel: string;
};

const comboSpecs = [
  {
    id: "welcome-essentials",
    name: "Welcome essentials",
    occasion: "Employee onboarding",
    description: "A useful first-day set for new team members.",
    productIds: ["MGC-0076", "MGC-0180", "MGC-0492"],
    productLabels: ["Parker Jotter pen", "Tree Free A5 diary", "Borosil 750 ml bottle"],
    packagingId: "MGC-3299",
    packagingLabel: "Black corrugated gift box",
  },
  {
    id: "recognition-moment",
    name: "Recognition moment",
    occasion: "Employee recognition",
    description: "A small thank-you with something to use and something to enjoy.",
    productIds: ["MGC-0190", "MGC-0728", "MGC-3223"],
    productLabels: ["Primo A5 notebook", "Turtle Tales 300 ml mug", "Ferrero Rocher chocolates"],
    packagingId: "MGC-3296",
    packagingLabel: "Navy corrugated gift box",
  },
  {
    id: "workday-favourites",
    name: "Workday favourites",
    occasion: "Team gifting",
    description: "Practical pieces for the desk and the daily coffee break.",
    productIds: ["MGC-4171", "MGC-1180", "MGC-0713"],
    productLabels: ["Fluct A5 notebook", "Ambrane mobile stand", "Turtle Tales 200 ml mug"],
    packagingId: "MGC-3297",
    packagingLabel: "Black corrugated gift box",
  },
] as const;

/** Only publish combinations whose exact catalogue records and photos exist. */
export function getReadyBoxCombos(): ReadyBoxCombo[] {
  return comboSpecs.flatMap((spec) => {
    const packaging = getPackagingById(spec.packagingId);
    const packagingProduct = getProductById(spec.packagingId);
    const records = spec.productIds.map((id) => getProductById(id));
    if (!packaging?.imageSrc || !packagingProduct?.images[0] || packagingProduct.availabilityStatus === "OUT" || records.some((product) => !product?.images[0] || product.availabilityStatus === "OUT")) {
      return [];
    }

    const products: BoxProductSnapshot[] = records.map((product) => {
      const item = product!;
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        imageSrc: item.images[0].src,
        priceLabel: formatPricing(item.pricing),
        amountInr: item.pricing.kind === "fixed" ? item.pricing.amountInr : undefined,
        categoryName: item.categoryName,
        minQuantity: item.minQuantity,
      };
    });

    return [{
      id: spec.id,
      name: spec.name,
      occasion: spec.occasion,
      description: spec.description,
      products,
      productLabels: [...spec.productLabels],
      packaging,
      packagingLabel: spec.packagingLabel,
    }];
  });
}
