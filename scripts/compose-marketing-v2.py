#!/usr/bin/env python3
"""V2 marketing boards — swag.com-style merchandising from genuine packshots.

Uses original product photos (white/studio backgrounds), not rembg cutouts.
Composites official Monkcraft logos only. No AI product invention.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
WW = ROOT / "public/videos/what-we-do/preprod/product-refs"
GB = ROOT / "public/videos/gifting-brief/preprod/product-refs"
CONCEPTS = ROOT / "public/brand/illustration-concepts/v2"
WWD = ROOT / "public/marketing/what-we-do"
DOCS = ROOT / "docs/image-overhaul/concepts-v2"

PURPLE = (102, 47, 144)
LILAC = (236, 228, 244)
MINT = (224, 238, 230)
BLUE = (226, 236, 245)
APRICOT = (248, 234, 220)
CREAM = (248, 245, 238)
ANTIFLASH = (241, 242, 242)
OLIVE = (63, 63, 55)
WHITE = (255, 255, 255)


def try_font(size: int) -> ImageFont.ImageFont:
    for c in (
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        try:
            return ImageFont.truetype(c, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.float32)
    for y in range(h):
        t = y / max(1, h - 1)
        t = t * t * (3 - 2 * t)
        arr[y] = (1 - t) * np.array(top, dtype=np.float32) + t * np.array(bottom, dtype=np.float32)
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


def accent_bar(canvas: Image.Image, height: int = 8) -> None:
    bar = Image.new("RGBA", (canvas.width, height), (*PURPLE, 255))
    canvas.alpha_composite(bar, (0, 0))


def logo_chip(width: int = 190) -> Image.Image:
    logo = load(ROOT / "public/brand/Monkcraft-Black-Horizontal.png")
    logo = ImageOps.contain(logo, (width, 56), Image.Resampling.LANCZOS)
    pad_x, pad_y = 18, 12
    chip = Image.new("RGBA", (logo.width + pad_x * 2, logo.height + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(chip)
    d.rounded_rectangle((0, 0, chip.width - 1, chip.height - 1), radius=16, fill=(255, 255, 255, 235))
    chip.alpha_composite(logo, (pad_x, pad_y))
    return chip


def product_tile(
    photo: Image.Image,
    tile_size: tuple[int, int],
    radius: int = 28,
    pad: float = 0.10,
) -> Image.Image:
    """White ecommerce tile with contained genuine packshot — swag.com clarity."""
    tw, th = tile_size
    tile = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.rounded_rectangle((0, 0, tw - 1, th - 1), radius=radius, fill=(255, 255, 255, 255))

    inner_w = int(tw * (1 - pad * 2))
    inner_h = int(th * (1 - pad * 2))
    fitted = ImageOps.contain(photo.convert("RGBA"), (inner_w, inner_h), Image.Resampling.LANCZOS)
    x = (tw - fitted.width) // 2
    y = (th - fitted.height) // 2
    tile.alpha_composite(fitted, (x, y))

    # Soft card shadow layer (drawn separately when pasting)
    return tile


def paste_card(canvas: Image.Image, card: Image.Image, xy: tuple[int, int], blur: int = 18) -> None:
    shadow = Image.new("RGBA", (card.width + 40, card.height + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((10, 14, card.width + 30, card.height + 34), radius=32, fill=(0, 0, 0, 45))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(shadow, (xy[0] - 10, xy[1] - 6))
    canvas.alpha_composite(card, xy)


def crop_bottle_packshot(im: Image.Image) -> Image.Image:
    """Remove circular base inset from dual-view bottle packshot."""
    w, h = im.size
    return im.crop((int(w * 0.05), int(h * 0.02), int(w * 0.55), int(h * 0.98)))


def brand_cap(cap: Image.Image) -> Image.Image:
    """Place official white logomark on blank cap front — real composite."""
    out = cap.copy().convert("RGBA")
    mark = load(ROOT / "public/brand/Monkcraft-White-Logomark.png")
    # Cap front approx center
    mark = ImageOps.contain(mark, (int(out.width * 0.28), int(out.height * 0.16)), Image.Resampling.LANCZOS)
    # Slight shadow under mark for embroidery feel
    mx = int(out.width * 0.36)
    my = int(out.height * 0.30)
    shadow = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    # darken mark slightly for fabric
    darkened = mark.copy()
    arr = np.array(darkened)
    # keep alpha; mute pure white a touch
    arr[..., 0] = (arr[..., 0] * 0.92).astype(np.uint8)
    arr[..., 1] = (arr[..., 1] * 0.92).astype(np.uint8)
    arr[..., 2] = (arr[..., 2] * 0.92).astype(np.uint8)
    darkened = Image.fromarray(arr, "RGBA")
    out.alpha_composite(darkened, (mx, my))
    return out


def save_jpg(im: Image.Image, path: Path, quality: int = 91) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = Image.new("RGB", im.size, WHITE)
    if im.mode == "RGBA":
        rgb.paste(im, mask=im.split()[-1])
    else:
        rgb.paste(im)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.03)
    rgb.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    print(f"wrote {path.relative_to(ROOT)} {rgb.size[0]}x{rgb.size[1]}")


# —— Concepts ——


def concept_01() -> Image.Image:
    """Corporate Gifting — curated kit tiles, gift-set hero, thoughtful merch."""
    W, H = 1600, 1200
    canvas = gradient((W, H), CREAM, LILAC)
    accent_bar(canvas)

    gift = load(GB / "MGC-3681_lavender-pause-gift-set.webp")
    bottle = crop_bottle_packshot(load(WW / "MGC-0550_bottle.webp"))
    journal = load(WW / "MGC-0061_journal.webp")
    notebook = load(GB / "MGC-0286_anokh-s80-notebook-black.webp")

    hero = product_tile(gift, (820, 820), radius=36, pad=0.04)
    paste_card(canvas, hero, (80, 160))

    paste_card(canvas, product_tile(bottle, (520, 520), radius=28, pad=0.12), (980, 140))
    paste_card(canvas, product_tile(journal, (250, 320), radius=22, pad=0.10), (980, 700))
    paste_card(canvas, product_tile(notebook, (250, 320), radius=22, pad=0.10), (1250, 700))

    # Caption strip
    d = ImageDraw.Draw(canvas)
    font = try_font(22)
    d.rounded_rectangle((80, 1020, 900, 1120), radius=20, fill=(255, 255, 255, 220))
    d.text((110, 1045), "Corporate gifting — curated kits with real Monkcraft catalogue products", fill=OLIVE, font=font)
    d.text((110, 1078), "Photography: genuine product assets · Logo: official brand file", fill=(120, 118, 110), font=try_font(16))

    canvas.alpha_composite(logo_chip(200), (40, 28))
    return canvas


def concept_02() -> Image.Image:
    """Gift Ideas category sample — distinct apparel + essentials grid."""
    W, H = 1200, 900
    canvas = gradient((W, H), MINT, ANTIFLASH)
    accent_bar(canvas)

    hoodie = load(WW / "MGC-2905_hoodie.webp")
    tote = load(WW / "MGC-1510_tote.webp")
    bottle = crop_bottle_packshot(load(WW / "MGC-0550_bottle.webp"))
    cap = brand_cap(load(WW / "MGC-2954_cap.webp"))

    paste_card(canvas, product_tile(hoodie, (420, 520), radius=28, pad=0.08), (70, 140))
    paste_card(canvas, product_tile(tote, (340, 420), radius=28, pad=0.08), (520, 120))
    paste_card(canvas, product_tile(bottle, (280, 360), radius=24, pad=0.12), (890, 140))
    paste_card(canvas, product_tile(cap, (340, 280), radius=24, pad=0.10), (520, 570))

    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((890, 540, 1130, 820), radius=24, fill=(*PURPLE, 255))
    d.text((920, 620), "Gift Ideas", fill=WHITE, font=try_font(26))
    d.text((920, 660), "Employee\nOnboarding\nsample", fill=(236, 220, 250), font=try_font(20))

    canvas.alpha_composite(logo_chip(170), (32, 24))
    return canvas


def concept_03() -> Image.Image:
    """Product-led merch — sparse commercial hero arrangement."""
    W, H = 1600, 1200
    canvas = gradient((W, H), (252, 252, 253), BLUE)
    accent_bar(canvas)

    # Prefer cleaner hard goods; backpack is genuine SKU but heavy third-party mark —
    # place smaller and lead with blankable / quieter products.
    bottle = crop_bottle_packshot(load(WW / "MGC-0550_bottle.webp"))
    earbuds = load(WW / "MGC-1000_earbuds.webp")
    cap = brand_cap(load(WW / "MGC-2954_cap.webp"))
    tote = load(WW / "MGC-1510_tote.webp")
    notebook = load(GB / "MGC-0286_anokh-s80-notebook-black.webp")

    # Centered bento
    paste_card(canvas, product_tile(tote, (520, 620), radius=32, pad=0.08), (540, 160))
    paste_card(canvas, product_tile(bottle, (360, 420), radius=28, pad=0.12), (120, 220))
    paste_card(canvas, product_tile(cap, (360, 300), radius=28, pad=0.10), (1120, 200))
    paste_card(canvas, product_tile(earbuds, (360, 300), radius=28, pad=0.10), (1120, 540))
    paste_card(canvas, product_tile(notebook, (360, 300), radius=28, pad=0.10), (120, 700))

    d = ImageDraw.Draw(canvas)
    d.text((540, 820), "Merchandise, clearly presented.", fill=OLIVE, font=try_font(28))
    d.text((540, 860), "Genuine catalogue photography · Monkcraft logo composite on blankable goods", fill=(110, 110, 105), font=try_font(18))

    canvas.alpha_composite(logo_chip(190), (40, 28))
    return canvas


def concept_04() -> Image.Image:
    """Gifting Brief — clean UI panel + genuine gift photography."""
    W, H = 1600, 900
    canvas = gradient((W, H), (246, 244, 240), (232, 236, 242))
    accent_bar(canvas)

    # Desk band
    d = ImageDraw.Draw(canvas)
    d.rectangle((0, 520, W, H), fill=(210, 196, 176, 255))

    panel_w, panel_h = 600, 620
    panel = Image.new("RGBA", (panel_w, panel_h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle((0, 0, panel_w - 1, panel_h - 1), radius=28, fill=(255, 255, 255, 250))
    pd.rectangle((0, 0, panel_w, 68), fill=(*PURPLE, 255))
    # round top of purple
    pd.rounded_rectangle((0, 0, panel_w - 1, 68), radius=28, fill=(*PURPLE, 255))
    pd.rectangle((0, 34, panel_w, 68), fill=(*PURPLE, 255))

    logo_w = ImageOps.contain(load(ROOT / "public/brand/Monkcraft-White-Horizontal.png"), (210, 48), Image.Resampling.LANCZOS)
    panel.alpha_composite(logo_w, (24, 14))

    font_h, font_b, font_s = try_font(30), try_font(20), try_font(16)
    pd.text((28, 92), "My Gifting Brief", fill=OLIVE, font=font_h)
    pd.text((28, 132), "Selections stay in this browser until you send.", fill=(120, 118, 110), font=font_s)

    rows = [
        ("Shortlisted products", "4 items"),
        ("Occasion", "Employee onboarding"),
        ("Quantity", "150"),
        ("Budget / unit", "Confirm with Monkcraft"),
        ("Packaging", "Pending confirmation"),
    ]
    y = 180
    for label, value in rows:
        pd.rounded_rectangle((24, y, panel_w - 24, y + 52), radius=14, fill=(246, 244, 248, 255))
        pd.text((40, y + 16), label, fill=(90, 90, 85), font=font_s)
        vw = pd.textlength(value, font=font_b)
        pd.text((panel_w - 40 - vw, y + 14), value, fill=PURPLE, font=font_b)
        y += 60

    pd.rounded_rectangle((24, panel_h - 84, panel_w - 24, panel_h - 28), radius=18, fill=(*PURPLE, 255))
    cta = "Prepare quotation brief"
    pd.text(((panel_w - pd.textlength(cta, font=font_b)) / 2, panel_h - 66), cta, fill=WHITE, font=font_b)

    canvas.alpha_composite(panel, (70, 100))

    gift = load(GB / "MGC-3681_lavender-pause-gift-set.webp")
    bottle = crop_bottle_packshot(load(WW / "MGC-0550_bottle.webp"))
    paste_card(canvas, product_tile(gift, (720, 680), radius=32, pad=0.03), (780, 90))
    paste_card(canvas, product_tile(bottle, (220, 260), radius=20, pad=0.10), (1320, 560))

    return canvas


# —— What We Do Batch A ——


def wwd_corporate() -> Image.Image:
    return concept_01()


def wwd_custom() -> Image.Image:
    W, H = 1200, 900
    canvas = gradient((W, H), MINT, (238, 242, 240))
    accent_bar(canvas)
    hoodie = load(WW / "MGC-2905_hoodie.webp")
    cap = brand_cap(load(WW / "MGC-2954_cap.webp"))
    tote = load(WW / "MGC-1510_tote.webp")
    paste_card(canvas, product_tile(hoodie, (480, 580), radius=28, pad=0.07), (60, 140))
    paste_card(canvas, product_tile(tote, (360, 420), radius=28, pad=0.08), (580, 120))
    paste_card(canvas, product_tile(cap, (360, 300), radius=24, pad=0.10), (580, 560))
    canvas.alpha_composite(logo_chip(160), (28, 22))
    return canvas


def wwd_kits() -> Image.Image:
    W, H = 1200, 900
    canvas = gradient((W, H), BLUE, ANTIFLASH)
    accent_bar(canvas)
    gift = load(GB / "MGC-3681_lavender-pause-gift-set.webp")
    bottle = crop_bottle_packshot(load(WW / "MGC-0550_bottle.webp"))
    notebook = load(GB / "MGC-0286_anokh-s80-notebook-black.webp")
    paste_card(canvas, product_tile(gift, (680, 680), radius=32, pad=0.03), (60, 110))
    paste_card(canvas, product_tile(bottle, (340, 400), radius=24, pad=0.12), (780, 120))
    paste_card(canvas, product_tile(notebook, (340, 300), radius=22, pad=0.10), (780, 550))
    canvas.alpha_composite(logo_chip(160), (28, 22))
    return canvas


def wwd_stores() -> Image.Image:
    W, H = 1600, 1000
    canvas = gradient((W, H), APRICOT, CREAM)
    accent_bar(canvas)
    hoodie = load(WW / "MGC-2905_hoodie.webp")
    tote = load(WW / "MGC-1510_tote.webp")
    bottle = crop_bottle_packshot(load(WW / "MGC-0550_bottle.webp"))
    cap = brand_cap(load(WW / "MGC-2954_cap.webp"))
    # Shelf of equal product tiles — storefront clarity
    tiles = [
        (hoodie, (320, 400), (80, 200)),
        (tote, (320, 400), (440, 200)),
        (bottle, (320, 400), (800, 200)),
        (cap, (320, 400), (1160, 200)),
    ]
    for photo, size, xy in tiles:
        paste_card(canvas, product_tile(photo, size, radius=26, pad=0.10), xy)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((80, 680, 1520, 760), radius=18, fill=(255, 255, 255, 220))
    d.text((110, 708), "Company Store — curated merch, clearly presented for your team", fill=OLIVE, font=try_font(24))
    canvas.alpha_composite(logo_chip(180), (36, 24))
    return canvas


def contact_sheet(paths: list[Path]) -> Image.Image:
    thumbs, labels = [], []
    for p in paths:
        im = Image.open(p).convert("RGB")
        thumbs.append(ImageOps.contain(im, (560, 400), Image.Resampling.LANCZOS))
        labels.append(p.name.replace("-V2-FOR-REVIEW.jpg", ""))
    pad, gap = 36, 24
    cell_w, cell_h = 560, 440
    W = pad * 2 + 2 * cell_w + gap
    H = pad * 2 + 2 * cell_h + gap + 80
    sheet = Image.new("RGB", (W, H), ANTIFLASH)
    d = ImageDraw.Draw(sheet)
    d.text((pad, 28), "Monkcraft concepts V2 — FOR REVIEW · genuine product photography tiles", fill=OLIVE, font=try_font(26))
    for i, (th, label) in enumerate(zip(thumbs, labels)):
        r, c = divmod(i, 2)
        x = pad + c * (cell_w + gap)
        y = pad + 70 + r * (cell_h + gap)
        d.rounded_rectangle((x - 4, y - 4, x + cell_w + 4, y + cell_h - 24), radius=14, fill=WHITE)
        sheet.paste(th, (x + (cell_w - th.width) // 2, y + 8))
        d.text((x + 8, y + cell_h - 36), label, fill=PURPLE, font=try_font(16))
    return sheet.convert("RGBA")


def main() -> None:
    CONCEPTS.mkdir(parents=True, exist_ok=True)
    WWD.mkdir(parents=True, exist_ok=True)
    DOCS.mkdir(parents=True, exist_ok=True)

    outs = [
        (concept_01(), CONCEPTS / "concept-01-corporate-gifting-V2-FOR-REVIEW.jpg"),
        (concept_02(), CONCEPTS / "concept-02-gift-ideas-category-V2-FOR-REVIEW.jpg"),
        (concept_03(), CONCEPTS / "concept-03-product-led-merch-V2-FOR-REVIEW.jpg"),
        (concept_04(), CONCEPTS / "concept-04-gifting-brief-story-V2-FOR-REVIEW.jpg"),
    ]
    paths = []
    for im, path in outs:
        save_jpg(im, path)
        save_jpg(im, DOCS / path.name, quality=88)
        paths.append(path)

    sheet = contact_sheet(paths)
    save_jpg(sheet, CONCEPTS / "contact-sheet-v2.jpg", quality=88)
    save_jpg(sheet, DOCS / "contact-sheet-v2.jpg", quality=88)

    save_jpg(wwd_corporate(), WWD / "corporate-gifting-v2.jpg")
    save_jpg(wwd_custom(), WWD / "custom-merchandise-v2.jpg")
    save_jpg(wwd_kits(), WWD / "kits-fulfilment-v2.jpg")
    save_jpg(wwd_stores(), WWD / "company-stores-v2.jpg")


if __name__ == "__main__":
    main()
