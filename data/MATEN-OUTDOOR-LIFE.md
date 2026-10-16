# Fabrieksmaten van Outdoor Life

`olp-maten.txt` bevat de specificaties van 49 artikelen, geschraapt van
outdoorlifeproducts.com. Die site zet de volledige specificatietabel gewoon als
HTML op de artikelpagina, dus er hoefde geen enkele PDF gelezen te worden.

## Zo is het opgehaald

De categorie Tuinverblijven telt 170 artikelen achter een zoekcomponent met
paginering in JavaScript, zestien per pagina. Doorklikken op Volgende en per
ronde de links naar `/nl/artikel/<nummer>/<slug>` oogsten levert de hele lijst.
Daarna per artikel de tabelrijen uitlezen. Koppelen aan de CEVO modellen gaat op
naam plus maat uit de slug, bijvoorbeeld `blokhut-amira-380x175-onbehandeld-vuren`.

35 van de 38 modellen kregen zo hun echte maten. De drie Douglas modellen staan
niet in deze categorie en missen nog.

## Wat de tabel oplevert per model

| Veld | Gebruikt voor |
|---|---|
| Hellingshoek dak | de werkelijke dakhelling, die per maat verschilt: Amira 380x175 is 8 graden, 380x230 is 6 |
| Binnenmaat hoogte | de wandhoogte, tussen 188,1 en 233,7 cm afhankelijk van het model |
| Binnenmaat vloeroppervlak | tegenover het grondvlak geeft dit **exact hoe groot de luifel is** |
| Deur 1 / Deuropening | breedte en hoogte, en daarmee of het een enkele of dubbele deur is |
| Raam 1 / Raamopening | het raamformaat; Timian heeft 82 x 24,4, een lange lage strook |
| aantal Raam-groepen | hoeveel ramen er zijn; Mila, Sara en Lotta hebben er nul |
| Buitenmaat overstek | de dakoverstekken per zijde |

## Waar dit mijn aannames onderuit haalde

De luifel schatte ik van de foto's en dat zat er systematisch naast, altijd te
klein. Octavio is 11 m2 binnen op een grondvlak van 25,8 m2, dus 57 procent is
overkapt terwijl ik 38 had staan. Jelle is 55 procent tegenover mijn 34. Maribel
58 tegenover 40. Op een foto in perspectief lijkt een open deel nu eenmaal
kleiner dan het is.

Verder bleek de dakhelling per maatvariant te verschillen, en niet elk model
heeft ramen. Dat had ik allemaal uniform staan.

## Bijwerken

```bash
cd data && python3 genjs.py && cat deel1.js deel2.js > ../products/cevo-tuinhuizen.js
cd .. && node data/test-prijzen.js && python3 build.py products/cevo-tuinhuizen.js brands/cevo.py --out dist/cevo-tuinhuizen.html
```
