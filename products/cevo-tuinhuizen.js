/* =====================================================================
   Productlaag: CEVO Outdoor Life tuinhuizen
   38 modellen, 308 bestelbare varianten.

   Wat uit de webshop van CEVO komt en dus klopt:
     modelnaam, parent sku, sku per variant, kleur, uitvoering, prijs,
     en de fundamentmaat waar die in de omschrijving of de naam stond.

   Wat een interpretatie is, afgelezen van de productfoto's:
     dakvorm, luifel ja of nee, de diepte van de luifel, het aantal
     ramen en het deurtype. CEVO voert die vier niet als attribuut, dus
     het 3D model is een weergave op basis van maten en foto's en geen
     tekening van de fabrikant. Zeg dat er bij een klant ook bij.
   ===================================================================== */

const MODELLEN = [
  {"id":"mila","naam":"Mila","sku":"CP_160536","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1268.0,"tot":2308.0,"oppMin":5.0,"oppMax":6.25,"breedteMin":2.5,"breedteMax":2.5,"uitvoeringen":[{"id":"250x200cm","key":"250x200cm","naam":"250x200cm","W":2.5,"L":2.0,"olp":"1060154","muur":1.995,"deur":[1.494,1.85],"ramen":0},{"id":"250x250cm","key":"250x250cm","naam":"250x250cm","W":2.5,"L":2.5,"olp":"1060155","muur":1.995,"deur":[1.494,1.85],"ramen":0}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"250x250cm|Carbon grijs":2308.0,"250x250cm|Carbon grijs-wit":2308.0,"250x250cm|Platinum grijs":2308.0,"250x250cm|Platinum grijs-wit":2308.0,"250x250cm|Blank hout":1352.0,"250x250cm|Groen grijs":2308.0,"250x250cm|Groen grijs-wit":2308.0,"250x200cm|Carbon grijs":2128.0,"250x200cm|Carbon grijs-wit":2128.0,"250x200cm|Platinum grijs":2128.0,"250x200cm|Platinum grijs-wit":2128.0,"250x200cm|Blank hout":1268.0,"250x200cm|Groen grijs":2128.0,"250x200cm|Groen grijs-wit":2128.0},"sku_var":{"250x250cm|Carbon grijs":"160545","250x250cm|Carbon grijs-wit":"160544","250x250cm|Platinum grijs":"160543","250x250cm|Platinum grijs-wit":"160542","250x250cm|Blank hout":"160541","250x200cm|Carbon grijs":"160540","250x200cm|Carbon grijs-wit":"160539","250x200cm|Platinum grijs":"160538","250x200cm|Platinum grijs-wit":"160537","250x200cm|Blank hout":"160536","250x250cm|Groen grijs":"164588","250x250cm|Groen grijs-wit":"164587","250x200cm|Groen grijs":"164586","250x200cm|Groen grijs-wit":"164585"}},
  {"id":"sara","naam":"Sara","sku":"CP_160526","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1176.0,"tot":2132.0,"oppMin":4.0,"oppMax":5.0,"breedteMin":2.0,"breedteMax":2.5,"uitvoeringen":[{"id":"200x200cm","key":"200x200cm","naam":"200x200cm","W":2.0,"L":2.0,"olp":"1060156","muur":1.995,"deur":[1.494,1.85],"ramen":0},{"id":"200x250cm","key":"200x250cm","naam":"200x250cm","W":2.0,"L":2.5,"olp":"1060157","muur":1.995,"deur":[1.494,1.85],"ramen":0}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"200x250cm|Carbon grijs":2132.0,"200x250cm|Carbon grijs-wit":2132.0,"200x250cm|Platinum grijs":2132.0,"200x250cm|Platinum grijs-wit":2132.0,"200x250cm|Blank hout":1268.0,"200x250cm|Groen grijs":2132.0,"200x250cm|Groen grijs-wit":2132.0,"200x200cm|Carbon grijs":1956.0,"200x200cm|Carbon grijs-wit":1956.0,"200x200cm|Platinum grijs":1956.0,"200x200cm|Platinum grijs-wit":1956.0,"200x200cm|Blank hout":1176.0,"200x200cm|Groen grijs":1956.0,"200x200cm|Groen grijs-wit":1956.0},"sku_var":{"200x250cm|Carbon grijs":"160535","200x250cm|Carbon grijs-wit":"160534","200x250cm|Platinum grijs":"160533","200x250cm|Platinum grijs-wit":"160532","200x250cm|Blank hout":"160531","200x200cm|Carbon grijs":"160530","200x200cm|Carbon grijs-wit":"160529","200x200cm|Platinum grijs":"160528","200x200cm|Platinum grijs-wit":"160527","200x200cm|Blank hout":"160526","200x250cm|Groen grijs":"164584","200x250cm|Groen grijs-wit":"164583","200x200cm|Groen grijs":"164582","200x200cm|Groen grijs-wit":"164581"}},
  {"id":"kibo","naam":"Kibo","sku":"CP_160511","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1400.0,"tot":2720.0,"oppMin":4.0,"oppMax":6.25,"breedteMin":2.0,"breedteMax":2.5,"uitvoeringen":[{"id":"200x200cm","key":"200x200cm","naam":"200x200cm","W":2.0,"L":2.0,"olp":"1046084","helling":7.0,"muur":2.223,"deur":[1.494,1.85],"ramen":0},{"id":"200x250cm","key":"200x250cm","naam":"200x250cm","W":2.0,"L":2.5,"olp":"1046085","helling":7.0,"muur":2.223,"deur":[1.494,1.85],"ramen":0},{"id":"250x250cm","key":"250x250cm","naam":"250x250cm","W":2.5,"L":2.5,"olp":"1046087","helling":7.0,"muur":2.223,"deur":[1.494,1.85],"ramen":0}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"250x250cm|Carbon grijs":2720.0,"250x250cm|Carbon grijs-wit":2720.0,"250x250cm|Platinum grijs":2720.0,"250x250cm|Platinum grijs-wit":2720.0,"250x250cm|Blank hout":1612.0,"250x250cm|Groen grijs":2720.0,"250x250cm|Groen grijs-wit":2720.0,"200x250cm|Carbon grijs":2508.0,"200x250cm|Carbon grijs-wit":2508.0,"200x250cm|Platinum grijs":2508.0,"200x250cm|Platinum grijs-wit":2508.0,"200x250cm|Blank hout":1488.0,"200x250cm|Groen grijs":2508.0,"200x250cm|Groen grijs-wit":2508.0,"200x200cm|Carbon grijs":2304.0,"200x200cm|Carbon grijs-wit":2304.0,"200x200cm|Platinum grijs":2304.0,"200x200cm|Platinum grijs-wit":2304.0,"200x200cm|Blank hout":1400.0,"200x200cm|Groen grijs":2304.0,"200x200cm|Groen grijs-wit":2304.0},"sku_var":{"250x250cm|Carbon grijs":"160525","250x250cm|Carbon grijs-wit":"160524","250x250cm|Platinum grijs":"160523","250x250cm|Platinum grijs-wit":"160522","250x250cm|Blank hout":"160521","200x250cm|Carbon grijs":"160520","200x250cm|Carbon grijs-wit":"160519","200x250cm|Platinum grijs":"160518","200x250cm|Platinum grijs-wit":"160517","200x250cm|Blank hout":"160516","200x200cm|Carbon grijs":"160515","200x200cm|Carbon grijs-wit":"160514","200x200cm|Platinum grijs":"160513","200x200cm|Platinum grijs-wit":"160512","200x200cm|Blank hout":"160511","250x250cm|Groen grijs":"164580","250x250cm|Groen grijs-wit":"164579","200x250cm|Groen grijs":"164578","200x250cm|Groen grijs-wit":"164577","200x200cm|Groen grijs":"164576","200x200cm|Groen grijs-wit":"164575"}},
  {"id":"norah","naam":"Norah","sku":"CP_160456","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1496.0,"tot":3096.0,"oppMin":6.32,"oppMax":10.45,"breedteMin":2.75,"breedteMax":3.8,"uitvoeringen":[{"id":"275x230cm","key":"275X230CM","naam":"275X230CM","W":2.75,"L":2.3,"olp":"1009524","muur":1.938,"deur":[1.418,1.794],"ramen":1},{"id":"275x275cm","key":"275X275CM","naam":"275X275CM","W":2.75,"L":2.75,"olp":"1009525","muur":1.938,"deur":[1.418,1.794],"ramen":1},{"id":"275x380cm","key":"275X380CM","naam":"275X380CM","W":2.75,"L":3.8,"olp":"1041175","muur":1.938,"deur":[1.418,1.794],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"275X380CM|Platinum grijs-wit":3096.0,"275X380CM|Carbon grijs-wit":3096.0,"275X380CM|Olijfgroen geimpegneerd":2196.0,"275X380CM|Blank hout":1884.0,"275X380CM|Groen grijs-wit":3096.0,"275X275CM|Platinum grijs-wit":2592.0,"275X275CM|Carbon grijs-wit":2592.0,"275X275CM|Olijfgroen geimpegneerd":1848.0,"275X275CM|Blank hout":1584.0,"275X275CM|Groen grijs-wit":2592.0,"275X230CM|Platinum grijs-wit":2440.0,"275X230CM|Carbon grijs-wit":2440.0,"275X230CM|Olijfgroen geimpegneerd":1760.0,"275X230CM|Blank hout":1496.0,"275X230CM|Groen grijs-wit":2440.0},"sku_var":{"275X380CM|Platinum grijs-wit":"160467","275X380CM|Carbon grijs-wit":"160466","275X380CM|Olijfgroen geimpegneerd":"160465","275X380CM|Blank hout":"160464","275X275CM|Platinum grijs-wit":"160463","275X275CM|Carbon grijs-wit":"160462","275X275CM|Olijfgroen geimpegneerd":"160461","275X275CM|Blank hout":"160460","275X230CM|Platinum grijs-wit":"160459","275X230CM|Carbon grijs-wit":"160458","275X230CM|Olijfgroen geimpegneerd":"160457","275X230CM|Blank hout":"160456","275X380CM|Groen grijs-wit":"164537","275X275CM|Groen grijs-wit":"164536","275X230CM|Groen grijs-wit":"164535"}},
  {"id":"ingo","naam":"Ingo","sku":"CP_160403","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1184.0,"tot":2136.0,"oppMin":4.02,"oppMax":5.29,"breedteMin":2.3,"breedteMax":2.3,"uitvoeringen":[{"id":"230x175cm","key":"230x175cm","naam":"230x175cm","W":2.3,"L":1.75,"olp":"1009515","muur":1.938,"deur":[1.418,1.794],"ramen":1},{"id":"230x230cm","key":"230x230cm","naam":"230x230cm","W":2.3,"L":2.3,"olp":"1009516","muur":1.938,"deur":[1.418,1.794],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"230x230cm|Platinum grijs-wit":2136.0,"230x230cm|Carbon grijs-wit":2136.0,"230x230cm|Olijfgroen geimpegneerd":1584.0,"230x230cm|Blank hout":1320.0,"230x230cm|Groen grijs-wit":2136.0,"230x175cm|Platinum grijs-wit":1956.0,"230x175cm|Carbon grijs-wit":1956.0,"230x175cm|Olijfgroen geimpegneerd":1448.0,"230x175cm|Blank hout":1184.0,"230x175cm|Groen grijs-wit":1956.0},"sku_var":{"230x230cm|Platinum grijs-wit":"160410","230x230cm|Carbon grijs-wit":"160409","230x230cm|Olijfgroen geimpegneerd":"160408","230x230cm|Blank hout":"160407","230x175cm|Platinum grijs-wit":"160406","230x175cm|Carbon grijs-wit":"160405","230x175cm|Olijfgroen geimpegneerd":"160404","230x175cm|Blank hout":"160403","230x230cm|Groen grijs-wit":"164534","230x175cm|Groen grijs-wit":"164533"}},
  {"id":"indi","naam":"Indi","sku":"CP_160395","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1188.0,"tot":2176.0,"oppMin":4.02,"oppMax":5.29,"breedteMin":2.3,"breedteMax":2.3,"uitvoeringen":[{"id":"230x175cm","key":"230x175cm","naam":"230x175cm","W":2.3,"L":1.75,"olp":"1009518","helling":8.0,"muur":1.881,"deur":[1.418,1.794],"ramen":1},{"id":"230x230cm","key":"230x230cm","naam":"230x230cm","W":2.3,"L":2.3,"olp":"1009519","helling":6.0,"muur":1.881,"deur":[1.418,1.792],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"230x230cm|Platinum grijs-wit":2176.0,"230x230cm|Carbon grijs-wit":2176.0,"230x230cm|Olijfgroen geimpegneerd":1536.0,"230x230cm|Blank hout":1272.0,"230x230cm|Groen grijs-wit":2176.0,"230x175cm|Platinum grijs-wit":1972.0,"230x175cm|Carbon grijs-wit":1972.0,"230x175cm|Olijfgroen geimpegneerd":1448.0,"230x175cm|Blank hout":1188.0,"230x175cm|Groen grijs-wit":1972.0},"sku_var":{"230x230cm|Platinum grijs-wit":"160402","230x230cm|Carbon grijs-wit":"160401","230x230cm|Olijfgroen geimpegneerd":"160400","230x230cm|Blank hout":"160399","230x175cm|Platinum grijs-wit":"160398","230x175cm|Carbon grijs-wit":"160397","230x175cm|Olijfgroen geimpegneerd":"160396","230x175cm|Blank hout":"160395","230x230cm|Groen grijs-wit":"164542","230x175cm|Groen grijs-wit":"164541"}},
  {"id":"amira","naam":"Amira","sku":"CP_160365","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1668.0,"tot":3088.0,"oppMin":6.65,"oppMax":10.45,"breedteMin":3.8,"breedteMax":3.8,"uitvoeringen":[{"id":"380x175cm","key":"380x175cm","naam":"380x175cm","W":3.8,"L":1.75,"olp":"1041181","helling":8.0,"muur":1.881,"deur":[1.418,1.794],"raam":[0.585,0.782],"ramen":1},{"id":"380x230cm","key":"380x230cm","naam":"380x230cm","W":3.8,"L":2.3,"olp":"1009512","helling":6.0,"muur":1.881,"deur":[1.418,1.794],"raam":[0.585,0.782],"ramen":1},{"id":"380x275cm","key":"380x275cm","naam":"380x275cm","W":3.8,"L":2.75,"olp":"1009513","helling":6.0,"muur":1.881,"deur":[1.418,1.792],"raam":[0.585,0.782],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"380x275cm|Platinum grijs-wit":3088.0,"380x275cm|Carbon grijs-wit":3088.0,"380x275cm|Olijfgroen geimpegneerd":2148.0,"380x275cm|Blank hout":1848.0,"380x275cm|Groen grijs-wit":3088.0,"380x230cm|Platinum grijs-wit":2936.0,"380x230cm|Carbon grijs-wit":2936.0,"380x230cm|Olijfgroen geimpegneerd":2064.0,"380x230cm|Blank hout":1760.0,"380x230cm|Groen grijs-wit":2936.0,"380x175cm|Platinum grijs-wit":2764.0,"380x175cm|Carbon grijs-wit":2764.0,"380x175cm|Olijfgroen geimpegneerd":1976.0,"380x175cm|Blank hout":1668.0,"380x175cm|Groen grijs-wit":2764.0},"sku_var":{"380x275cm|Platinum grijs-wit":"160376","380x275cm|Carbon grijs-wit":"160375","380x275cm|Olijfgroen geimpegneerd":"160374","380x275cm|Blank hout":"160373","380x230cm|Platinum grijs-wit":"160372","380x230cm|Carbon grijs-wit":"160371","380x230cm|Olijfgroen geimpegneerd":"160370","380x230cm|Blank hout":"160369","380x175cm|Platinum grijs-wit":"160368","380x175cm|Carbon grijs-wit":"160367","380x175cm|Olijfgroen geimpegneerd":"160366","380x175cm|Blank hout":"160365","380x275cm|Groen grijs-wit":"164548","380x230cm|Groen grijs-wit":"164547","380x175cm|Groen grijs-wit":"164546"}},
  {"id":"nadia","naam":"Nadia","sku":"CP_160438","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1360.0,"tot":2564.0,"oppMin":4.81,"oppMax":7.56,"breedteMin":2.75,"breedteMax":2.75,"uitvoeringen":[{"id":"275x175cm","key":"275X175CM","naam":"275X175CM","W":2.75,"L":1.75,"olp":"1009526","helling":8.0,"muur":1.881,"deur":[1.418,1.794],"ramen":1},{"id":"275x230cm","key":"275X230CM","naam":"275X230CM","W":2.75,"L":2.3,"olp":"1009527","helling":6.0,"muur":1.881,"deur":[1.418,1.793],"ramen":1},{"id":"275x275cm","key":"275X275CM","naam":"275X275CM","W":2.75,"L":2.75,"olp":"1009528","helling":5.0,"muur":1.881,"deur":[1.418,1.792],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"275X275CM|Platinum grijs-wit":2564.0,"275X275CM|Carbon grijs-wit":2564.0,"275X275CM|Olijfgroen geimpegneerd":1800.0,"275X275CM|Blank hout":1540.0,"275X275CM|Groen grijs-wit":2564.0,"275X230CM|Platinum grijs-wit":2412.0,"275X230CM|Carbon grijs-wit":2412.0,"275X230CM|Olijfgroen geimpegneerd":1708.0,"275X230CM|Blank hout":1448.0,"275X230CM|Groen grijs-wit":2412.0,"275X175CM|Platinum grijs-wit":2208.0,"275X175CM|Olijfgroen geimpegneerd":1624.0,"275X175CM|Blank hout":1360.0,"275X175CM|Carbon grijs-wit":2208.0,"275X175CM|Groen grijs-wit":2208.0},"sku_var":{"275X275CM|Platinum grijs-wit":"160448","275X275CM|Carbon grijs-wit":"160447","275X275CM|Olijfgroen geimpegneerd":"160446","275X275CM|Blank hout":"160445","275X230CM|Platinum grijs-wit":"160444","275X230CM|Carbon grijs-wit":"160443","275X230CM|Olijfgroen geimpegneerd":"160442","275X230CM|Blank hout":"160441","275X175CM|Platinum grijs-wit":"160440","275X175CM|Olijfgroen geimpegneerd":"160439","275X175CM|Blank hout":"160438","275X175CM|Carbon grijs-wit":"144061","275X275CM|Groen grijs-wit":"164545","275X230CM|Groen grijs-wit":"164544","275X175CM|Groen grijs-wit":"164543"}},
  {"id":"nina","naam":"Nina","sku":"CP_160449","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1448.0,"tot":2616.0,"oppMin":6.32,"oppMax":7.56,"breedteMin":2.75,"breedteMax":2.75,"uitvoeringen":[{"id":"275x230cm","key":"275X230CM","naam":"275X230CM","W":2.75,"L":2.3,"olp":"1009522","muur":1.938,"deur":[0.702,1.793],"raam":[0.585,0.782],"ramen":1},{"id":"275x275cm","key":"275X275CM","naam":"275X275CM","W":2.75,"L":2.75,"olp":"1009523","muur":1.938,"deur":[0.702,1.793],"raam":[0.585,0.782],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"275X230CM|Platinum grijs-wit":2408.0,"275X230CM|Carbon grijs-wit":2408.0,"275X230CM|Olijfgroen geimpegneerd":1712.0,"275X230CM|Blank hout":1448.0,"275X230CM|Groen grijs-wit":2408.0,"275X275CM|Platinum grijs-wit":2616.0,"275X275CM|Carbon grijs-wit":2616.0,"275X275CM|Olijfgroen geimpegneerd":1800.0,"275X275CM|Blank hout":1528.0,"275X275CM|Groen grijs-wit":2616.0},"sku_var":{"275X230CM|Platinum grijs-wit":"144060","275X275CM|Platinum grijs-wit":"160455","275X275CM|Carbon grijs-wit":"160454","275X275CM|Olijfgroen geimpegneerd":"160453","275X275CM|Blank hout":"160452","275X230CM|Carbon grijs-wit":"160451","275X230CM|Olijfgroen geimpegneerd":"160450","275X230CM|Blank hout":"160449","275X275CM|Groen grijs-wit":"164539","275X230CM|Groen grijs-wit":"164538"}},
  {"id":"wels","naam":"Wels","sku":"CP_129858","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1275.2,"tot":2280.0,"oppMin":4.0,"oppMax":4.6,"breedteMin":2.0,"breedteMax":2.3,"uitvoeringen":[{"id":"200x200cm","key":"200x200cm","naam":"200x200cm","W":2.0,"L":2.0,"olp":"1012866","muur":1.938,"deur":[0.7,1.793],"raam":[0.585,0.782],"ramen":1},{"id":"200x230cm","key":"200x230cm","naam":"200x230cm","W":2.0,"L":2.3,"olp":"1012866","muur":1.938,"deur":[0.7,1.793],"raam":[0.585,0.782],"ramen":1,"luifelDeel":0.174}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"200x230cm|Platinum grijs-wit":2280.0,"200x230cm|Carbon grijs-wit":2280.0,"200x230cm|Olijfgroen geimpegneerd":1624.0,"200x230cm|Groen grijs-wit":2280.0,"200x230cm|Blank hout":1363.2,"200x200cm|Platinum grijs-wit":2060.0,"200x200cm|Carbon grijs-wit":2060.0,"200x200cm|Olijfgroen geimpegneerd":1496.0,"200x200cm|Blank hout":1275.2,"200x200cm|Groen grijs-wit":2060.0},"sku_var":{"200x230cm|Platinum grijs-wit":"160498","200x230cm|Carbon grijs-wit":"160497","200x230cm|Olijfgroen geimpegneerd":"160496","200x200cm|Platinum grijs-wit":"160495","200x200cm|Carbon grijs-wit":"160494","200x200cm|Olijfgroen geimpegneerd":"160493","200x200cm|Blank hout":"129858","200x230cm|Groen grijs-wit":"164574","200x200cm|Groen grijs-wit":"164573","200x230cm|Blank hout":"129859"}},
  {"id":"tampa","naam":"Tampa","sku":"CP_160507","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.42,"wanddikte":28,"ramen":1,"deur":"dubbel","vanaf":1848.0,"tot":2192.0,"oppMin":14.05,"oppMax":14.05,"breedteMin":4.81,"breedteMax":4.81,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":4.81,"L":2.92,"olp":"1005922","muur":1.881,"ramen":1,"luifelDeel":0.416}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"}],"prijs":{"standaard|Olijfgroen geimpegneerd":2192.0,"standaard|Blank hout":1848.0},"sku_var":{"standaard|Olijfgroen geimpegneerd":"160508","standaard|Blank hout":"160507"}},
  {"id":"douglas-hr","naam":"Douglas HR","sku":"CP_160636","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"enkel","vanaf":2532.0,"tot":4972.0,"oppMin":5.14,"oppMax":5.14,"breedteMin":2.53,"breedteMax":2.53,"uitvoeringen":[{"id":"symmetrische","key":"Symmetrische","naam":"Symmetrische","W":2.03,"L":2.53},{"id":"asymmetrische-2","key":"Asymmetrische 2","naam":"Asymmetrische 2","W":2.03,"L":2.53},{"id":"asymmetrische-1","key":"Asymmetrische 1","naam":"Asymmetrische 1","W":2.03,"L":2.53},{"id":"asymmetrische","key":"Asymmetrische","naam":"Asymmetrische","W":2.03,"L":2.53}],"kleuren":[{"id":"standaard","key":"Standaard","naam":"Standaard","base":"#C9C4BB","dark":"#8E8A82"}],"prijs":{"Symmetrische|Standaard":2532.0,"Asymmetrische 2|Standaard":3992.0,"Asymmetrische 1|Standaard":3944.0,"Asymmetrische|Standaard":3800.0},"sku_var":{"Symmetrische|Standaard":"160636","Asymmetrische 2|Standaard":"160645","Asymmetrische 1|Standaard":"160644","Asymmetrische|Standaard":"160642"}},
  {"id":"kjeld","naam":"Kjeld","sku":"CP_160561","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.46,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1876.0,"tot":3348.0,"oppMin":13.75,"oppMax":13.75,"breedteMin":5.5,"breedteMax":5.5,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":5.5,"L":2.5,"olp":"1060151","muur":1.995,"ramen":1,"luifelDeel":0.476}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"standaard|Carbon grijs":3348.0,"standaard|Carbon grijs-wit":3348.0,"standaard|Platinum grijs":3348.0,"standaard|Platinum grijs-wit":3348.0,"standaard|Blank hout":1876.0,"standaard|Groen grijs":3348.0,"standaard|Groen grijs-wit":3348.0},"sku_var":{"standaard|Carbon grijs":"160565","standaard|Carbon grijs-wit":"160564","standaard|Platinum grijs":"160563","standaard|Platinum grijs-wit":"160562","standaard|Blank hout":"160561","standaard|Groen grijs":"164596","standaard|Groen grijs-wit":"164595"}},
  {"id":"lars","naam":"Lars","sku":"CP_160556","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.44,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1788.0,"tot":3268.0,"oppMin":12.5,"oppMax":12.5,"breedteMin":5.0,"breedteMax":5.0,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":5.0,"L":2.5,"olp":"1060152","muur":1.995,"ramen":1,"luifelDeel":0.52}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"standaard|Carbon grijs":3268.0,"standaard|Carbon grijs-wit":3268.0,"standaard|Platinum grijs":3268.0,"standaard|Platinum grijs-wit":3268.0,"standaard|Blank hout":1788.0,"standaard|Groen grijs":3268.0,"standaard|Groen grijs-wit":3268.0},"sku_var":{"standaard|Carbon grijs":"160560","standaard|Carbon grijs-wit":"160559","standaard|Platinum grijs":"160558","standaard|Platinum grijs-wit":"160557","standaard|Blank hout":"160556","standaard|Groen grijs":"164594","standaard|Groen grijs-wit":"164593"}},
  {"id":"finn","naam":"Finn","sku":"CP_160551","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.42,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1696.0,"tot":3092.0,"oppMin":11.25,"oppMax":11.25,"breedteMin":4.5,"breedteMax":4.5,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":4.5,"L":2.5,"olp":"1060150","muur":1.995,"ramen":1,"luifelDeel":0.573}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"standaard|Carbon grijs-wit":3092.0,"standaard|Blank hout":1696.0,"standaard|Platinum grijs":3092.0,"standaard|Platinum grijs-wit":3092.0,"standaard|Carbon grijs":3092.0,"standaard|Groen grijs":3092.0,"standaard|Groen grijs-wit":3092.0},"sku_var":{"standaard|Carbon grijs-wit":"160554","standaard|Blank hout":"160551","standaard|Platinum grijs":"160553","standaard|Platinum grijs-wit":"160552","standaard|Carbon grijs":"160555","standaard|Groen grijs":"164592","standaard|Groen grijs-wit":"164591"}},
  {"id":"lotta","naam":"Lotta","sku":"CP_160546","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"dubbel","vanaf":1436.0,"tot":2484.0,"oppMin":7.5,"oppMax":7.5,"breedteMin":3.0,"breedteMax":3.0,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.0,"L":2.5,"olp":"1060153","muur":1.995,"deur":[1.494,1.85],"ramen":0}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"standaard|Blank hout":1436.0,"standaard|Carbon grijs":2484.0,"standaard|Carbon grijs-wit":2484.0,"standaard|Platinum grijs":2484.0,"standaard|Platinum grijs-wit":2484.0,"standaard|Groen grijs":2484.0,"standaard|Groen grijs-wit":2484.0},"sku_var":{"standaard|Blank hout":"160546","standaard|Carbon grijs":"160550","standaard|Carbon grijs-wit":"160549","standaard|Platinum grijs":"160548","standaard|Platinum grijs-wit":"160547","standaard|Groen grijs":"164590","standaard|Groen grijs-wit":"164589"}},
  {"id":"udo","naam":"Udo","sku":"CP_160489","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":2548.0,"tot":4164.0,"oppMin":14.4,"oppMax":14.4,"breedteMin":4.8,"breedteMax":4.8,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":4.8,"L":3.0,"olp":"1009535","muur":1.938,"deur":[1.418,1.794],"raam":[0.585,0.782],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":4164.0,"standaard|Carbon grijs-wit":4164.0,"standaard|Olijfgroen geimpegneerd":2896.0,"standaard|Blank hout":2548.0,"standaard|Groen grijs-wit":4164.0},"sku_var":{"standaard|Platinum grijs-wit":"160492","standaard|Carbon grijs-wit":"160491","standaard|Olijfgroen geimpegneerd":"160490","standaard|Blank hout":"160489","standaard|Groen grijs-wit":"164540"}},
  {"id":"timian","naam":"Timian","sku":"CP_160485","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":1972.0,"tot":3112.0,"oppMin":8.74,"oppMax":8.74,"breedteMin":3.8,"breedteMax":3.8,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.8,"L":2.3,"olp":"1022522","helling":2.0,"muur":2.109,"deur":[1.488,1.875],"raam":[0.82,0.244],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":3112.0,"standaard|Carbon grijs-wit":3112.0,"standaard|Olijfgroen geimpegneerd":2328.0,"standaard|Blank hout":1972.0,"standaard|Groen grijs-wit":3112.0},"sku_var":{"standaard|Platinum grijs-wit":"160488","standaard|Carbon grijs-wit":"160487","standaard|Olijfgroen geimpegneerd":"160486","standaard|Blank hout":"160485","standaard|Groen grijs-wit":"164555"}},
  {"id":"sunniva","naam":"Sunniva","sku":"CP_160481","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.45,"wanddikte":28,"ramen":1,"deur":"dubbel","vanaf":2232.0,"tot":3872.0,"oppMin":15.68,"oppMax":15.68,"breedteMin":5.7,"breedteMax":5.7,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":5.7,"L":2.75,"olp":"1022498","helling":5.0,"muur":1.995,"ramen":1,"luifelDeel":0.617}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":3872.0,"standaard|Carbon grijs-wit":3872.0,"standaard|Olijfgroen geimpegneerd":2672.0,"standaard|Blank hout":2232.0,"standaard|Groen grijs-wit":3872.0},"sku_var":{"standaard|Platinum grijs-wit":"160484","standaard|Carbon grijs-wit":"160483","standaard|Olijfgroen geimpegneerd":"160482","standaard|Blank hout":"160481","standaard|Groen grijs-wit":"164551"}},
  {"id":"olenka","naam":"Olenka","sku":"CP_160472","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.48,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":2764.0,"tot":4688.0,"oppMin":23.43,"oppMax":23.43,"breedteMin":7.1,"breedteMax":7.1,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":7.1,"L":3.3,"olp":"1022564","helling":4.0,"muur":1.995,"ramen":1,"luifelDeel":0.552}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":4688.0,"standaard|Carbon grijs-wit":4688.0,"standaard|Olijfgroen geimpegneerd":3112.0,"standaard|Blank hout":2764.0,"standaard|Groen grijs-wit":4688.0},"sku_var":{"standaard|Platinum grijs-wit":"160475","standaard|Carbon grijs-wit":"160474","standaard|Olijfgroen geimpegneerd":"160473","standaard|Blank hout":"160472","standaard|Groen grijs-wit":"164567"}},
  {"id":"octavio","naam":"Octavio","sku":"CP_160468","dakvorm":"zadeldak","luifel":"ja","deelOpen":0.38,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":2896.0,"tot":5028.0,"oppMin":25.88,"oppMax":25.88,"breedteMin":6.81,"breedteMax":6.81,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":6.81,"L":3.8,"olp":"1009533","muur":2.109,"deur":[1.418,1.794],"ramen":1,"luifelDeel":0.575}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":5028.0,"standaard|Carbon grijs-wit":5028.0,"standaard|Olijfgroen geimpegneerd":3376.0,"standaard|Blank hout":2896.0,"standaard|Groen grijs-wit":5028.0},"sku_var":{"standaard|Platinum grijs-wit":"160471","standaard|Carbon grijs-wit":"160470","standaard|Olijfgroen geimpegneerd":"160469","standaard|Blank hout":"160468","standaard|Groen grijs-wit":"164554"}},
  {"id":"mikkel","naam":"Mikkel","sku":"CP_160435","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":2020.0,"tot":3464.0,"oppMin":10.45,"oppMax":10.45,"breedteMin":3.8,"breedteMax":3.8,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.8,"L":2.75,"olp":"1015432","helling":2.0,"muur":2.223,"deur":[1.488,1.875],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Carbon grijs-wit":3464.0,"standaard|Olijfgroen geimpegneerd":2412.0,"standaard|Blank hout":2020.0,"standaard|Platinum grijs-wit":3464.0,"standaard|Groen grijs-wit":3464.0},"sku_var":{"standaard|Carbon grijs-wit":"160437","standaard|Olijfgroen geimpegneerd":"160436","standaard|Blank hout":"160435","standaard|Platinum grijs-wit":"144062","standaard|Groen grijs-wit":"164556"}},
  {"id":"maribel","naam":"Maribel","sku":"CP_160431","dakvorm":"zadeldak","luifel":"ja","deelOpen":0.4,"wanddikte":34,"ramen":2,"deur":"dubbel","vanaf":3244.0,"tot":5304.0,"oppMin":20.4,"oppMax":20.4,"breedteMin":6.8,"breedteMax":6.8,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":6.8,"L":3.0,"olp":"1017211","muur":2.109,"deur":[1.394,1.875],"ramen":1,"luifelDeel":0.578}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":5304.0,"standaard|Carbon grijs-wit":5304.0,"standaard|Olijfgroen geimpegneerd":3772.0,"standaard|Blank hout":3244.0,"standaard|Groen grijs-wit":5304.0},"sku_var":{"standaard|Platinum grijs-wit":"160434","standaard|Carbon grijs-wit":"160433","standaard|Olijfgroen geimpegneerd":"160432","standaard|Blank hout":"160431","standaard|Groen grijs-wit":"164565"}},
  {"id":"manuel","naam":"Manuel","sku":"CP_160427","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.44,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":2324.0,"tot":3900.0,"oppMin":16.5,"oppMax":16.5,"breedteMin":6.0,"breedteMax":6.0,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":6.0,"L":2.75,"olp":"1022504","helling":6.0,"muur":1.995,"ramen":1,"luifelDeel":0.558}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":3900.0,"standaard|Carbon grijs-wit":3900.0,"standaard|Olijfgroen geimpegneerd":2672.0,"standaard|Blank hout":2324.0,"standaard|Groen grijs-wit":3900.0},"sku_var":{"standaard|Platinum grijs-wit":"160430","standaard|Carbon grijs-wit":"160429","standaard|Olijfgroen geimpegneerd":"160428","standaard|Blank hout":"160427","standaard|Groen grijs-wit":"164552"}},
  {"id":"jelle","naam":"Jelle","sku":"CP_160411","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.34,"wanddikte":28,"ramen":0,"deur":"enkel","vanaf":1320.0,"tot":2236.0,"oppMin":6.48,"oppMax":6.48,"breedteMin":3.7,"breedteMax":3.7,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.7,"L":1.75,"olp":"1009521","helling":8.0,"muur":1.881,"ramen":1,"luifelDeel":0.552}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":2236.0,"standaard|Carbon grijs-wit":2236.0,"standaard|Olijfgroen geimpegneerd":1584.0,"standaard|Blank hout":1320.0,"standaard|Groen grijs-wit":2236.0},"sku_var":{"standaard|Platinum grijs-wit":"160414","standaard|Carbon grijs-wit":"160413","standaard|Olijfgroen geimpegneerd":"160412","standaard|Blank hout":"160411","standaard|Groen grijs-wit":"164550"}},
  {"id":"aida","naam":"Aida","sku":"CP_160361","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.5,"wanddikte":28,"ramen":1,"deur":"dubbel","vanaf":2676.0,"tot":4420.0,"oppMin":20.9,"oppMax":20.9,"breedteMin":7.6,"breedteMax":7.6,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":7.6,"L":2.75,"olp":"1009542","helling":5.0,"muur":1.881,"raam":[0.585,0.782],"ramen":1,"luifelDeel":0.517}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":4420.0,"standaard|Carbon grijs-wit":4420.0,"standaard|Olijfgroen geimpegneerd":3024.0,"standaard|Blank hout":2676.0,"standaard|Groen grijs-wit":4420.0},"sku_var":{"standaard|Platinum grijs-wit":"160364","standaard|Carbon grijs-wit":"160363","standaard|Olijfgroen geimpegneerd":"160362","standaard|Blank hout":"160361","standaard|Groen grijs-wit":"164549"}},
  {"id":"helena","naam":"Helena","sku":"CP_144471","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.44,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":1712.0,"tot":2884.0,"oppMin":10.86,"oppMax":10.86,"breedteMin":4.72,"breedteMax":4.72,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":4.72,"L":2.3,"olp":"1022540","helling":2.0,"muur":2.052,"ramen":1,"luifelDeel":0.595}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":2884.0,"standaard|Carbon grijs-wit":2884.0,"standaard|Olijfgroen geimpegneerd":1972.0,"standaard|Blank hout":1712.0,"standaard|Groen grijs-wit":2884.0},"sku_var":{"standaard|Platinum grijs-wit":"160394","standaard|Carbon grijs-wit":"160393","standaard|Olijfgroen geimpegneerd":"160392","standaard|Blank hout":"144471","standaard|Groen grijs-wit":"164566"}},
  {"id":"fraya","naam":"Fraya","sku":"CP_160389","dakvorm":"zadeldak","luifel":"ja","deelOpen":0.4,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":2320.0,"tot":3988.0,"oppMin":15.81,"oppMax":15.81,"breedteMin":5.75,"breedteMax":5.75,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":5.75,"L":2.75,"olp":"1022516","muur":2.109,"deur":[1.394,1.875],"ramen":1,"luifelDeel":0.538}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":3988.0,"standaard|Carbon grijs-wit":3988.0,"standaard|Blank hout":2320.0,"standaard|Olijfgroen geimpegneerd":2676.0,"standaard|Groen grijs-wit":3988.0},"sku_var":{"standaard|Platinum grijs-wit":"160391","standaard|Carbon grijs-wit":"160390","standaard|Blank hout":"160389","standaard|Olijfgroen geimpegneerd":"144468","standaard|Groen grijs-wit":"164553"}},
  {"id":"baltimore","naam":"Baltimore","sku":"CP_116851","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1276.0,"tot":2500.0,"oppMin":6.72,"oppMax":6.72,"breedteMin":2.92,"breedteMax":2.92,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":2.92,"L":2.3,"olp":"1004486","muur":1.938,"deur":[1.418,1.794],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Carbon grijs-wit":2500.0,"standaard|Olijfgroen geimpegneerd":1712.0,"standaard|Blank hout":1276.0,"standaard|Groen grijs-wit":2500.0},"sku_var":{"standaard|Carbon grijs-wit":"160378","standaard|Olijfgroen geimpegneerd":"160377","standaard|Blank hout":"116851","standaard|Groen grijs-wit":"164571"}},
  {"id":"dallas","naam":"Dallas","sku":"CP_116853","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":2,"deur":"dubbel","vanaf":1932.0,"tot":3260.0,"oppMin":10.98,"oppMax":10.98,"breedteMin":3.76,"breedteMax":3.76,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.76,"L":2.92,"olp":"1005916","muur":1.938,"deur":[1.418,1.794],"raam":[0.685,0.882],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":3260.0,"standaard|Carbon grijs-wit":3260.0,"standaard|Blank hout":1932.0,"standaard|Olijfgroen geimpegneerd":2236.0,"standaard|Groen grijs-wit":3260.0},"sku_var":{"standaard|Platinum grijs-wit":"160384","standaard|Carbon grijs-wit":"160383","standaard|Blank hout":"116853","standaard|Olijfgroen geimpegneerd":"131755","standaard|Groen grijs-wit":"164572"}},
  {"id":"douglas-zr","naam":"Douglas ZR","sku":"CP_160610","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"enkel","vanaf":2292.0,"tot":4540.0,"oppMin":5.14,"oppMax":5.14,"breedteMin":2.53,"breedteMax":2.53,"uitvoeringen":[{"id":"symmetrische","key":"Symmetrische","naam":"Symmetrische","W":2.03,"L":2.53},{"id":"asymmetrische-2","key":"Asymmetrische 2","naam":"Asymmetrische 2","W":2.03,"L":2.53},{"id":"asymmetrische-1","key":"Asymmetrische 1","naam":"Asymmetrische 1","W":2.03,"L":2.53},{"id":"asymmetrische","key":"Asymmetrische","naam":"Asymmetrische","W":2.03,"L":2.53}],"kleuren":[{"id":"standaard","key":"Standaard","naam":"Standaard","base":"#C9C4BB","dark":"#8E8A82"}],"prijs":{"Symmetrische|Standaard":2292.0,"Asymmetrische 2|Standaard":3636.0,"Asymmetrische 1|Standaard":3600.0,"Asymmetrische|Standaard":3476.0},"sku_var":{"Symmetrische|Standaard":"160610","Asymmetrische 2|Standaard":"160619","Asymmetrische 1|Standaard":"160618","Asymmetrische|Standaard":"160616"}},
  {"id":"caroline-sgc","naam":"Caroline SGC","sku":"CP_160380","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":40,"ramen":2,"deur":"enkel","vanaf":6256.0,"tot":6256.0,"oppMin":22.43,"oppMax":22.43,"breedteMin":5.75,"breedteMax":5.75,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.9,"L":5.75,"olp":"1010185","muur":2.337,"deur":[1.394,1.875],"raam":[0.782,0.782],"ramen":3}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"}],"prijs":{"standaard|Blank hout":6256.0},"sku_var":{"standaard|Blank hout":"160380"}},
  {"id":"garage-dillon","naam":"Garage Dillon","sku":"CP_160385","dakvorm":"zadeldak","luifel":"nee","deelOpen":0,"wanddikte":34,"ramen":1,"deur":"enkel","vanaf":2936.0,"tot":4772.0,"oppMin":16.2,"oppMax":16.2,"breedteMin":5.4,"breedteMax":5.4,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":3.0,"L":5.4,"olp":"1009539","muur":2.109,"deur":[2.29,1.97],"raam":[0.89,0.782],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":4772.0,"standaard|Carbon grijs-wit":4772.0,"standaard|Olijfgroen geimpegneerd":3288.0,"standaard|Blank hout":2936.0,"standaard|Groen grijs-wit":4772.0},"sku_var":{"standaard|Platinum grijs-wit":"160388","standaard|Carbon grijs-wit":"160387","standaard|Olijfgroen geimpegneerd":"160386","standaard|Blank hout":"160385","standaard|Groen grijs-wit":"164557"}},
  {"id":"st-louis","naam":"St. Louis","sku":"CP_129856","dakvorm":"lessenaarsdak","luifel":"ja","deelOpen":0.5,"wanddikte":28,"ramen":1,"deur":"dubbel","vanaf":1996.0,"tot":3900.0,"oppMin":19.89,"oppMax":19.89,"breedteMin":6.81,"breedteMax":6.81,"uitvoeringen":[{"id":"standaard","key":"standaard","naam":"Standaard","W":6.81,"L":2.92,"olp":"1005923","helling":4.0,"muur":1.881,"ramen":1,"luifelDeel":0.588}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"olijfgroen-geimpegneerd","key":"Olijfgroen geimpegneerd","naam":"Olijfgroen geïmpregneerd","base":"#6E7350","dark":"#464A31"},{"id":"platinum-grijs-wit","key":"Platinum grijs-wit","naam":"Platinum grijs-wit","base":"#D6D5D0","dark":"#A8A79F"},{"id":"carbon-grijs-wit","key":"Carbon grijs-wit","naam":"Carbon grijs-wit","base":"#CFCFCC","dark":"#8E8E8B"},{"id":"groen-grijs-wit","key":"Groen grijs-wit","naam":"Groen grijs-wit","base":"#CBD0C6","dark":"#969C8F"}],"prijs":{"standaard|Platinum grijs-wit":3900.0,"standaard|Carbon grijs-wit":3900.0,"standaard|Olijfgroen geimpegneerd":2584.0,"standaard|Blank hout":1996.0,"standaard|Groen grijs-wit":3900.0},"sku_var":{"standaard|Platinum grijs-wit":"160480","standaard|Carbon grijs-wit":"160479","standaard|Olijfgroen geimpegneerd":"160478","standaard|Blank hout":"129856","standaard|Groen grijs-wit":"164570"}},
  {"id":"douglas-z-zr","naam":"Douglas Z-ZR","sku":"CP_160623","dakvorm":"lessenaarsdak","luifel":"nee","deelOpen":0,"wanddikte":28,"ramen":0,"deur":"enkel","vanaf":2532.0,"tot":4968.0,"oppMin":5.14,"oppMax":5.14,"breedteMin":2.53,"breedteMax":2.53,"uitvoeringen":[{"id":"symmetrische","key":"Symmetrische","naam":"Symmetrische","W":2.03,"L":2.53},{"id":"asymmetrische-2","key":"Asymmetrische 2","naam":"Asymmetrische 2","W":2.03,"L":2.53},{"id":"asymmetrische-1","key":"Asymmetrische 1","naam":"Asymmetrische 1","W":2.03,"L":2.53},{"id":"asymmetrische","key":"Asymmetrische","naam":"Asymmetrische","W":2.03,"L":2.53}],"kleuren":[{"id":"standaard","key":"Standaard","naam":"Standaard","base":"#C9C4BB","dark":"#8E8A82"}],"prijs":{"Symmetrische|Standaard":2532.0,"Asymmetrische 2|Standaard":3988.0,"Asymmetrische 1|Standaard":3944.0,"Asymmetrische|Standaard":3800.0},"sku_var":{"Symmetrische|Standaard":"160623","Asymmetrische 2|Standaard":"160632","Asymmetrische 1|Standaard":"160631","Asymmetrische|Standaard":"160629"}},
  {"id":"pernilla","naam":"Pernilla","sku":"CP_160578","dakvorm":"lessenaarsdak","luifel":"optie","deelOpen":0.4,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":3004.0,"tot":6396.0,"oppMin":11.36,"oppMax":11.36,"breedteMin":3.85,"breedteMax":3.85,"uitvoeringen":[{"id":"tuinhuis-aanbouw","key":"Tuinhuis + aanbouw","naam":"Tuinhuis + aanbouw","W":3.85,"L":2.95,"olp":"1060270","muur":2.28,"deur":[1.9,1.93],"ramen":1},{"id":"tuinhuis","key":"Tuinhuis","naam":"Tuinhuis","W":3.85,"L":2.95,"olp":"1060270","muur":2.28,"deur":[1.9,1.93],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"Tuinhuis + aanbouw|Carbon grijs":6396.0,"Tuinhuis + aanbouw|Platinum grijs":6396.0,"Tuinhuis + aanbouw|Blank hout":4308.0,"Tuinhuis + aanbouw|Groen grijs":6396.0,"Tuinhuis|Carbon grijs":4396.0,"Tuinhuis|Platinum grijs":4396.0,"Tuinhuis|Blank hout":3004.0,"Tuinhuis|Groen grijs":4396.0},"sku_var":{"Tuinhuis + aanbouw|Carbon grijs":"160583","Tuinhuis + aanbouw|Platinum grijs":"160582","Tuinhuis + aanbouw|Blank hout":"160581","Tuinhuis|Carbon grijs":"160580","Tuinhuis|Platinum grijs":"160579","Tuinhuis|Blank hout":"160578","Tuinhuis + aanbouw|Groen grijs":"164602","Tuinhuis|Groen grijs":"164601"}},
  {"id":"olivia","naam":"Olivia","sku":"CP_160572","dakvorm":"lessenaarsdak","luifel":"optie","deelOpen":0.4,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":2916.0,"tot":6224.0,"oppMin":11.36,"oppMax":11.36,"breedteMin":3.85,"breedteMax":3.85,"uitvoeringen":[{"id":"tuinhuis-aanbouw","key":"Tuinhuis + aanbouw","naam":"Tuinhuis + aanbouw","W":3.85,"L":2.95,"olp":"1060264","muur":2.28,"deur":[1.9,1.93],"ramen":1},{"id":"tuinhuis","key":"Tuinhuis","naam":"Tuinhuis","W":3.85,"L":2.95,"olp":"1060264","muur":2.28,"deur":[1.9,1.93],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"Tuinhuis + aanbouw|Carbon grijs":6224.0,"Tuinhuis + aanbouw|Platinum grijs":6224.0,"Tuinhuis + aanbouw|Blank hout":4224.0,"Tuinhuis + aanbouw|Groen grijs":6224.0,"Tuinhuis|Carbon grijs":4308.0,"Tuinhuis|Platinum grijs":4308.0,"Tuinhuis|Blank hout":2916.0,"Tuinhuis|Groen grijs":4308.0},"sku_var":{"Tuinhuis + aanbouw|Carbon grijs":"160577","Tuinhuis + aanbouw|Platinum grijs":"160576","Tuinhuis + aanbouw|Blank hout":"160575","Tuinhuis|Carbon grijs":"160574","Tuinhuis|Platinum grijs":"160573","Tuinhuis|Blank hout":"160572","Tuinhuis + aanbouw|Groen grijs":"164600","Tuinhuis|Groen grijs":"164599"}},
  {"id":"julia","naam":"Julia","sku":"CP_160566","dakvorm":"lessenaarsdak","luifel":"optie","deelOpen":0.4,"wanddikte":28,"ramen":1,"deur":"glas","vanaf":2660.0,"tot":5836.0,"oppMin":8.7,"oppMax":8.7,"breedteMin":2.95,"breedteMax":2.95,"uitvoeringen":[{"id":"tuinhuis-aanbouw","key":"Tuinhuis + aanbouw","naam":"Tuinhuis + aanbouw","W":2.95,"L":2.95,"olp":"1060258","muur":2.28,"deur":[0.95,1.93],"ramen":1},{"id":"tuinhuis","key":"Tuinhuis","naam":"Tuinhuis","W":2.95,"L":2.95,"olp":"1060258","muur":2.28,"deur":[0.95,1.93],"ramen":1}],"kleuren":[{"id":"blank-hout","key":"Blank hout","naam":"Blank hout","base":"#D9C093","dark":"#A48B58"},{"id":"platinum-grijs","key":"Platinum grijs","naam":"Platinum grijs","base":"#9A9C99","dark":"#6D6F6C"},{"id":"carbon-grijs","key":"Carbon grijs","naam":"Carbon grijs","base":"#4A4C4D","dark":"#2E3031"},{"id":"groen-grijs","key":"Groen grijs","naam":"Groen grijs","base":"#5E6857","dark":"#3C4437"}],"prijs":{"Tuinhuis + aanbouw|Carbon grijs":5836.0,"Tuinhuis + aanbouw|Platinum grijs":5836.0,"Tuinhuis + aanbouw|Blank hout":3960.0,"Tuinhuis + aanbouw|Groen grijs":5836.0,"Tuinhuis|Carbon grijs":3872.0,"Tuinhuis|Platinum grijs":3872.0,"Tuinhuis|Blank hout":2660.0,"Tuinhuis|Groen grijs":3872.0},"sku_var":{"Tuinhuis + aanbouw|Carbon grijs":"160571","Tuinhuis + aanbouw|Platinum grijs":"160570","Tuinhuis + aanbouw|Blank hout":"160569","Tuinhuis|Carbon grijs":"160568","Tuinhuis|Platinum grijs":"160567","Tuinhuis|Blank hout":"160566","Tuinhuis + aanbouw|Groen grijs":"164598","Tuinhuis|Groen grijs":"164597"}}
];

/* Losse artikelen uit dezelfde reeks, met hun echte prijs en sku. */
const ACCESSOIRES = [
  { id:'vloer',   naam:'Vloerpakket',            sub:'Vloerdelen op regels',        sku:'160653', price:125 },
  { id:'epdm',    naam:'EPDM dakpakket',         sub:'Het dak wordt zonder bedekking geleverd', sku:'160727', price:180 },
  { id:'shingles',naam:'Shingles inclusief nagels', sub:'Alternatief voor EPDM',    sku:'144470', price:75 },
  { id:'goot',    naam:'Dakgootset',             sub:'Diameter 10 cm',              sku:'144474', price:115 },
  { id:'fundament',naam:'Fundamentbalk',         sub:'Per set',                     sku:'144469', price:65 },
  { id:'rooster', naam:'Ventilatierooster',      sub:'Set',                         sku:'160712', price:15 }
];

/* De productfoto's van de webshop zelf. Alle 38 volgen hetzelfde patroon,
   dus één basis plus de sku volstaat. Ze worden van cevo.be geladen en niet
   ingesloten, want 38 foto's als data-URI maakt het bestand te zwaar voor
   mobiel. Bewust de grote versie: die is bijgesneden op het product (ongeveer
   730 bij 409, 33 kB), terwijl de catalogusversie het huisje in een staand
   kader van 208 bij 260 klemt en daardoor klein oogt. */
const FOTO_BASIS = 'https://cevo.be/media/catalog/product/cache/3520e5bd0f38a3cdedf23948c04dbb6d/C/P/';
const fotoVan = m => FOTO_BASIS + m.sku + '_' + m.sku + '.jpg';

/* Tekeningetjes bij de keuzes. Woorden als lessenaarsdak zeggen een klant
   niets, een silhouet wel. Bewust lijntekeningen in de merkkleur, geen
   plaatjes, zodat ze meeschalen en niets wegen. */
const IC = {
  plat:   '<path d="M3 12 41 6"/><path d="M7 11.4V26h30V8.5"/>',
  zadel:  '<path d="M3 15 22 5 41 15"/><path d="M8 12.5V26h28V12.5"/>',
  beideDak: '<path d="M2 13 20 8"/><path d="M5 12.5V25h12V9.4"/>' +
            '<path d="M24 13 32 7 42 13"/><path d="M27 11.5V25h12V11.5"/>',
  luifel:      '<path d="M2 9h40"/><path d="M6 9v17h17V9"/><path d="M30 9v17"/><path d="M38.5 9v17"/>',
  geenLuifel:  '<path d="M6 9h32"/><path d="M10 9v17h24V9"/>',
  beideLuifel: '<path d="M2 9h40"/><path d="M6 9v17h17V9"/>' +
               '<path d="M30 9v17" stroke-dasharray="3 3"/><path d="M38.5 9v17" stroke-dasharray="3 3"/>',
  klein:  '<rect x="16" y="8" width="12" height="12" rx="1"/><path d="M16 25h12M16 22.5v5M28 22.5v5"/>',
  midden: '<rect x="11" y="8" width="22" height="12" rx="1"/><path d="M11 25h22M11 22.5v5M33 22.5v5"/>',
  groot:  '<rect x="4" y="8" width="36" height="12" rx="1"/><path d="M4 25h36M4 22.5v5M40 22.5v5"/>',
  alleMaten: '<rect x="2" y="10" width="8" height="12" rx="1"/><rect x="13" y="10" width="12" height="12" rx="1"/><rect x="28" y="10" width="16" height="12" rx="1"/>'
};

/* De filtertegels. Drie stappen na elkaar: pas als stap één beantwoord is
   verschijnt stap twee. 'Maakt niet uit' staat er bewust bij: iemand dwingen
   te kiezen over iets waar hij niets om geeft levert een verkeerde selectie
   op. Een knop die nul resultaten geeft wordt niet getoond. */
const FILTERS = [
  {
    id: 'dakvorm', title: 'Dakvorm', vraag: 'Welk dak past bij je tuin?',
    options: [
      { id:'lessenaarsdak', naam:'Plat dak',       icon:IC.plat,     match:m=>m.dakvorm==='lessenaarsdak' },
      { id:'zadeldak',      naam:'Zadeldak',       icon:IC.zadel,    match:m=>m.dakvorm==='zadeldak' },
      { id:'alles',         naam:'Maakt niet uit', icon:IC.beideDak, match:()=>true }
    ]
  },
  {
    id: 'luifel', title: 'Luifel', vraag: 'Wil je een overdekt stuk ernaast?',
    options: [
      { id:'ja',    naam:'Met luifel',     icon:IC.luifel,      match:m=>m.luifel!=='nee' },
      { id:'nee',   naam:'Zonder luifel',  icon:IC.geenLuifel,  match:m=>m.luifel!=='ja' },
      { id:'alles', naam:'Maakt niet uit', icon:IC.beideLuifel, match:()=>true }
    ]
  },
  {
    id: 'grootte', title: 'Breedte', vraag: 'Hoe breed mag het worden?',
    options: [
      { id:'klein', naam:'Tot 3 m',        icon:IC.klein,     match:m=>m.breedteMin<=3 },
      { id:'midden',naam:'3 tot 5 m',      icon:IC.midden,    match:m=>m.breedteMax>=3 && m.breedteMin<=5 },
      { id:'groot', naam:'Meer dan 5 m',   icon:IC.groot,     match:m=>m.breedteMax>5 },
      { id:'alles', naam:'Maakt niet uit', icon:IC.alleMaten, match:()=>true }
    ]
  }
];

/* ---- helpers ---- */
const mdl  = s => MODELLEN.find(m => m.id === s.model) || MODELLEN[0];
const uitv = s => { const m = mdl(s); return m.uitvoeringen.find(u => u.id === s.uitvoering) || m.uitvoeringen[0]; };
const klr  = s => { const m = mdl(s); return m.kleuren.find(k => k.id === s.kleur) || m.kleuren[0]; };
const sleutel = s => uitv(s).key + '|' + klr(s).key;
const varPrijs = s => mdl(s).prijs[sleutel(s)];
const varSku   = s => mdl(s).sku_var[sleutel(s)];
/* Niet elke kleur bestaat in elke uitvoering. Val terug op de goedkoopste
   die wel bestaat, anders staat er een leeg prijsveld. */
function normaliseer(s) {
  const m = mdl(s);
  if (!m.uitvoeringen.some(u => u.id === s.uitvoering)) s.uitvoering = m.uitvoeringen[0].id;
  if (!m.kleuren.some(k => k.id === s.kleur)) s.kleur = m.kleuren[0].id;
  if (varPrijs(s) === undefined) {
    const u = uitv(s);
    const k = m.kleuren.find(k => m.prijs[u.key + '|' + k.key] !== undefined);
    if (k) s.kleur = k.id;
  }
}
/* De goedkoopste kleur binnen een uitvoering. Niet elke kleur bestaat in
   elke maat, dus dit is ook de veilige terugval. */
function goedkoopsteVan(m, u) {
  let min = Infinity;
  m.kleuren.forEach(k => { const p = m.prijs[u.key + '|' + k.key]; if (p !== undefined && p < min) min = p; });
  return min === Infinity ? m.vanaf : min;
}
/* Hoe breed de luifel is. De fabrikant geeft het binnenmaat vloeroppervlak,
   en het verschil met het grondvlak is precies het overdekte deel. Alleen als
   dat ontbreekt vallen we terug op de schatting van de foto. */
const luifelBreedte = s => {
  const m = mdl(s), u = uitv(s);
  const deel = u.luifelDeel !== undefined ? u.luifelDeel : (m.deelOpen || 0.42);
  if (m.luifel === 'nee') return 0;
  if (m.luifel === 'optie') return /aanbouw/i.test(u.key) ? (u.W || 3) * (m.deelOpen || 0.4) : 0;
  return (u.W || 3) * deel;
};
/* De gesloten berging is de totale breedte min de luifel. */
const kernW = s => (uitv(s).W || 3) - luifelBreedte(s);
const diepte = s => uitv(s).L || 2.5;

const PRODUCT = {
  id: 'cevo-tuinhuis',
  name: 'Tuinhuis',
  hinged: true,
  base: 0,                       // de basisprijs komt uit de gekozen variant
  disclaimer: 'Weergave op basis van maten en productfotos, geen fabriekstekening.',

  /* ---- catalogus: eerst filteren, dan een model kiezen ---- */
  catalog: {
    filters: FILTERS,
    models: MODELLEN,
    /* Sluit het model aan bij de gekozen filters? */
    match(m, keuze) {
      return FILTERS.every(f => {
        const o = f.options.find(o => o.id === keuze[f.id]);
        return !o || o.match(m);
      });
    },
    /* De kaart in het resultatenraster: de foto van de webshop, de naam en
       vanaf welke prijs. De maten en het artikelnummer horen op de
       productpagina thuis, niet in een keuzelijst. */
    card(m) {
      const dak = m.dakvorm === 'zadeldak' ? 'Zadeldak' : 'Plat dak';
      const lu = m.luifel === 'ja' ? 'met luifel' : m.luifel === 'optie' ? 'luifel optioneel' : 'zonder luifel';
      return { naam: m.naam, meta: dak + ', ' + lu, foto: fotoVan(m), vanaf: m.vanaf };
    },
    /* Opent het model op de uitvoering die bij de filterkeuze hoort. Alleen
       van belang bij de drie modellen die de aanbouw als variant voeren. */
    preselect(m, keuze) {
      if (m.luifel !== 'optie' || !keuze || !keuze.luifel || keuze.luifel === 'alles') return null;
      const wil = keuze.luifel === 'ja';
      const u = m.uitvoeringen.find(x => /aanbouw/i.test(x.key) === wil);
      return u ? { uitvoering: u.id } : null;
    },

    /* De secties binnen het gekozen model. */
    sections(m) {
      const secs = [];
      /* De basisprijs is de goedkoopste variant, precies de 'vanaf' prijs
         van de webshop. Elke keuze toont daarna wat ze erbij kost, zodat de
         klant de sprong van blank hout naar een gecoate kleur ziet aankomen
         en niet pas in de winkelwagen. */
      if (m.uitvoeringen.length > 1) {
        secs.push({
          id: 'uitvoering', title: 'Uitvoering', type: 'choice', layout: 'two',
          options: m.uitvoeringen.map((u, i) => ({
            id: u.id, name: u.naam, sub: u.W ? (Math.round(u.W * u.L * 100) / 100 + ' m²').replace('.', ',') : '',
            default: i === 0
          })),
          price: (s, o) => {
            const u = m.uitvoeringen.find(x => x.id === o.id) || m.uitvoeringen[0];
            return goedkoopsteVan(m, u) - m.vanaf;
          },
          rebuild: true, always: true,
          line: o => 'Uitvoering ' + o.name
        });
      }
      if (m.kleuren.length > 1) {
        secs.push({
          id: 'kleur', title: 'Kleur en afwerking', type: 'choice', layout: 'two',
          options: m.kleuren.map((k, i) => ({
            id: k.id, name: k.naam, color: k.base, default: i === 0
          })),
          price: (s, o) => {
            const u = uitv(s), k = m.kleuren.find(x => x.id === o.id) || m.kleuren[0];
            const p = m.prijs[u.key + '|' + k.key];
            return p === undefined ? 0 : p - goedkoopsteVan(m, u);
          },
          rebuild: true,
          line: o => 'Kleur ' + o.name
        });
      }
      secs.push({
        id: 'toebehoren', title: 'Toebehoren', type: 'toggles',
        options: ACCESSOIRES.map(a => ({ id: a.id, name: a.naam, sub: a.sub, price: a.price }))
      });
      return secs;
    }
  },

  /* ---- haken voor de engine ---- */
  woodColors: s => { const k = klr(s); return { base: k.base, dark: k.dark }; },
  roof: () => ({ kind: 'sheet', color: '#2E2E2C' }),
  /* Bij een zadeldak met luifel loopt de nok over de breedte, want het dak
     moet over het open deel doorlopen. Zonder luifel staat de topgevel aan
     de voorkant en loopt de nok naar achteren. Zo staat het op de foto's van
     Maribel, Octavio en Fraya tegenover Udo, Norah en Dallas. */
  height: s => {
    const m = mdl(s);
    if (m.dakvorm !== 'zadeldak') return 1.98 + diepte(s) * 0.1405;   // 8 graden
    const span = (m.luifel === 'ja' || luifelBreedte(s) > 0.4) ? diepte(s) : kernW(s);
    return 2.15 + Math.min(span, 4.2) * 0.17;
  },
  footprint: s => ({ W: uitv(s).W || 3, L: diepte(s) }),

  normalize: normaliseer,

  /* Klein regeltje onder de modelnaam: het artikelnummer van precies de
     variant die nu gekozen is, plus dat van de ouder. Dat is wat een
     medewerker in Magento intikt. */
  subline: s => {
    const k = varSku(s);
    return k ? 'Art. ' + k + '  ·  ' + mdl(s).sku : mdl(s).sku;
  },

  /* Eerste regel van de prijsopbouw: het model in zijn goedkoopste uitvoering. */
  extraLines: s => [{ n: mdl(s).naam + ', basisuitvoering (' + mdl(s).sku + ')', p: mdl(s).vanaf }],

  /* Wat er naar de webshop zou gaan. Dit is het aanknopingspunt voor de
     koppeling: de sku van de gekozen variant plus de losse artikelen. */
  payload: s => ({
    model: mdl(s).naam,
    parent_sku: mdl(s).sku,
    sku: varSku(s) || null,
    uitvoering: uitv(s).naam,
    kleur: klr(s).naam,
    variantprijs: varPrijs(s) || null,
    toebehoren: ACCESSOIRES.filter(a => s.toebehoren && s.toebehoren[a.id])
                           .map(a => ({ sku: a.sku, naam: a.naam, prijs: a.price }))
  }),

  /* ---- het model ---- */
  build(s) {
    normaliseer(s);
    const m = mdl(s), u = uitv(s);
    const Wt = u.W || 3, L = diepte(s);
    const lu = luifelBreedte(s), Wk = Math.max(1.4, Wt - lu);
    const wallH = u.muur || 1.891, t = Math.max(0.028, m.wanddikte / 1000), fy = 0.09;   // binnenmaat hoogte
    const eave = fy + wallH;
    const zadel = m.dakvorm === 'zadeldak';
    const nokOverBreedte = zadel && lu > 0.4;      // dak loopt door over de luifel
    const spanDak = nokOverBreedte ? L : Wk;       // waarover het dakvlak helt
    const top = eave + Math.min(spanDak, 4.2) * 0.17;
    const cx = -Wt / 2 + Wk / 2;              // hart van de gesloten berging

    /* Een groep die een kwartslag gedraaid staat, zodat gableRoof de nok over
       de breedte legt in plaats van naar achteren. */
    function gedraaid(fn) {
      const g = new THREE.Group(); g.rotation.y = Math.PI / 2; cur.add(g);
      const prev = cur; cur = g; try { fn(); } finally { cur = prev; }
    }

    const iron = new THREE.MeshStandardMaterial({ color: col('#1C1C1C'), roughness: .6, metalness: .2 });
    const glas = new THREE.MeshStandardMaterial({ color: col('#BFD6E2'), roughness: .12, metalness: .1, transparent: true, opacity: .55 });

    /* --- gesloten deel ---
       Maten uit de montagehandleiding van Outdoor Life (Amira 380x175):
       wandhoogte 189,1 achter en 211,6 voor, dakhelling 8 graden, dus het
       lessenaarsdak is HOOG AAN DE VOORKANT en helt naar achteren. De
       zijwanden zijn daardoor trapezium en geen rechthoek. Deuropening
       149,4 x 185, raamopening 68,5 x 88,2 met de bovenkant gelijk aan die
       van de deur, en het raam zit naast de deur in de voorgevel, niet in
       de zijwand. */
    // dakhelling van de fabrikant als die er is, anders 8 graden
    const graden = u.helling || 8;
    const rise = zadel ? 0 : L * Math.tan(graden * Math.PI / 180);
    const hA = eave;                          // achterwand, laag
    const hV = eave + rise;                   // voorgevel, hoog

    /* Trapeziumvormige wand: links hoog hL, rechts hoog hR. */
    function schuinShape(w, hL, hR, holes) {
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, hR); sh.lineTo(-w / 2, hL); sh.closePath();
      (holes || []).forEach(h => {
        const pa = new THREE.Path();
        pa.moveTo(h.x - h.w / 2, h.y); pa.lineTo(h.x + h.w / 2, h.y);
        pa.lineTo(h.x + h.w / 2, h.y + h.h); pa.lineTo(h.x - h.w / 2, h.y + h.h); pa.closePath();
        sh.holes.push(pa);
      });
      return sh;
    }

    // deur- en raamopening van de fabrikant, anders een redelijke standaard
    const deurB = u.deur ? Math.min(u.deur[0], Wk - 0.5)
                : m.deur === 'enkel' ? 0.90 : m.deur === 'glas' ? Math.min(1.90, Wk * 0.50) : Math.min(1.50, Wk * 0.42);
    const dh = u.deur ? u.deur[1] : (m.deur === 'glas' ? 1.98 : 1.85);
    const raamB = u.raam ? u.raam[0] : 0.685;
    const raamH = u.raam ? u.raam[1] : 0.882;
    const raamDorpel = Math.max(0.5, dh - raamH);                  // bovenkanten gelijk
    const nRamen = u.ramen === undefined ? m.ramen : u.ramen;
    // deur links van het midden, zoals op de tekening: 47,2 cm van de hoek
    const deurX = -Wk / 2 + Math.max(0.35, Wk * 0.126) + deurB / 2;
    const ruimteRechts = Wk / 2 - (deurX + deurB / 2);
    const raamX = deurX + deurB / 2 + ruimteRechts / 2;
    const raamX2 = -Wk / 2 - 0.001 + (deurX - deurB / 2 + Wk / 2) / 2;

    const gaten = [{ x: deurX, y: 0, w: deurB, h: dh }];
    if (nRamen >= 1 && ruimteRechts > raamB + 0.30) gaten.push({ x: raamX, y: raamDorpel, w: raamB, h: raamH });
    if (nRamen >= 2 && (deurX - deurB / 2 + Wk / 2) > raamB + 0.30) gaten.push({ x: raamX2, y: raamDorpel, w: raamB, h: raamH });

    offset(cx, 0, 0, () => {
      [-L / 2 + 0.12, 0, L / 2 - 0.12].forEach(z => box(Wk, 0.09, 0.09, beamMat2, 0, fy / 2, z));
      const vl = box(Wk, 0.03, L, floorMat, 0, fy, 0); vl.castShadow = false;

      // voorgevel met deur en ramen, achterwand dicht
      const front = wall(wallShape(Wk, hV - fy, gaten), t, woodMat);
      front.position.set(0, fy, L / 2 - t);
      const back = wall(wallShape(Wk, (zadel ? hV : hA) - fy, []), t, woodMat);
      back.position.set(0, fy, -L / 2);

      // zijwanden: trapezium bij een lessenaarsdak, rechthoek bij een zadeldak
      [1, -1].forEach(sg => {
        const sh = zadel ? wallShape(L, hV - fy, [])
                         : schuinShape(L, (sg > 0 ? hA : hV) - fy, (sg > 0 ? hV : hA) - fy, []);
        const w2 = wall(sh, t, woodMat);
        w2.rotation.y = sg * -Math.PI / 2;
        w2.position.set(sg * Wk / 2, fy, 0);
      });

      if (zadel) {
        const rise2 = top - 0.04 - eave;
        if (nokOverBreedte) {
          [-1, 1].forEach(sg => {
            const g = wall(gableShape(L, rise2), 0.022, woodMat);
            g.rotation.y = sg * Math.PI / 2;
            g.position.set(sg * Wk / 2, eave, 0);
          });
        } else {
          const g1 = wall(gableShape(Wk, rise2), 0.022, woodMat); g1.position.set(0, eave, -L / 2);
          const g2 = wall(gableShape(Wk, rise2), 0.022, woodMat); g2.position.set(0, eave, L / 2 - 0.022);
        }
      }

      /* deurvleugels, scharnierend, openen naar buiten */
      function vleugel(scharnierX, breedte, richting) {
        const pivot = new THREE.Group(); pivot.position.set(scharnierX, fy, L / 2 + 0.004); cur.add(pivot);
        const x0 = richting > 0 ? 0 : -breedte;
        const mid = x0 + breedte / 2;
        const ruit = m.deur === 'glas'
          ? { x: 0, y: dh * 0.46, w: breedte * 0.78, h: dh * 0.50 }
          : { x: 0, y: dh * 0.60, w: breedte * 0.56, h: 0.46 };
        const paneel = wall(wallShape(breedte, dh, [ruit]), 0.032, vwoodMat, pivot);
        paneel.position.set(mid, 0, -0.016);
        // glas net binnen het paneel, niet ervoor
        box(breedte * 0 + ruit.w, ruit.h, 0.006, glas, mid + ruit.x, ruit.y + ruit.h / 2, -0.002, pivot);
        if (m.deur !== 'glas') [dh * 0.20, dh * 0.80].forEach(hy => box(breedte * 0.70, 0.03, 0.008, iron, mid, hy, 0.006, pivot));
        const knop = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 12), iron);
        knop.rotation.z = Math.PI / 2;
        knop.position.set(richting > 0 ? breedte - 0.08 : -breedte + 0.08, dh * 0.48, 0.016); pivot.add(knop);
        hinges.push({ obj: pivot, open: -richting * 1.15, closed: 0 });
      }
      // scharnieren aan de buitenranden van de opening, vleugels draaien naar buiten open
      const enkelDeur = deurB < 1.15;    // uit de opgegeven deuropening
      if (enkelDeur) vleugel(deurX - deurB / 2, deurB, 1);
      else { vleugel(deurX - deurB / 2, deurB / 2, 1); vleugel(deurX + deurB / 2, deurB / 2, -1); }
      void m.deur;

      /* ramen in de voorgevel, kozijn met roeden en glas in het vlak */
      const raam = (rx) => {
        const g = new THREE.Group(); g.position.set(rx, fy + raamDorpel, L / 2 - t / 2); cur.add(g);
        const jt = 0.032;
        box(raamB, jt, 0.036, beamMat2, 0, 0, 0, g);
        box(raamB, jt, 0.036, beamMat2, 0, raamH, 0, g);
        [-1, 1].forEach(d => box(jt, raamH, 0.036, beamMat2, d * (raamB / 2 - jt / 2), raamH / 2, 0, g));
        box(raamB - jt * 2, raamH - jt * 2, 0.005, glas, 0, raamH / 2, 0, g);
        box(0.018, raamH - jt * 2, 0.018, beamMat2, 0, raamH / 2, 0.012, g);
        box(raamB - jt * 2, 0.018, 0.018, beamMat2, 0, raamH / 2, 0.012, g);
      };
      gaten.filter(h => h.y > 0.1).forEach(h => raam(h.x));
    });

    /* --- dak ---
       Bij een lessenaarsdak loopt één vlak over de berging en de luifel heen,
       zoals bij Kjeld, Lars en Finn. Bij een zadeldak staat de nok boven de
       berging en krijgt de luifel een eigen, lager afdak. */
    if (nokOverBreedte) {
      // één zadeldak over berging en luifel heen, nok evenwijdig aan de voorgevel
      gedraaid(() => gableRoof(L, Wt, eave, top, roofMaterial(), 0.24));
    } else if (zadel) {
      offset(cx, 0, 0, () => gableRoof(Wk, L, eave, top, roofMaterial(), 0.24));
    } else {
      // hoog aan de voorkant (+z), aflopend naar achteren; overstek 10 tot 20 cm
      leanRoof(Wt, L, eave, eave + rise, roofMaterial(), 0.14);
    }

    /* --- staanders en balk onder de luifel --- */
    if (lu > 0.4) {
      /* De staanders moeten het dak volgen. Bij een lessenaarsdak staat de
         voorste paal hoger dan de achterste, en de draagbalk ligt dus schuin.
         Eén rechte balk op eave-hoogte stak dwars door het dakvlak. */
      const lx = Wt / 2 - 0.10, lz = L / 2 - 0.12;
      const hVoorPaal = (zadel ? eave : hV) - 0.07;
      const hAchterPaal = (zadel ? eave : hA) - 0.07;
      box(0.09, hVoorPaal, 0.09, beamMat, lx, hVoorPaal / 2, lz);
      box(0.09, hAchterPaal, 0.09, beamMat, lx, hAchterPaal / 2, -lz);
      const dz = 2 * lz, dy = hVoorPaal - hAchterPaal;
      const balk = box(0.085, 0.11, Math.hypot(dz, dy), beamMat2, lx,
                       (hVoorPaal + hAchterPaal) / 2 + 0.055, 0);
      balk.rotation.x = -Math.atan2(dy, dz);
    }

    /* --- dakgoot als die is aangevinkt --- */
    if (s.toebehoren && s.toebehoren.goot) {
      const zink = new THREE.MeshStandardMaterial({ color: col('#9BA3A8'), roughness: .4, metalness: .5 });
      if (zadel && !nokOverBreedte) [Wt / 2 + 0.26, -Wt / 2 - 0.26].forEach(x => { const g = box(0.09, 0.09, L + 0.3, zink, x, eave - 0.06, 0); g.castShadow = false; });
      else if (zadel) [L / 2 + 0.26, -L / 2 - 0.26].forEach(z => { const g = box(Wt + 0.3, 0.09, 0.09, zink, 0, eave - 0.06, z); g.castShadow = false; });
      else { const g = box(Wt + 0.3, 0.09, 0.09, zink, 0, eave - 0.02, L / 2 + 0.2); g.castShadow = false; }
    }
  },

  decor() { },

  /* ---- maatlijnen ---- */
  dims(s) {
    const u = uitv(s), Wt = u.W || 3, L = diepte(s), lu = luifelBreedte(s);
    const H = PRODUCT.height(s);
    const cm = v => Math.round(v * 100) + ' cm';
    dimLine(new THREE.Vector3(-Wt / 2, 0.02, L / 2 + 0.7), new THREE.Vector3(Wt / 2, 0.02, L / 2 + 0.7), cm(Wt));
    dimLine(new THREE.Vector3(Wt / 2 + 0.7, 0.02, -L / 2), new THREE.Vector3(Wt / 2 + 0.7, 0.02, L / 2), cm(L));
    dimLine(new THREE.Vector3(-Wt / 2 - 0.6, 0, L / 2), new THREE.Vector3(-Wt / 2 - 0.6, H, L / 2), cm(H));
    if (lu > 0.4) dimLine(new THREE.Vector3(Wt / 2 - lu, 0.02, L / 2 + 0.3), new THREE.Vector3(Wt / 2, 0.02, L / 2 + 0.3), 'luifel ' + cm(lu));
  }
};
