/**
 * Badestellen-Info (#223): wie warm ist das Wasser am Platz, und wie steht
 * der Pegel? Zwei Quellen, beide frei und ohne Schlüssel:
 *
 * - Schweiz: die offenen Hydrodaten des BAFU über api.existenz.ch – rund 250
 *   Messstellen an Flüssen und Seen mit Temperatur, Abfluss und Pegel.
 * - Ausland (Meer und grosse Seen): die Marine-API von Open-Meteo, also
 *   dieselbe Familie wie die bestehende Wetter-Anbindung.
 *
 * Die Messstellen-Liste steht als gepflegter Datensatz HIER im Repo: sie
 * ändert sich über Jahre kaum, und so lässt sich die nächstgelegene Stelle
 * offline und testbar bestimmen, ohne für jede Anzeige erst ein Verzeichnis
 * herunterzuladen. Die Live-Werte kommen dann für genau diese Stelle.
 */
import { distanceMeters } from "./geo";

/**
 * Stand des Messstellen-Verzeichnisses (Abruf bei api.existenz.ch, die
 * Metadaten stammen vom BAFU). Beim Nachführen dieses Datums mitziehen.
 */
export const WATER_STATIONS_AS_OF = "2026-08-03";

/** Gewässerart einer Messstelle. */
export type WaterBodyType = "river" | "lake";

export interface WaterStation {
  /** BAFU-Stationsnummer (Schlüssel der Abfrage) */
  id: string;
  /** Name der Messstelle, z. B. «Bern, Schönau» */
  name: string;
  /** Gewässer, z. B. «Aare» oder «Zürichsee» */
  waterBody: string;
  type: WaterBodyType;
  latitude: number;
  longitude: number;
  /**
   * Lieferte die Stelle beim Erstellen des Datensatzes eine Wassertemperatur?
   * Nicht jede Messstelle misst sie – für die Badestellen-Info ist das aber
   * der interessante Wert, also wird danach vorsortiert.
   */
  measuresTemperature: boolean;
}

/**
 * Rohtabelle der Messstellen als Tupel
 * `[id, Name, Gewässer, Art ("r" = Fluss, "l" = See), Breite, Länge,
 * misst Temperatur (1/0)]` – kompakt, weil es rund 250 Zeilen sind.
 */
