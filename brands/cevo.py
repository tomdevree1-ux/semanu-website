# Merkconfiguratie CEVO (cevo.be)
#
# Kleuren en maten zijn afgelezen van de live Magento frontend, niet nagetekend
# van een screenshot. Het logo is gevectoriseerd uit het geanimeerde logo van
# de webshop, laatste frame, en staat als svg in brands/assets/.
#
#   navy   #004563  logo, koppen, donkere banden
#   oranje #ec660d  primaire knop, .action.primary op de shop
#   prijs  #f58508  de shop zet prijzen een tint helderder dan de knop
#   letter SourceSansPro, bij Google Fonts "Source Sans 3"
#   vorm   1px randen, hoekstraal 4 tot 5, geen zachte schaduwen

BRAND = {
    'name': 'CEVO',
    'tagline': 'De complete bouwmarkt',
    'title': 'Tuinhuis samenstellen | Cevo.be',
    'vat': 0.21,
    'pricing': 'incl',
    'logo': 'brands/assets/cevo-logo.svg',
    'logoOnly': True,               # het beeldmerk zegt zelf al cevo.be

    'style': {
        'primary': '#004563',       # navy draagt koppen en selecties
        'accent': '#748f9d',        # steel, de zachte kant van het palet
        'cta': '#ec660d',           # oranje is uitsluitend actie
        'price': '#f58508',         # prijsoranje, iets helderder dan de knop
        'text': '#333333',
        'headingFont': 'Source Sans 3',
        'bodyFont': 'Source Sans 3',

        'radius': 5,                # vlak, zoals de knoppen van de shop
        'labelCase': 'upper',       # sectiekoppen als SELECTIE VERFIJNEN
        'labelWeight': 600,
        'labelSize': '15px',

        'sky1': '#cfdadf', 'sky2': '#e6ecf0', 'sky3': '#f5f5f4',

        # de shop gebruikt een warm neutraal grijs, geen blauwzweem
        'tokens': {
            'ground': '#f5f5f4',
            'panel-2': '#f7f9fa',
            'line': '#e5e5e5',
            'muted': '#6b7a82',
            'accent-soft': '#e6ecf0',
            'shadow': '0 4px 14px rgba(0,69,99,.16)',
        },
    },

    'landingTitle': 'Stel je tuinhuis samen',
    'landingText': 'Beantwoord drie vragen en we tonen je alleen de tuinhuizen die erbij passen. '
                   'Daarna kies je de uitvoering en de kleur, en zie je het model in 3D.',
    'proto': 'Prototype, alles is nog volledig in te vullen naar wens.',
    'modalSub': 'Dit is een prototype. In de echte koppeling gaat deze samenstelling '
                'als configureerbaar product naar de winkelwagen van de webshop.',

    'text': {
        'priceLabel': 'Prijs',
        'cartBtn': 'In winkelwagen',
        'deliveryNote': 'levering en plaatsing in overleg',
    },

    'tiles': [
        {'name': 'Tuinhuis', 'price': 1848, 'live': True},
        {'name': 'Carport', 'price': 2290},
        {'name': 'Blokhut', 'price': 3190},
        {'name': 'Tuinberging', 'price': 1495},
    ],

    'watermark': 'SEMANU prototype 3D configurator voor CEVO',
}
