# De twee tests

Beide draaien met node, zonder installatie, en geven exitcode 1 bij een fout.
Ze lezen `products/cevo-tuinhuizen.js` ten opzichte van de map waar je staat,
dus draai ze vanuit de map `engine` zelf.

```bash
node data/test-prijzen.js && node data/test-dak.js
```

## test-prijzen.js
Controleert het geld en de keuzelogica. Elke prijscombinatie van basis plus
toeslagen tegen de echte variantprijs, of elke combinatie een artikelnummer
heeft, of de vanafprijs op de resultaatkaart klopt, of elk model via de filters
bereikbaar is, en of de voorkeuze bij de drie aanbouwmodellen de juiste
uitvoering aanwijst.

## test-dak.js
Controleert de geometrie. Bouwt elk model in elke uitvoering na met een
namaakversie van Three.js, met deuren open en dicht, en vergelijkt van elk stuk
de bovenrand met de onderkant van het dakvlak op diezelfde plek. Wanden worden
op negen punten over hun lengte bemonsterd, want een schuine zijwand of een
topgevel heeft geen vaste hoogte.

De test hangt aan de generieke `box`, `wall`, `gableRoof` en `leanRoof`, dus hij
werkt ongewijzigd voor de andere producten in deze engine. Alleen de regel die
`products/cevo-tuinhuizen.js` inleest moet je dan aanpassen.