const RAW_STATIONS: [
  string,
  string,
  string,
  "r" | "l",
  number,
  number,
  0 | 1,
][] = [
  ["2004", "Murten", "Murtensee", "l", 46.9308, 7.1169, 0],
  ["2007", "Le Pont", "Lac de Joux", "l", 46.6653, 6.324, 0],
  ["2009", "Porte du Scex", "Rhône", "r", 46.3496, 6.8886, 1],
  ["2011", "Sion", "Rhône", "r", 46.2191, 7.3579, 0],
  ["2014", "Schmerikon", "Zürichsee", "l", 47.2248, 8.9401, 0],
  ["2016", "Brugg", "Aare", "r", 47.4825, 8.1949, 1],
  ["2017", "Zug", "Zugersee", "l", 47.1679, 8.5143, 0],
  ["2018", "Mellingen", "Reuss", "r", 47.421, 8.2713, 1],
  ["2019", "Brienzwiler", "Aare", "r", 46.7457, 8.092, 1],
  ["2020", "Bellinzona", "Ticino", "r", 46.1938, 9.0093, 0],
  ["2021", "Ponte Tresa", "Lago di Lugano", "l", 45.9688, 8.8603, 0],
  ["2022", "Locarno", "Lago Maggiore", "l", 46.1636, 8.8043, 0],
  ["2023", "Ringgenberg", "Brienzersee", "l", 46.7299, 7.9755, 0],
  ["2024", "Branson", "Rhône", "r", 46.1257, 7.0913, 0],
  ["2025", "Brunnen", "Vierwaldstättersee", "l", 46.9935, 8.6038, 0],
  ["2026", "Chillon", "Lac Léman", "l", 46.4146, 6.9277, 0],
  ["2027", "St-Prex", "Lac Léman", "l", 46.4828, 6.4611, 0],
  ["2028", "Genève, Sécheron", "Lac Léman", "l", 46.2186, 6.1524, 0],
  ["2029", "Brügg, Aegerten", "Aare", "r", 47.1221, 7.2834, 1],
  ["2030", "Thun", "Aare", "r", 46.7646, 7.6118, 1],
  ["2031", "Unterägeri", "Aegerisee", "l", 47.138, 8.5918, 0],
  ["2032", "Romanshorn", "Bodensee, Obersee", "l", 47.5648, 9.381, 0],
  ["2033", "Ilanz", "Vorderrhein", "r", 46.7758, 9.2064, 1],
  ["2034", "Payerne, Caserne d'aviation", "Broye", "r", 46.8359, 6.9361, 1],
  ["2041", "Oberriet, Blatten", "Rhein", "r", 47.3069, 9.5708, 0],
  ["2043", "Berlingen", "Bodensee, Untersee", "l", 47.6755, 9.0176, 0],
  ["2044", "Andelfingen", "Thur", "r", 47.5965, 8.682, 1],
  ["2053", "Martigny, Pont de Rossettan", "Drance", "r", 46.0977, 7.0627, 0],
  ["2056", "Seedorf", "Reuss", "r", 46.8839, 8.6206, 1],
  ["2057", "Les Brenets", "Lac des Brenets", "l", 47.0826, 6.7086, 0],
  ["2063", "Murgenthal", "Aare", "r", 47.2661, 7.8288, 0],
  ["2066", "St. Moritz", "St. Moritzersee", "l", 46.4975, 9.8481, 0],
  ["2067", "Martina", "Inn", "r", 46.8858, 10.4654, 0],
  ["2068", "Riazzino", "Ticino", "r", 46.1634, 8.9103, 1],
  ["2070", "Emmenmatt", "Emme", "r", 46.9544, 7.7488, 1],
  ["2071", "Emmenmatt (N)", "Emme", "r", 46.9536, 7.7516, 0],
  ["2072", "Sils Baselgia", "Silsersee", "l", 46.4344, 9.7532, 0],
  ["2073", "Silvaplana", "Silvaplanersee", "l", 46.4601, 9.8024, 0],
  ["2074", "Brissago", "Lago Maggiore", "l", 46.1181, 8.7109, 0],
  ["2078", "Le Prese", "Poschiavino", "r", 46.2954, 10.08, 0],
  ["2079", "Le Prese", "Canale industriale", "r", 46.2947, 10.0795, 0],
  ["2081", "Pfäffikon", "Pfäffikersee", "l", 47.364, 8.7786, 0],
  ["2082", "Greifensee", "Greifensee", "l", 47.3652, 8.6735, 0],
  ["2084", "Ingenbohl", "Muota", "r", 47.0004, 8.5987, 1],
  ["2085", "Hagneck", "Aare", "r", 47.0556, 7.1844, 1],
  ["2086", "Loderio", "Brenno", "r", 46.3765, 8.9694, 0],
  ["2087", "Andermatt", "Reuss", "r", 46.6423, 8.5896, 0],
  ["2088", "Sarnen", "Sarnersee", "l", 46.8877, 8.2424, 0],
  ["2091", "Rheinfelden", "Rhein", "r", 47.5607, 7.7999, 1],
  ["2093", "Spiez", "Thunersee", "l", 46.6967, 7.6646, 0],
  ["2097", "Meisterschwanden", "Hallwilersee", "l", 47.2958, 8.2203, 0],
  ["2099", "Zürich Unterhard", "Limmat", "r", 47.3906, 8.5254, 0],
  ["2101", "Melide, Ferrera", "Lago di Lugano", "l", 45.9663, 8.9489, 0],
  ["2102", "Sarnen", "Sarner Aa", "r", 46.8962, 8.2452, 0],
  ["2104", "Weesen, Biäsche", "Linth", "r", 47.1316, 9.0884, 1],
  ["2105", "St. Moritzbad", "Inn", "r", 46.4847, 9.8341, 0],
  ["2106", "Münchenstein, Hofmatt", "Birs", "r", 47.5183, 7.6188, 1],
  ["2109", "Gsteig", "Lütschine", "r", 46.6642, 7.8715, 1],
  ["2110", "Mühlau, Hünenberg", "Reuss", "r", 47.2223, 8.3961, 0],
  ["2112", "Appenzell", "Sitter", "r", 47.332, 9.4106, 1],
  ["2113", "Klingnau", "Aare", "r", 47.5941, 8.2251, 1],
  ["2116", "Koblenz", "Rhein", "r", 47.609, 8.2343, 0],
  ["2117", "Le Châble, Villette", "Drance de Bagnes", "r", 46.0807, 7.2131, 0],
  ["2118", "Murg", "Walensee", "l", 47.1134, 9.21, 0],
  ["2119", "Fribourg", "Sarine", "r", 46.8039, 7.169, 0],
  ["2122", "Moutier, La Charrue", "Birse", "r", 47.284, 7.3823, 0],
  ["2125", "Frauenthal", "Lorze", "r", 47.2153, 8.425, 0],
  ["2126", "Wängi", "Murg", "r", 47.4963, 8.953, 1],
  ["2130", "Laufenburg", "Rhein (Oberwasser)", "r", 47.5558, 8.0498, 1],
  ["2132", "Neftenbach", "Töss", "r", 47.5188, 8.653, 0],
  ["2135", "Bern, Schönau", "Aare", "r", 46.9331, 7.448, 1],
  ["2137", "Gelfingen", "Baldeggersee", "l", 47.2099, 8.2664, 0],
  ["2139", "St.Margrethen", "Rheintaler Binnenkanal", "r", 47.4496, 9.6553, 1],
  ["2141", "Tiefencastel", "Albula", "r", 46.6625, 9.5741, 0],
  ["2143", "Rekingen", "Rhein", "r", 47.5703, 8.3298, 1],
  ["2150", "Felsenbach", "Landquart", "r", 46.9746, 9.6121, 1],
  ["2151", "Oberwil", "Simme", "r", 46.655, 7.4394, 0],
  ["2152", "Luzern, Geissmattbrücke", "Reuss", "r", 47.054, 8.2985, 1],
  ["2154", "Grandson", "Lac de Neuchâtel", "l", 46.8058, 6.6424, 0],
  ["2155", "Wiler, Limpachmündung", "Emme", "r", 47.1601, 7.547, 0],
  ["2156", "Gerlafingen", "Werkkanal", "r", 47.1638, 7.5543, 0],
  ["2157", "Gerlafingen", "Strackbach", "r", 47.1606, 7.5609, 0],
  ["2159", "Belp, Mülimatt", "Gürbe", "r", 46.8852, 7.5017, 1],
  ["2160", "Broc, Château d'en bas", "Sarine", "r", 46.6028, 7.093, 0],
  ["2161", "Blatten bei Naters", "Massa", "r", 46.3856, 8.0067, 1],
  ["2167", "Ponte Tresa, Rocchetta", "Tresa", "r", 45.972, 8.8524, 1],
  ["2168", "Sempach", "Sempachersee", "l", 47.1343, 8.1892, 0],
  ["2170", "Genève, Bout du Monde", "Arve", "r", 46.1803, 6.1593, 1],
  ["2174", "Chancy, Aux Ripes", "Rhône", "r", 46.153, 5.9707, 1],
  ["2176", "Zürich", "Sihl", "r", 47.3677, 8.5262, 1],
  ["2179", "Thörishaus, Sensematt", "Sense", "r", 46.8883, 7.3514, 1],
  ["2181", "Halden", "Thur", "r", 47.5058, 9.2115, 1],
  ["2185", "Chur", "Plessur", "r", 46.8597, 9.5105, 0],
  ["2187", "Salez", "Werdenberger Binnenkanal", "r", 47.2383, 9.5096, 0],
  ["2199", "Basel", "Wiese", "r", 47.5779, 7.5955, 0],
  ["2200", "Zweilütschinen", "Weisse Lütschine", "r", 46.6313, 7.8997, 0],
  ["2202", "Liestal", "Ergolz", "r", 47.4881, 7.7341, 0],
  ["2203", "Aigle", "Grande Eau", "r", 46.3189, 6.9709, 0],
  ["2205", "Untersiggenthal, Stilli", "Aare", "r", 47.5159, 8.2347, 0],
  ["2206", "Melera, (Valle Morobbia)", "Melera", "r", 46.1715, 9.083, 0],
  ["2207", "Luzern", "Vierwaldstättersee", "l", 47.0549, 8.3198, 0],
  ["2208", "Ligerz, Klein Twann", "Bielersee", "l", 47.0917, 7.1531, 0],
  ["2209", "Zürich", "Zürichsee", "l", 47.3548, 8.5505, 0],
  ["2210", "Ocourt", "Doubs", "r", 47.3504, 7.0751, 1],
  ["2215", "Laupen", "Saane", "r", 46.9086, 7.2344, 0],
  ["2217", "Chancy, Vers Vaux", "Rhône", "r", 46.1321, 5.9563, 0],
  ["2219", "Oberried/Lenk", "Simme", "r", 46.4263, 7.4729, 0],
  ["2232", "Adelboden", "Allenbach", "r", 46.486, 7.5521, 1],
  ["2239", "Punt dal Gall", "Spöl", "r", 46.6292, 10.1947, 0],
  ["2243", "Baden, Limmatpromenade", "Limmat", "r", 47.4757, 8.3094, 1],
  ["2244", "Klusmatten", "Krummbach", "r", 46.2248, 8.0154, 0],
  ["2247", "Les Brenets", "Doubs", "r", 47.0844, 6.7103, 0],
  ["2251", "Plaffeien, Schwyberg", "Rotenbach", "r", 46.6864, 7.2816, 0],
  ["2252", "Plaffeien, Schwyberg", "Schwändlibach", "r", 46.6903, 7.2863, 0],
  ["2256", "Pontresina", "Rosegbach", "r", 46.4899, 9.8981, 1],
  ["2262", "Pontresina", "Berninabach", "r", 46.4864, 9.9062, 0],
  ["2263", "La Punt-Chamues-ch", "Chamuerabach", "r", 46.5693, 9.9359, 0],
  ["2265", "Tarasp", "Inn", "r", 46.789, 10.2786, 1],
  ["2268", "Gletsch", "Rhône", "r", 46.5623, 8.3621, 0],
  ["2269", "Blatten", "Lonza", "r", 46.4189, 7.8175, 0],
  ["2270", "Combe des Sarrasins", "Doubs", "r", 47.1951, 6.878, 0],
  ["2276", "Isenthal", "Grosstalbach", "r", 46.9101, 8.561, 1],
  ["2282", "Wasen, Kurzeneialp", "Sperbelgraben", "r", 47.0158, 7.8427, 1],
  ["2283", "Wasen, Riedbad", "Rappengraben", "r", 47.0163, 7.8903, 0],
  ["2288", "Neuhausen, Flurlingerbrücke", "Rhein", "r", 47.6815, 8.6263, 1],
  ["2289", "Basel, Rheinhalle", "Rhein", "r", 47.5594, 7.6167, 0],
  ["2290", "St-Sulpice", "Areuse", "r", 46.9106, 6.5589, 1],
  ["2300", "Euthal, Rüti", "Minster", "r", 47.0806, 8.8138, 0],
  ["2303", "Jonschwil, Mühlau", "Thur", "r", 47.4137, 9.0775, 0],
  ["2304", "Zernez, Punt la Drossa", "Ova dal Fuorn", "r", 46.6551, 10.19, 0],
  ["2305", "Herisau, Zellersmühle", "Glatt", "r", 47.3981, 9.2571, 0],
  ["2307", "Sonceboz", "Suze", "r", 47.1968, 7.1722, 1],
  ["2308", "Goldach, Bleiche", "Goldach", "r", 47.4873, 9.4715, 1],
  ["2312", "Salmsach, Hungerbühl", "Aach", "r", 47.5504, 9.3572, 0],
  ["2319", "Zernez", "Ova da Cluozza", "r", 46.6932, 10.1183, 0],
  ["2321", "Pregassona", "Cassarate", "r", 46.0177, 8.9625, 0],
  ["2327", "Davos, Kriegsmatte", "Dischmabach", "r", 46.7755, 9.8773, 1],
  [
    "2329",
    "San Giacomo di Fraéle",
    "Derivazione Spöl",
    "r",
    46.5489,
    10.2503,
    0,
  ],
  ["2342", "Brig", "Saltina", "r", 46.3167, 7.9868, 0],
  ["2343", "Huttwil, Häberenbad", "Langeten", "r", 47.1225, 7.8282, 1],
  ["2346", "Brig", "Rhône", "r", 46.3174, 7.9754, 0],
  [
    "2347",
    "Roveredo, Bacino di compenso",
    "Riale di Roggiasca",
    "r",
    46.2016,
    9.1689,
    1,
  ],
  ["2349", "Chiasso, Ponte di Polenta", "Breggia", "r", 45.8455, 9.0131, 0],
  ["2351", "Visp", "Vispa", "r", 46.2742, 7.8817, 1],
  ["2352", "Linthal, Ausgleichsbecken KLL", "Linth", "r", 46.9164, 8.9915, 0],
  [
    "2353",
    "Linthal, Wasserrückgabe KLL",
    "Betriebswasser KLL",
    "r",
    46.9172,
    8.9925,
    0,
  ],
  ["2355", "Davos, Frauenkirch", "Landwasser", "r", 46.7578, 9.7903, 0],
  ["2356", "Cavergno, Pontit", "Riale di Calneggia", "r", 46.3696, 8.5429, 1],
  ["2364", "Piotta", "Ticino", "r", 46.5167, 8.6715, 0],
  ["2366", "La Rösa", "Poschiavino", "r", 46.399, 10.0672, 1],
  ["2368", "Locarno, Solduno", "Maggia", "r", 46.1683, 8.7736, 0],
  ["2369", "Yvonand", "Menthue", "r", 46.7768, 6.7242, 1],
  ["2370", "Le Noirmont, La Goule", "Doubs", "r", 47.2292, 6.9293, 0],
  ["2371", "Le Chenit, Frontière", "Orbe", "r", 46.5508, 6.1535, 0],
  ["2372", "Mollis, Linthbrücke", "Linth", "r", 47.1011, 9.072, 1],
  ["2374", "Mogelsberg, Aachsäge", "Necker", "r", 47.3642, 9.1214, 1],
  ["2378", "Orbe, Le Chalet", "Orbe", "r", 46.7276, 6.5239, 0],
  ["2384", "Simplonpass", "Bisse kalte Wasser", "r", 46.2459, 8.0361, 0],
  ["2386", "Frauenfeld", "Murg", "r", 47.5687, 8.8944, 1],
  ["2387", "Fürstenau", "Hinterrhein", "r", 46.7151, 9.4473, 0],
  ["2392", "Rheinau", "Rhein (Oberwasser)", "r", 47.6391, 8.6019, 1],
  ["2403", "Cinuos - Chel", "Inn", "r", 46.6355, 10.0209, 0],
  ["2404", "Cinuos-chel, Val Torta", "Innabl. EKW", "r", 46.6431, 10.0321, 0],
  ["2409", "Eggiwil, Heidbüel", "Emme", "r", 46.8712, 7.8047, 0],
  ["2410", "Ruggell", "Liechtensteiner Binnenkanal", "r", 47.2434, 9.5225, 1],
  ["2412", "Vuippens, Château", "Sionge", "r", 46.6585, 7.0783, 0],
  ["2414", "Mosnang, Rietholz", "Rietholzbach", "r", 47.3761, 9.0123, 1],
  ["2415", "Rheinsfelden", "Glatt", "r", 47.5735, 8.4758, 1],
  ["2416", "Hitzkirch, Richensee", "Aabach", "r", 47.2201, 8.2491, 0],
  ["2417", "Oberkirch", "Suhre", "r", 47.1572, 8.1154, 0],
  ["2418", "Tiefencastel", "Julia", "r", 46.6604, 9.576, 0],
  ["2419", "Reckingen", "Rhône", "r", 46.4695, 8.2447, 0],
  ["2420", "Lumino, Sassello", "Moesa", "r", 46.2231, 9.0558, 0],
  ["2426", "Mels", "Seez", "r", 47.0465, 9.4182, 0],
  ["2430", "Sumvitg, Encardens", "Rein da Sumvitg", "r", 46.6499, 8.9907, 0],
  ["2432", "Ecublens, Les Bois", "Venoge", "r", 46.5353, 6.5527, 1],
  ["2433", "Allaman, Le Coulet", "Aubonne", "r", 46.4733, 6.4064, 1],
  ["2434", "Olten, Hammermühle", "Dünnern", "r", 47.3503, 7.893, 1],
  ["2436", "Alpnach, Chilch Erli", "Chli Schliere", "r", 46.9441, 8.2766, 0],
  ["2437", "Ecublens, Eschiens", "Parimbot", "r", 46.6044, 6.8129, 0],
  ["2446", "Gampelen, Zihlbrücke", "Zihlkanal", "r", 47.0211, 7.0342, 0],
  ["2447", "Sugiez", "Canal de la Broye", "r", 46.9637, 7.1146, 0],
  ["2450", "Zofingen", "Wigger", "r", 47.2835, 7.9354, 0],
  ["2457", "Ringgenberg, Goldswil", "Aare", "r", 46.694, 7.8796, 1],
  ["2458", "Valangin", "Seyon", "r", 47.0111, 6.9043, 0],
  ["2461", "Magliaso, Ponte", "Magliasina", "r", 45.982, 8.879, 0],
  ["2462", "S-Chanf", "Inn", "r", 46.6157, 9.9952, 1],
  ["2467", "Gümmenen", "Saane", "r", 46.9441, 7.2429, 1],
  ["2468", "St. Gallen, Bruggen/Au", "Sitter", "r", 47.4144, 9.3275, 0],
  ["2469", "Hondrich", "Kander", "r", 46.6666, 7.6711, 0],
  ["2471", "Murgenthal, Walliswil", "Murg", "r", 47.2523, 7.8262, 0],
  ["2473", "Diepoldsau, Rietbrücke", "Rhein", "r", 47.3831, 9.6409, 1],
  ["2474", "Buseno", "Calancasca", "r", 46.2836, 9.1182, 0],
  ["2475", "Bignasco, Ponte nuovo", "Maggia", "r", 46.3383, 8.6081, 0],
  ["2477", "Zug, Letzi", "Lorze", "r", 47.1807, 8.502, 0],
  ["2478", "Soyhières, Bois du Treuil", "Birse", "r", 47.3924, 7.396, 0],
  ["2480", "Boudry", "Areuse", "r", 46.949, 6.839, 0],
  ["2481", "Buochs, Flugplatz", "Engelberger Aa", "r", 46.9728, 8.4053, 1],
  ["2484", "Lauerz, Chlostermatt", "Lauerzersee", "l", 47.031, 8.5966, 0],
  ["2485", "Boncourt, Frontière", "Allaine", "r", 47.5008, 7.0117, 1],
  ["2486", "Vevey, Coppet", "Veveyse", "r", 46.4689, 6.8485, 0],
  [
    "2487",
    "Werthenstein, Chappelboden",
    "Kleine Emme",
    "r",
    47.0349,
    8.0684,
    0,
  ],
  ["2488", "Latterbach", "Simme", "r", 46.6617, 7.5782, 0],
  ["2490", "Dardagny, Les Granges", "Allondon", "r", 46.2174, 5.9985, 0],
  ["2491", "Bürglen, Galgenwäldli", "Schächen", "r", 46.8709, 8.6517, 0],
  [
    "2492",
    "Buerglen, EW Altdorf",
    "Dorfbachableitung",
    "r",
    46.8758,
    8.6592,
    0,
  ],
  ["2493", "Gland, Route Suisse", "Promenthouse", "r", 46.406, 6.2693, 1],
  ["2494", "Pollegio, Campagna", "Ticino", "r", 46.3593, 8.9475, 0],
  ["2497", "Nebikon", "Luthern", "r", 47.1904, 7.9738, 0],
  ["2498", "Castrisch", "Glenner", "r", 46.7735, 9.2106, 0],
  ["2499", "Muotathal", "Schlichenden Brünnen", "r", 46.9731, 8.7843, 1],
  ["2500", "Ittigen", "Worble", "r", 46.9732, 7.4781, 1],
  ["2602", "Domat/Ems", "Rhein", "r", 46.8377, 9.4561, 0],
  ["2603", "Langnau", "Ilfis", "r", 46.9379, 7.7974, 0],
  ["2604", "Biberbrugg", "Biber", "r", 47.1533, 8.7209, 1],
  ["2605", "Lavertezzo, Campiöi", "Verzasca", "r", 46.249, 8.8446, 0],
  ["2606", "Genève, Halle de l'Île", "Rhône", "r", 46.2047, 6.1415, 1],
  ["2607", "Oberwald", "Goneri", "r", 46.532, 8.3578, 0],
  ["2608", "Neuenkirch", "Sellenbodenbach", "r", 47.113, 8.2098, 1],
  ["2609", "Einsiedeln", "Alp", "r", 47.1508, 8.7393, 1],
  ["2610", "Vicques", "Scheulte", "r", 47.3482, 7.4318, 0],
  ["2612", "Lavertezzo", "Riale di Pincascia", "r", 46.2583, 8.8401, 1],
  ["2613", "Weil, Palmrainbrücke", "Rhein", "r", 47.6014, 7.5947, 1],
  ["2615", "Basel LHG", "Rhein", "r", 47.5617, 7.5867, 0],
  ["2617", "Müstair", "Rom", "r", 46.6296, 10.4532, 1],
  ["2620", "Soglio", "Mera", "r", 46.3332, 9.5268, 0],
  ["2623", "Oberwald", "Rhône", "r", 46.5344, 8.3494, 1],
  ["2629", "Agno", "Vedeggio", "r", 46.003, 8.9117, 0],
  ["2630", "Sion", "Sionne", "r", 46.2305, 7.366, 0],
  ["2631", "Hinterrhein, Schiessplatz", "Hinterrhein", "r", 46.5234, 9.1813, 0],
  ["2632", "Mühlbach. Trennbauwerk Sand", "Mühlbach", "r", 46.8453, 9.5373, 0],
  ["2634", "Emmen", "Kleine Emme", "r", 47.072, 8.2753, 1],
  ["2635", "Einsiedeln, Gross", "Grossbach", "r", 47.1065, 8.7655, 1],
  ["2636", "Muotathal, Hölloch", "Hölloch", "r", 46.9764, 8.7884, 0],
  ["2639", "Martina, Sclamischot", "Inn", "r", 46.8704, 10.4461, 0],
  ["2640", "Delémont", "Sorne", "r", 47.3643, 7.351, 0],
  ["2642", "Neuchâtel, Nid-du-Crô", "Lac de Neuchâtel", "l", 46.9965, 6.951, 0],
  ["2643", "Montlingen", "Rhein", "r", 47.3337, 9.5947, 0],
  ["2646", "Emdthal, Heustrich", "Kander", "r", 46.6525, 7.6828, 0],
  ["2650", "Chur", "Untertorer Mühlbach", "r", 46.8473, 9.5356, 0],
  ["4601", "Buch", "Biber", "r", 47.7151, 8.7924, 0],
  ["520", "Rämismühle", "Töss", "r", 47.443, 8.8148, 1],
  ["9020", "Bellinzona", "Ticino", "r", 46.1938, 9.0093, 0],
  ["9632", "Chur", "Untertorer Mühlbach", "r", 46.8473, 9.5356, 0],
  ["A270", "Combe des Sarrasins", "Doubs", "r", 47.1955, 6.8782, 0],
  ["C384", "Simplonpass", "Bisse kalte Wasser", "r", 46.2459, 8.0361, 0],
];

