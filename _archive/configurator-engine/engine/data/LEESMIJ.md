# Herkomst van de CEVO data

`cevo-outdoor-life-tuinhuizen-varianten.csv`  308 bestelbare varianten met sku,
kleur, uitvoering en prijs, opgehaald uit de Magento frontend van cevo.be.
`cevo-outdoor-life-tuinhuizen-modellen.csv`   38 modellen samengevat.
`varianten.txt`   de ruwe regels zoals ze uit de webshop kwamen.
`genjs.py`        maakt `modellen.json` en `deel1.js` uit die regels.
`deel1.sjabloon.js` + `deel2.js`  samen `products/cevo-tuinhuizen.js`.
`test-prijzen.js` controleert dat basis plus toeslagen exact de echte
                  variantprijs geeft, dat elke combinatie een sku heeft en dat
                  geen model een ongeldige geometrie oplevert.

```bash
cd data && python3 genjs.py && cat deel1.js deel2.js > ../products/cevo-tuinhuizen.js
cd .. && node data/test-prijzen.js && python3 build.py products/cevo-tuinhuizen.js brands/cevo.py --out dist/cevo-tuinhuizen.html
```

Let op: dakvorm, luifel, ramen en deurtype staan niet in de data van CEVO. Die
zijn van de productfoto's afgelezen en zitten in de tabel `FOTO` boven in
`genjs.py`. Levert Outdoor Life echte gegevens, vervang dan die tabel.
