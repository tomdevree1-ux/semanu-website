# Merkconfiguratie. Vervang kleuren, fonts, teksten en logo door die van de klant.
BRAND = {
    'name': 'Voorbeeld Tuinhout',
    'tagline': 'Tuinhuizen op maat',
    'title': 'Tuinhuis configurator',
    'vat': 0.21,
    'pricing': 'incl',          # 'incl' | 'excl' | 'quote'
    'logo': None,               # pad naar png of svg
    'style': {
        'primary': '#2F6B4F',   # hoofdkleur uit de huisstijl
        'accent': '#8FBF6E',    # tweede kleur
        'text': '#1B241F',
        'headingFont': 'Poppins',
        'bodyFont': 'Open Sans',
        # 'logoBg': '#2F6B4F',  # zet dit als het logo wit is
    },
    'landingTitle': 'Stel jouw tuinhuis samen',
    'landingText': 'Kies een model en stel het in 3D samen: afmeting, houtsoort, '
                   'wandbekleding, dakvorm, deur, ramen en overkapping. De prijs telt live mee.',
    'text': {
        'priceLabel': 'Prijs',
        'cartBtn': 'Toevoegen winkelmandje',
        'deliveryNote': 'levering en montage in overleg',
    },
    'tiles': [
        {'name': 'Tuinhuis', 'price': 2450, 'live': True},
        {'name': 'Blokhut', 'price': 3190},
        {'name': 'Overkapping', 'price': 1875},
        {'name': 'Garage', 'price': 5450},
    ],
    'watermark': 'SEMANU prototype 3D configurator',
}