/** Alle Messstellen der offenen Schweizer Hydrodaten. */
export const waterStations: WaterStation[] = RAW_STATIONS.map(
  ([id, name, waterBody, type, latitude, longitude, measuresTemperature]) => ({
    id,
    name,
    waterBody,
    type: type === "l" ? "lake" : "river",
    latitude,
    longitude,
    measuresTemperature: measuresTemperature === 1,
  })
);

/**
 * Umkreis, in dem eine Messstelle noch etwas über das Wasser am Platz sagt.
 * Weiter weg misst man ein anderes Gewässer oder eine andere Höhenstufe –
 * dann lieber nichts anzeigen als etwas Falsches.
 */
export const MAX_STATION_DISTANCE_M = 25000;

export interface NearestStation {
  station: WaterStation;
  /** Luftlinie vom Ort zur Messstelle in Metern */
  distanceM: number;
}

/**
 * Nächstgelegene Messstelle zu einem Ort. Vorrang haben Stellen, die eine
 * Wassertemperatur liefern – darum geht es bei der Badestellen-Info; eine
 * reine Pegel-Stelle kommt nur zum Zug, wenn im Umkreis gar keine
 * Temperatur-Stelle liegt. Ausserhalb von `maxDistanceM` gibt es null.
 *
 * Die Distanz kommt aus dem vorhandenen `distanceMeters` (shared/geo.ts),
 * damit im Projekt nur EINE Haversine-Formel steht.
 */
