from PIL import Image, ImageOps, ImageDraw, ImageFont
from pathlib import Path
import math

source=Path("screenshots/audit")
dest=Path("docs/qa")
dest.mkdir(parents=True,exist_ok=True)
pages=["home","world","local","technology","business","sports","science","videos",
       "search","saved","about","standards","privacy","sources","article",
       "search-results","saved-with-article","preferences-dialog","dark-home","mobile-menu"]
font_path="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
font=ImageFont.truetype(font_path,14)
title_font=ImageFont.truetype(font_path,21)
for label,short in [("android-390","android"),("windows-1440","windows")]:
    present=[p for p in pages if (source/f"{label}-{p}.jpg").is_file()]
    cols=3
    w,h=350,270
    rows=math.ceil(len(present)/cols)
    image=Image.new("RGB",(cols*w+24,rows*h+100),"#eef1f3")
    pen=ImageDraw.Draw(image)
    pen.text((20,15),f"GlobalNews | {short.title()} page review",fill="#152a3c",font=title_font)
    pen.text((20,49),"Live site capture — 2026-11-01 • full screenshots in Actions artifact",fill="#566676",font=font)
    for index,name in enumerate(present):
        path=source/f"{label}-{name}.jpg"
        try:
            with Image.open(path) as original:
                picture=original.convert("RGB")
                # An entire news feed may be tens of thousands of pixels tall.
                # Show the first editorial viewport at legible scale; full pages remain in the archive.
                crop_height=360 if short=="android" else 720
                picture=picture.crop((0,0,picture.width,min(picture.height,crop_height)))
                picture.thumbnail((w-22,h-52),Image.Resampling.LANCZOS)
                ix=index%cols
                iy=index//cols
                x=ix*w+22
                y=iy*h+87
                pen.rounded_rectangle((x-5,y-5,x+w-13,y+h-24),radius=4,fill="white",outline="#c5ced5",width=1)
                px=x+((w-22)-picture.width)//2
                image.paste(picture,(px,y))
                pen.text((x,y+h-48),name.replace("-"," ").title(),fill="#172c3c",font=font)
        except Exception as e:
            print("image failure",path,e)
    outfile=dest/f"globalnews-{short}-contact-sheet.jpg"
    image.save(outfile,"JPEG",quality=79,optimize=True)
    print(outfile, len(present), outfile.stat().st_size)