export function nearestWaterStation(
  latitude: number,
  longitude: number,
  options: {
    stations?: WaterStation[];
    maxDistanceM?: number;
    /** Nur Stellen mit Wassertemperatur zulassen (Voreinstellung: bevorzugen) */
    requireTemperature?: boolean;
  } = {}
): NearestStation | null {
  const stations = options.stations ?? waterStations;
  const maxDistanceM = options.maxDistanceM ?? MAX_STATION_DISTANCE_M;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  let withTemperature: NearestStation | null = null;
  let anyStation: NearestStation | null = null;
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    const distanceM = distanceMeters(
      latitude,
      longitude,
      station.latitude,
      station.longitude
    );
    if (distanceM > maxDistanceM) continue;
    const candidate = { station, distanceM };
    if (anyStation === null || distanceM < anyStation.distanceM) {
      anyStation = candidate;
    }
    if (
      station.measuresTemperature &&
      (withTemperature === null || distanceM < withTemperature.distanceM)
    ) {
      withTemperature = candidate;
    }
  }
  if (options.requireTemperature) return withTemperature;
  return withTemperature ?? anyStation;
}

/** Ein Messwert einer Stelle mit seinem Zeitpunkt. */
export interface WaterReading {
  /** Wassertemperatur in °C (null = misst die Stelle nicht) */
  temperatureC: number | null;
  /** Abfluss in m³/s (null = misst die Stelle nicht) */
  flowM3s: number | null;
  /**
   * Pegel in Metern über Meer (null = misst die Stelle nicht). Die offenen
   * Hydrodaten nennen ihn `height` – das ähnlich heissende `height_abs`
   * liefern nur eine Handvoll Stellen und es sind Relativwerte um 0.
   */
  levelMasl: number | null;
  /** Zeitpunkt der jüngsten Messung in ms seit Epoch (null = keine Messung) */
  measuredAtMs: number | null;
}

const EMPTY_READING: WaterReading = {
  temperatureC: null,
  flowM3s: null,
  levelMasl: null,
  measuredAtMs: null,
};

/** Abfrage-URL der offenen Hydrodaten für genau eine Messstelle. */
export function hydroLatestUrl(stationId: string): string {
  const params = new URLSearchParams({
    locations: stationId,
    parameters: "temperature,flow,height",
    app: "CampMesser",
    version: "1.0",
  });
  return `https://api.existenz.ch/apiv1/hydro/latest?${params.toString()}`;
}

/**
 * Antwort der Hydrodaten lesen: `payload` ist eine flache Liste von
 * `{timestamp, loc, par, val}`. Unbekannte Parameter werden ignoriert, der
 * Zeitpunkt ist der JÜNGSTE der übernommenen Werte (Temperatur und Abfluss
 * kommen im selben Takt, aber nicht garantiert mit derselben Sekunde).
 */
export function parseHydroLatest(
  json: unknown,
  stationId: string
): WaterReading {
  if (!json || typeof json !== "object") return EMPTY_READING;
  const payload = (json as { payload?: unknown }).payload;
  if (!Array.isArray(payload)) return EMPTY_READING;
  const reading: WaterReading = { ...EMPTY_READING };
  for (let i = 0; i < payload.length; i++) {
    const entry = payload[i];
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.loc !== "string" || e.loc !== stationId) continue;
    const value = e.val;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (e.par === "temperature") reading.temperatureC = value;
    else if (e.par === "flow") reading.flowM3s = value;
    else if (e.par === "height") reading.levelMasl = value;
    else continue;
    const seconds = e.timestamp;
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) continue;
    const ms = seconds * 1000;
    if (reading.measuredAtMs === null || ms > reading.measuredAtMs) {
      reading.measuredAtMs = ms;
    }
  }
  return reading;
}

/** Zeitabstand, über den der Trend gebildet wird. */
export const TREND_WINDOW_HOURS = 6;

/**
 * Kleinster Unterschied, der als Trend zählt. Darunter ist es Messrauschen –
 * «steigend» wegen 0.1 °C zu behaupten wäre eine Scheingenauigkeit.
 */
export const TREND_THRESHOLD_C = 0.3;

/**
 * Abfrage-URL der Meerwasser-Temperatur bei Open-Meteo (Marine-API) – für
 * Plätze am Meer ausserhalb der Schweiz. Geholt werden der aktuelle Wert
 * und die letzten Stunden, damit sich daraus ein Trend ablesen lässt.
 */
export function marineWaterUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    // Wellen (#451) gleich mitholen – ein zweiter Abruf wäre Verschwendung
    current: "sea_surface_temperature,wave_height,wave_direction",
    hourly: "sea_surface_temperature",
    past_days: "1",
    forecast_days: "1",
  });
  return `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;
}

/** Wassertemperatur am Meer: aktueller Wert plus die Stunde davor als Trend. */
export interface MarineWater {
  temperatureC: number;
  measuredAtMs: number;
  /** Wert sechs Stunden früher (null = nicht vorhanden) */
  previousC: number | null;
  /** Signifikante Wellenhöhe in Metern (#451); null = nicht vorhanden */
  waveHeightM: number | null;
  /** Richtung, AUS der die Wellen kommen (Grad); null = nicht vorhanden */
  waveDirectionDeg: number | null;
}

/**
 * Antwort der Marine-API lesen. Über Land liefert Open-Meteo lauter null –
 * dann gibt es hier null, und die Anzeige bleibt weg.
 */
export function parseMarineWater(json: unknown): MarineWater | null {
  if (!json || typeof json !== "object") return null;
  const data = json as {
    current?: {
      time?: unknown;
      sea_surface_temperature?: unknown;
      wave_height?: unknown;
      wave_direction?: unknown;
    };
    hourly?: { time?: unknown; sea_surface_temperature?: unknown };
  };
  const current = data.current;
  if (!current) return null;
  const temperatureC = current.sea_surface_temperature;
  if (typeof temperatureC !== "number" || !Number.isFinite(temperatureC)) {
    return null;
  }
  const measuredAtMs =
    typeof current.time === "string" ? Date.parse(`${current.time}Z`) : NaN;
  if (Number.isNaN(measuredAtMs)) return null;

  let previousC: number | null = null;
  const times = data.hourly?.time;
  const values = data.hourly?.sea_surface_temperature;
  if (Array.isArray(times) && Array.isArray(values)) {
    const targetMs = measuredAtMs - TREND_WINDOW_HOURS * 3600000;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < times.length && i < values.length; i++) {
      const value = values[i];
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      const time = times[i];
      if (typeof time !== "string") continue;
      const ms = Date.parse(`${time}Z`);
      if (Number.isNaN(ms)) continue;
      const diff = Math.abs(ms - targetMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        previousC = value;
      }
    }
  }
  // Wellen (#451): fehlende oder kaputte Werte bleiben ehrlich null
  const rawWave = current.wave_height;
  const waveHeightM =
    typeof rawWave === "number" && Number.isFinite(rawWave) && rawWave >= 0
      ? rawWave
      : null;
  const rawDirection = current.wave_direction;
  const waveDirectionDeg =
    waveHeightM !== null &&
    typeof rawDirection === "number" &&
    Number.isFinite(rawDirection)
      ? ((rawDirection % 360) + 360) % 360
      : null;

  return {
    temperatureC,
    measuredAtMs,
    previousC,
    waveHeightM,
    waveDirectionDeg,
  };
}

/**
 * Wellen-Einstufung (#451) fürs Baden – angelehnt an die Douglas-Skala:
 * unter einem halben Meter ruhig, bis 1.25 m mässig (See-Stärke «slight»),
 * darüber ist Baden mit Kindern kein Vergnügen mehr.
 */
export type WaveLevel = "calm" | "moderate" | "rough";

export function waveLevel(heightM: number): WaveLevel {
  if (heightM < 0.5) return "calm";
  if (heightM < 1.25) return "moderate";
  return "rough";
}

/**
 * Trend der Wassertemperatur. «unknown» ist bewusst ein eigener Fall und
 * nicht heimlich «gleichbleibend»: ohne Vergleichswert weiss niemand, wohin
 * es geht, und die Anzeige lässt den Trend dann einfach weg.
 */
export type WaterTrend = "rising" | "steady" | "falling" | "unknown";

/**
 * Trend aus zwei Messwerten: der jüngere gegen den älteren. Ohne
 * brauchbaren Vergleichswert bleibt es bei «unknown».
 */
export function waterTrend(
  currentC: number,
  previousC: number | null,
  thresholdC: number = TREND_THRESHOLD_C
): WaterTrend {
  if (previousC === null || !Number.isFinite(previousC)) return "unknown";
  const delta = currentC - previousC;
  if (delta >= thresholdC) return "rising";
  if (delta <= -thresholdC) return "falling";
  return "steady";
}

/**
 * Badetauglichkeit als grobe Einordnung – bewusst nur vier Stufen und
 * bewusst KEINE Empfehlung: wie kalt zu kalt ist, weiss jede Person selbst
 * am besten.
 */
export type BathingComfort = "cold" | "brisk" | "pleasant" | "warm";

export function bathingComfort(temperatureC: number): BathingComfort {
  if (temperatureC < 15) return "cold";
  if (temperatureC < 19) return "brisk";
  if (temperatureC < 23) return "pleasant";
  return "warm";
}
