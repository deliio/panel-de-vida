'use strict';
/* =========================================================
   PANEL DE VIDA · health.js
   Tus rutinas, tu calendario de entrenos (lo que tú apuntas),
   dolor de rodillas y comidas caseras con calorías estimadas.
   Nada viene predefinido: todo lo creas tú.
   Tus datos personales (peso, altura, dolor, comidas…) NO están
   en este archivo: se guardan en tu navegador y en tu Drive privado.
   Usa las utilidades de app.js ($, esc, store, dateKey, addDays…).
   ========================================================= */

const HEALTH = {
  stravaDays: 120, // días de historial que se piden a Strava (solo si conectas el puente)
};

const TYPES = {
  gym: { label: 'Gimnasio', color: 'salud', emoji: '🏋️' },
  run: { label: 'Running', color: 'viaje', emoji: '🏃' },
  bike: { label: 'Bici', color: 'proyecto', emoji: '🚴' },
  other: { label: 'Otro', color: 'uni', emoji: '✦' },
};
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MEAL_NAMES = ['Desayuno', 'Comida', 'Merienda', 'Cena', 'Snack'];

/* ---------------------------------------------------------
   ALIMENTOS CASEROS · valores aproximados por 100 g (kcal, proteína, hidratos, grasa)
   a = cómo lo escribes · g = ración normal en gramos · each = peso de una unidad (huevo, tostada…)
   units = medidas propias de ese alimento (caña de cerveza, lata de atún…)
   --------------------------------------------------------- */
const FOODS = [
  // Desayuno y bebidas
  { n: 'Café con leche (semidesnatada)', a: ['cafe con leche', 'cafe con leche semi', 'cafe con leche semidesnatada', 'cafe con leche y'], kcal: 33, p: 2.4, c: 3.5, f: 1.1, g: 200 },
  { n: 'Café con leche entera', a: ['cafe con leche entera'], kcal: 45, p: 2.4, c: 3.4, f: 2.5, g: 200 },
  { n: 'Café con leche desnatada', a: ['cafe con leche desnatada'], kcal: 25, p: 2.5, c: 3.6, f: 0.1, g: 200 },
  { n: 'Café con bebida de avena', a: ['cafe con leche de avena', 'cafe con avena', 'cafe con bebida de avena'], kcal: 30, p: 0.6, c: 4.5, f: 1, g: 200 },
  { n: 'Café solo', a: ['cafe solo', 'cafe', 'espresso', 'expreso', 'cafe americano', 'americano'], kcal: 2, p: 0.1, c: 0, f: 0, g: 60 },
  { n: 'Cortado', a: ['cortado'], kcal: 25, p: 1.6, c: 2.2, f: 0.9, g: 80 },
  { n: 'Leche semidesnatada', a: ['leche', 'leche semidesnatada', 'leche semi'], kcal: 46, p: 3.3, c: 4.8, f: 1.6, g: 250 },
  { n: 'Leche entera', a: ['leche entera'], kcal: 65, p: 3.2, c: 4.7, f: 3.6, g: 250 },
  { n: 'Leche desnatada', a: ['leche desnatada'], kcal: 35, p: 3.4, c: 4.9, f: 0.1, g: 250 },
  { n: 'Bebida de avena', a: ['leche de avena', 'bebida de avena'], kcal: 45, p: 0.5, c: 7, f: 1.5, g: 250 },
  { n: 'Bebida de soja', a: ['leche de soja', 'bebida de soja'], kcal: 38, p: 3.2, c: 2, f: 1.8, g: 250 },
  { n: 'Azúcar', a: ['azucar'], kcal: 400, p: 0, c: 100, f: 0, g: 8, units: { sobre: 8, cucharadita: 5 } },
  { n: 'Cacao soluble', a: ['cola cao', 'colacao', 'cacao soluble', 'nesquik', 'cacao'], kcal: 380, p: 5, c: 80, f: 3, g: 15 },
  { n: 'Té o infusión', a: ['te', 'infusion', 'manzanilla', 'te verde', 'poleo'], kcal: 1, p: 0, c: 0.2, f: 0, g: 250 },
  { n: 'Zumo de naranja natural', a: ['zumo de naranja', 'zumo natural', 'zumo'], kcal: 45, p: 0.7, c: 10, f: 0.2, g: 200 },
  { n: 'Tostada de pan', a: ['tostada', 'tostadas', 'pan tostado'], kcal: 265, p: 9, c: 49, f: 3.2, g: 70, each: 35 },
  { n: 'Tostada integral', a: ['tostada integral', 'tostadas integrales', 'pan integral'], kcal: 247, p: 13, c: 41, f: 3.4, g: 70, each: 35 },
  { n: 'Pan', a: ['pan', 'pan blanco', 'barra de pan', 'baguette', 'trozo de pan'], kcal: 265, p: 9, c: 49, f: 3.2, g: 60 },
  { n: 'Pan de molde', a: ['pan de molde', 'pan bimbo'], kcal: 265, p: 8, c: 48, f: 4, g: 50, each: 25 },
  { n: 'Aceite de oliva', a: ['aceite', 'aceite de oliva', 'aove', 'chorro de aceite'], kcal: 884, p: 0, c: 0, f: 100, g: 10, units: { cucharada: 10, cucharadita: 4, chorrito: 5 } },
  { n: 'Tomate rallado', a: ['tomate rallado', 'tomate triturado', 'tomate natural'], kcal: 20, p: 0.9, c: 3.9, f: 0.2, g: 40 },
  { n: 'Mantequilla', a: ['mantequilla'], kcal: 717, p: 0.9, c: 0.1, f: 81, g: 10 },
  { n: 'Mermelada', a: ['mermelada', 'confitura'], kcal: 250, p: 0.4, c: 62, f: 0, g: 15 },
  { n: 'Miel', a: ['miel'], kcal: 304, p: 0.3, c: 82, f: 0, g: 15 },
  { n: 'Crema de cacahuete', a: ['crema de cacahuete', 'mantequilla de cacahuete'], kcal: 588, p: 25, c: 20, f: 50, g: 15 },
  { n: 'Copos de avena', a: ['avena', 'copos de avena', 'porridge', 'gachas de avena'], kcal: 389, p: 16.9, c: 66, f: 6.9, g: 40 },
  { n: 'Cereales', a: ['cereales', 'corn flakes', 'muesli', 'granola'], kcal: 380, p: 7, c: 80, f: 3, g: 40 },
  { n: 'Galletas', a: ['galleta', 'galletas', 'galletas maria'], kcal: 440, p: 7, c: 73, f: 13, g: 32, each: 8 },
  { n: 'Croissant', a: ['croissant', 'cruasan'], kcal: 406, p: 8, c: 46, f: 21, g: 60, each: 60 },
  { n: 'Magdalena', a: ['magdalena', 'magdalenas'], kcal: 430, p: 6, c: 50, f: 23, g: 30, each: 30 },
  { n: 'Bizcocho', a: ['bizcocho', 'trozo de bizcocho'], kcal: 380, p: 6, c: 55, f: 15, g: 60 },
  { n: 'Tortitas de arroz', a: ['tortitas de arroz', 'tortita de arroz'], kcal: 387, p: 8, c: 82, f: 3, g: 16, each: 8 },

  // Lácteos y huevos
  { n: 'Yogur natural', a: ['yogur', 'yogur natural', 'yogures'], kcal: 61, p: 3.5, c: 4.7, f: 3.3, g: 125, each: 125 },
  { n: 'Yogur griego', a: ['yogur griego', 'griego'], kcal: 97, p: 9, c: 3.9, f: 5, g: 125, each: 125 },
  { n: 'Yogur proteico / griego 0%', a: ['yogur proteico', 'yogur griego 0', 'yogur 0', 'yogur desnatado', 'skyr'], kcal: 60, p: 10, c: 3.8, f: 0.3, g: 125, each: 125 },
  { n: 'Kéfir', a: ['kefir'], kcal: 60, p: 3.4, c: 4.5, f: 3.2, g: 200 },
  { n: 'Queso fresco batido 0%', a: ['queso fresco batido', 'queso batido'], kcal: 46, p: 8, c: 3.6, f: 0.2, g: 125 },
  { n: 'Requesón', a: ['requeson'], kcal: 98, p: 11, c: 3.4, f: 4.3, g: 100 },
  { n: 'Queso fresco', a: ['queso fresco', 'queso de burgos'], kcal: 180, p: 12, c: 3, f: 13, g: 50 },
  { n: 'Queso curado', a: ['queso', 'queso curado', 'queso semicurado', 'queso manchego'], kcal: 390, p: 26, c: 0.5, f: 32, g: 30 },
  { n: 'Queso de tetilla', a: ['queso tetilla', 'queso de tetilla', 'tetilla', 'queso san simon'], kcal: 330, p: 22, c: 0.5, f: 27, g: 30 },
  { n: 'Mozzarella', a: ['mozzarella'], kcal: 250, p: 18, c: 3, f: 18, g: 60 },
  { n: 'Huevo', a: ['huevo', 'huevos'], kcal: 143, p: 12.6, c: 0.7, f: 9.5, g: 110, each: 55 },
  { n: 'Huevo cocido', a: ['huevo cocido', 'huevos cocidos', 'huevo duro', 'huevos duros'], kcal: 155, p: 13, c: 1.1, f: 11, g: 110, each: 55 },
  { n: 'Huevo frito', a: ['huevo frito', 'huevos fritos'], kcal: 196, p: 13.6, c: 0.8, f: 15, g: 120, each: 60 },
  { n: 'Huevos revueltos', a: ['huevos revueltos', 'huevo revuelto', 'revuelto'], kcal: 170, p: 11, c: 1.5, f: 13, g: 120, each: 60 },
  { n: 'Tortilla francesa', a: ['tortilla francesa'], kcal: 175, p: 12, c: 0.6, f: 14, g: 120 },
  { n: 'Claras de huevo', a: ['claras', 'claras de huevo', 'clara', 'clara de huevo'], kcal: 52, p: 10.9, c: 0.7, f: 0.2, g: 100, each: 33 },

  // Carne
  { n: 'Pechuga de pollo', a: ['pechuga de pollo', 'pechuga', 'pollo', 'filete de pollo', 'pollo a la plancha', 'pechugas de pollo', 'pechuga de pollo a la plancha', 'pechuga a la plancha', 'filete de pollo a la plancha'], kcal: 165, p: 31, c: 0, f: 3.6, g: 150 },
  { n: 'Pollo asado', a: ['pollo asado', 'pollo al horno'], kcal: 215, p: 26, c: 0, f: 12, g: 200 },
  { n: 'Muslo de pollo', a: ['muslo de pollo', 'muslos de pollo', 'contramuslo', 'contramuslos'], kcal: 210, p: 26, c: 0, f: 11, g: 120, each: 120 },
  { n: 'Pechuga de pavo', a: ['pavo', 'pechuga de pavo', 'filete de pavo'], kcal: 135, p: 29, c: 0, f: 1.7, g: 150 },
  { n: 'Fiambre de pavo', a: ['fiambre de pavo', 'pavo en lonchas', 'lonchas de pavo'], kcal: 100, p: 18, c: 2.5, f: 2, g: 40, each: 20 },
  { n: 'Filete de ternera', a: ['ternera', 'filete de ternera', 'filete', 'bistec', 'entrecot', 'solomillo'], kcal: 170, p: 26, c: 0, f: 7, g: 150 },
  { n: 'Carne picada', a: ['carne picada'], kcal: 260, p: 24, c: 0, f: 18, g: 120 },
  { n: 'Lomo de cerdo', a: ['lomo', 'lomo de cerdo', 'cinta de lomo', 'cerdo', 'secreto', 'presa'], kcal: 160, p: 27, c: 0, f: 6, g: 150 },
  { n: 'Costillas de cerdo', a: ['costillas', 'costilla', 'costillas de cerdo', 'churrasco'], kcal: 290, p: 24, c: 0, f: 21, g: 250 },
  { n: 'Chorizo', a: ['chorizo'], kcal: 455, p: 24, c: 2, f: 38, g: 30 },
  { n: 'Jamón serrano', a: ['jamon', 'jamon serrano', 'jamon iberico'], kcal: 241, p: 31, c: 0, f: 13, g: 30 },
  { n: 'Jamón cocido', a: ['jamon york', 'jamon cocido'], kcal: 110, p: 18, c: 1.5, f: 3.5, g: 30, each: 15 },
  { n: 'Salchichas', a: ['salchicha', 'salchichas', 'frankfurt'], kcal: 290, p: 12, c: 2, f: 26, g: 90, each: 45 },
  { n: 'Bacon', a: ['bacon', 'beicon'], kcal: 450, p: 14, c: 1, f: 43, g: 20 },
  { n: 'Albóndigas en salsa', a: ['albondigas'], kcal: 200, p: 13, c: 7, f: 13, g: 200, each: 30 },

  // Pescado y marisco
  { n: 'Pescado blanco (merluza…)', a: ['merluza', 'pescado', 'pescado blanco', 'pescadilla', 'gallo', 'lenguado', 'rape', 'dorada', 'lubina'], kcal: 90, p: 17.5, c: 0, f: 2, g: 150 },
  { n: 'Salmón', a: ['salmon'], kcal: 208, p: 20, c: 0, f: 13, g: 150 },
  { n: 'Atún al natural (lata)', a: ['atun', 'atun al natural', 'lata de atun'], kcal: 116, p: 26, c: 0, f: 1, g: 56, units: { lata: 56 } },
  { n: 'Atún en aceite (lata)', a: ['atun en aceite'], kcal: 200, p: 25, c: 0, f: 11, g: 56, units: { lata: 56 } },
  { n: 'Bacalao', a: ['bacalao'], kcal: 105, p: 23, c: 0, f: 1, g: 150 },
  { n: 'Sardinas', a: ['sardinas', 'sardina', 'sardinas en lata'], kcal: 210, p: 24, c: 0, f: 12, g: 80 },
  { n: 'Caballa', a: ['caballa', 'xarda'], kcal: 205, p: 19, c: 0, f: 14, g: 100 },
  { n: 'Gambas o langostinos', a: ['gambas', 'gamba', 'langostinos', 'langostino'], kcal: 99, p: 21, c: 0, f: 1.5, g: 100 },
  { n: 'Mejillones', a: ['mejillones'], kcal: 86, p: 12, c: 3.7, f: 2.2, g: 100 },
  { n: 'Pulpo a la gallega', a: ['pulpo', 'pulpo a la gallega', 'pulpo a feira'], kcal: 140, p: 15, c: 2, f: 8, g: 200 },
  { n: 'Calamares a la romana', a: ['calamares', 'calamares a la romana', 'rabas'], kcal: 225, p: 12, c: 16, f: 12, g: 150 },

  // Platos de cuchara
  { n: 'Lentejas guisadas', a: ['lentejas', 'lentejas guisadas', 'plato de lentejas'], kcal: 105, p: 7, c: 14, f: 2.5, g: 300 },
  { n: 'Garbanzos cocidos', a: ['garbanzos'], kcal: 164, p: 8.9, c: 27, f: 2.6, g: 150 },
  { n: 'Alubias guisadas', a: ['alubias', 'judias blancas', 'habichuelas'], kcal: 110, p: 7, c: 15, f: 2.5, g: 300 },
  { n: 'Fabada', a: ['fabada'], kcal: 160, p: 9, c: 12, f: 9, g: 350 },
  { n: 'Cocido', a: ['cocido', 'cocido gallego', 'cocido madrileno'], kcal: 150, p: 10, c: 10, f: 8, g: 400 },
  { n: 'Caldo gallego', a: ['caldo gallego', 'caldo'], kcal: 50, p: 2.5, c: 6, f: 2, g: 350 },
  { n: 'Sopa', a: ['sopa', 'sopa de fideos', 'sopa de pollo'], kcal: 45, p: 2.5, c: 6, f: 1, g: 300 },
  { n: 'Crema de verduras', a: ['crema de verduras', 'pure de verduras', 'crema de calabacin', 'crema de calabaza'], kcal: 50, p: 1.5, c: 6, f: 2.5, g: 300 },
  { n: 'Gazpacho', a: ['gazpacho'], kcal: 50, p: 0.9, c: 4, f: 3.5, g: 250 },
  { n: 'Salmorejo', a: ['salmorejo'], kcal: 120, p: 2.5, c: 10, f: 8, g: 200 },

  // Arroz, pasta, patata
  { n: 'Arroz blanco cocido', a: ['arroz', 'arroz blanco', 'arroz cocido', 'arroz hervido'], kcal: 130, p: 2.7, c: 28, f: 0.3, g: 150 },
  { n: 'Arroz integral cocido', a: ['arroz integral'], kcal: 123, p: 2.7, c: 25.6, f: 1, g: 150 },
  { n: 'Pasta cocida', a: ['pasta', 'macarrones', 'espaguetis', 'spaghetti', 'tallarines', 'fideos', 'penne', 'espirales', 'tortellini'], kcal: 158, p: 5.8, c: 31, f: 0.9, g: 200 },
  { n: 'Pasta con tomate', a: ['macarrones con tomate', 'pasta con tomate', 'espaguetis con tomate', 'pasta boloñesa', 'pasta bolonesa', 'espaguetis a la bolonesa', 'macarrones con carne'], kcal: 150, p: 6, c: 24, f: 3.5, g: 300 },
  { n: 'Pasta carbonara', a: ['carbonara', 'pasta carbonara', 'espaguetis carbonara'], kcal: 200, p: 8, c: 22, f: 9, g: 300 },
  { n: 'Paella', a: ['paella', 'arroz con marisco', 'paella de marisco', 'paella mixta'], kcal: 160, p: 8, c: 20, f: 5, g: 300 },
  { n: 'Arroz con pollo', a: ['arroz con pollo'], kcal: 150, p: 9, c: 18, f: 4.5, g: 300 },
  { n: 'Arroz a la cubana', a: ['arroz a la cubana'], kcal: 170, p: 6, c: 20, f: 7, g: 350 },
  { n: 'Patata cocida', a: ['patata', 'patatas', 'patata cocida', 'patatas cocidas', 'cachelos'], kcal: 87, p: 1.9, c: 20, f: 0.1, g: 200 },
  { n: 'Patatas fritas caseras', a: ['patatas fritas', 'patatas fritas caseras'], kcal: 250, p: 3.5, c: 32, f: 12, g: 150 },
  { n: 'Patata asada', a: ['patata asada', 'patatas asadas', 'patatas al horno', 'patata al horno'], kcal: 95, p: 2.2, c: 21, f: 0.2, g: 200 },
  { n: 'Puré de patata', a: ['pure de patata', 'pure', 'pure de patatas'], kcal: 105, p: 2, c: 15, f: 4, g: 200 },
  { n: 'Boniato', a: ['boniato', 'batata'], kcal: 86, p: 1.6, c: 20, f: 0.1, g: 200 },
  { n: 'Quinoa cocida', a: ['quinoa'], kcal: 120, p: 4.4, c: 21, f: 1.9, g: 150 },
  { n: 'Cuscús cocido', a: ['cuscus'], kcal: 112, p: 3.8, c: 23, f: 0.2, g: 150 },
  { n: 'Tortilla de trigo (wrap)', a: ['wrap', 'tortilla de trigo', 'fajita', 'tortillas de trigo'], kcal: 310, p: 8, c: 52, f: 7, g: 60, each: 60 },

  // Verduras y fruta
  { n: 'Ensalada', a: ['ensalada', 'lechuga', 'ensalada verde', 'canonigos', 'rucula'], kcal: 18, p: 1, c: 3.5, f: 0.2, g: 150 },
  { n: 'Ensalada mixta', a: ['ensalada mixta'], kcal: 70, p: 5, c: 3, f: 4.5, g: 300 },
  { n: 'Tomate', a: ['tomate', 'tomates'], kcal: 18, p: 0.9, c: 3.9, f: 0.2, g: 120, each: 120 },
  { n: 'Brócoli', a: ['brocoli'], kcal: 34, p: 2.8, c: 7, f: 0.4, g: 150 },
  { n: 'Judías verdes', a: ['judias verdes', 'judias'], kcal: 31, p: 1.8, c: 7, f: 0.1, g: 200 },
  { n: 'Pimientos de Padrón', a: ['pimientos de padron', 'padron'], kcal: 90, p: 1.5, c: 4, f: 7, g: 100 },
  { n: 'Pimiento', a: ['pimiento', 'pimientos'], kcal: 26, p: 1, c: 6, f: 0.3, g: 120 },
  { n: 'Calabacín', a: ['calabacin'], kcal: 17, p: 1.2, c: 3.1, f: 0.3, g: 200 },
  { n: 'Zanahoria', a: ['zanahoria', 'zanahorias'], kcal: 41, p: 0.9, c: 10, f: 0.2, g: 80, each: 80 },
  { n: 'Espinacas', a: ['espinacas', 'acelgas'], kcal: 23, p: 2.9, c: 3.6, f: 0.4, g: 150 },
  { n: 'Champiñones', a: ['champinones', 'setas'], kcal: 22, p: 3.1, c: 3.3, f: 0.3, g: 100 },
  { n: 'Cebolla', a: ['cebolla'], kcal: 40, p: 1.1, c: 9, f: 0.1, g: 60 },
  { n: 'Verduras a la plancha', a: ['verduras', 'verdura', 'parrillada de verduras', 'verduras salteadas', 'verduras a la plancha', 'menestra'], kcal: 45, p: 2, c: 6, f: 1.5, g: 200 },
  { n: 'Pisto', a: ['pisto'], kcal: 70, p: 1.5, c: 7, f: 4, g: 200 },
  { n: 'Aguacate', a: ['aguacate'], kcal: 160, p: 2, c: 9, f: 15, g: 70, units: { medio: 70 } },
  { n: 'Aceitunas', a: ['aceitunas'], kcal: 145, p: 1, c: 4, f: 15, g: 30 },
  { n: 'Fruta', a: ['fruta', 'pieza de fruta'], kcal: 55, p: 0.7, c: 13, f: 0.2, g: 150, each: 150 },
  { n: 'Plátano', a: ['platano', 'platanos', 'banana'], kcal: 89, p: 1.1, c: 23, f: 0.3, g: 120, each: 120 },
  { n: 'Manzana', a: ['manzana', 'manzanas'], kcal: 52, p: 0.3, c: 14, f: 0.2, g: 180, each: 180 },
  { n: 'Naranja', a: ['naranja', 'naranjas'], kcal: 47, p: 0.9, c: 12, f: 0.1, g: 150, each: 150 },
  { n: 'Mandarina', a: ['mandarina', 'mandarinas'], kcal: 53, p: 0.8, c: 13, f: 0.3, g: 80, each: 80 },
  { n: 'Pera', a: ['pera', 'peras'], kcal: 57, p: 0.4, c: 15, f: 0.1, g: 170, each: 170 },
  { n: 'Kiwi', a: ['kiwi', 'kiwis'], kcal: 61, p: 1.1, c: 15, f: 0.5, g: 75, each: 75 },
  { n: 'Fresas', a: ['fresas', 'fresa', 'frutos rojos', 'arandanos', 'frambuesas'], kcal: 40, p: 0.7, c: 9, f: 0.3, g: 150 },
  { n: 'Uvas', a: ['uvas'], kcal: 69, p: 0.7, c: 18, f: 0.2, g: 120 },
  { n: 'Melón o sandía', a: ['melon', 'sandia'], kcal: 32, p: 0.7, c: 8, f: 0.2, g: 300 },
  { n: 'Piña', a: ['pina'], kcal: 50, p: 0.5, c: 13, f: 0.1, g: 150 },
  { n: 'Melocotón', a: ['melocoton', 'nectarina'], kcal: 39, p: 0.9, c: 10, f: 0.3, g: 150, each: 150 },
  { n: 'Dátiles', a: ['datil', 'datiles'], kcal: 282, p: 2.5, c: 75, f: 0.4, g: 24, each: 8 },

  // Frutos secos, picoteo y dulces
  { n: 'Almendras', a: ['almendras'], kcal: 579, p: 21, c: 22, f: 50, g: 25 },
  { n: 'Nueces', a: ['nueces'], kcal: 654, p: 15, c: 14, f: 65, g: 25 },
  { n: 'Cacahuetes', a: ['cacahuetes', 'manises'], kcal: 567, p: 26, c: 16, f: 49, g: 25 },
  { n: 'Frutos secos', a: ['frutos secos', 'anacardos', 'pistachos', 'avellanas'], kcal: 600, p: 18, c: 18, f: 52, g: 25 },
  { n: 'Chocolate negro', a: ['chocolate negro', 'chocolate'], kcal: 600, p: 7.8, c: 46, f: 43, g: 20, units: { onza: 10 } },
  { n: 'Chocolate con leche', a: ['chocolate con leche'], kcal: 535, p: 7.7, c: 59, f: 30, g: 20, units: { onza: 10 } },
  { n: 'Patatas de bolsa', a: ['patatas de bolsa', 'chips', 'bolsa de patatas'], kcal: 536, p: 7, c: 53, f: 35, g: 40 },
  { n: 'Barrita de proteína', a: ['barrita', 'barrita de proteina', 'barrita proteica'], kcal: 350, p: 30, c: 35, f: 10, g: 60, each: 60 },
  { n: 'Proteína en polvo (batido)', a: ['batido de proteina', 'batido de proteinas', 'proteina', 'whey', 'scoop de proteina', 'batido'], kcal: 400, p: 80, c: 8, f: 6, g: 30, units: { scoop: 30, cacito: 30 } },
  { n: 'Helado', a: ['helado'], kcal: 207, p: 3.5, c: 24, f: 11, g: 100 },
  { n: 'Tarta o pastel', a: ['tarta', 'pastel', 'trozo de tarta', 'tarta de santiago'], kcal: 380, p: 6, c: 45, f: 19, g: 100 },
  { n: 'Donut', a: ['donut', 'donuts', 'berlina'], kcal: 452, p: 5, c: 51, f: 25, g: 60, each: 60 },

  // Platos y comida de fuera
  { n: 'Tortilla de patatas', a: ['tortilla', 'tortilla de patatas', 'tortilla espanola', 'pincho de tortilla'], kcal: 180, p: 6.5, c: 15, f: 11, g: 150 },
  { n: 'Empanada gallega', a: ['empanada', 'empanada gallega', 'empanada de atun', 'empanada de bonito', 'empanada de zamburinas', 'empanada de carne'], kcal: 290, p: 9, c: 30, f: 15, g: 150 },
  { n: 'Croquetas', a: ['croqueta', 'croquetas'], kcal: 230, p: 7, c: 20, f: 13, g: 120, each: 30 },
  { n: 'Lasaña', a: ['lasana'], kcal: 165, p: 9, c: 14, f: 8, g: 300 },
  { n: 'Filete empanado', a: ['filete empanado', 'escalope', 'pollo empanado', 'san jacobo', 'nuggets', 'pechuga empanada'], kcal: 260, p: 16, c: 15, f: 15, g: 150 },
  { n: 'Pollo al curry', a: ['pollo al curry', 'curry'], kcal: 140, p: 13, c: 5, f: 7, g: 250 },
  { n: 'Pizza', a: ['pizza', 'porcion de pizza'], kcal: 266, p: 11, c: 33, f: 10, g: 250, units: { porcion: 100, trozo: 100 } },
  { n: 'Hamburguesa completa', a: ['hamburguesa', 'burger', 'hamburguesa completa'], kcal: 260, p: 13, c: 25, f: 12, g: 230, each: 230 },
  { n: 'Hamburguesa (solo carne)', a: ['hamburguesa casera', 'hamburguesa de ternera', 'hamburguesa sin pan', 'carne de hamburguesa'], kcal: 250, p: 20, c: 1, f: 18, g: 120, each: 120 },
  { n: 'Bocadillo de jamón', a: ['bocadillo de jamon', 'bocata de jamon'], kcal: 260, p: 14, c: 34, f: 7, g: 180, each: 180 },
  { n: 'Bocadillo', a: ['bocadillo', 'bocata'], kcal: 250, p: 11, c: 33, f: 8, g: 180, each: 180 },
  { n: 'Sándwich mixto', a: ['sandwich mixto', 'mixto', 'sandwich'], kcal: 270, p: 14, c: 26, f: 12, g: 130, each: 130 },
  { n: 'Burrito o fajitas', a: ['burrito', 'fajitas', 'tacos'], kcal: 210, p: 11, c: 22, f: 8, g: 250 },
  { n: 'Kebab', a: ['kebab', 'durum'], kcal: 230, p: 13, c: 20, f: 11, g: 350 },
  { n: 'Sushi', a: ['sushi', 'maki', 'nigiri', 'piezas de sushi'], kcal: 150, p: 6, c: 28, f: 1.5, g: 200, each: 25 },

  // Bebidas
  { n: 'Agua', a: ['agua'], kcal: 0, p: 0, c: 0, f: 0, g: 250 },
  { n: 'Cerveza', a: ['cerveza', 'cana', 'canas', 'tercio'], kcal: 43, p: 0.5, c: 3.6, f: 0, g: 330, units: { cana: 200, tercio: 330, lata: 330, jarra: 500, botellin: 200 } },
  { n: 'Cerveza sin alcohol', a: ['cerveza sin', 'cerveza sin alcohol', 'cerveza 0'], kcal: 20, p: 0.3, c: 4.5, f: 0, g: 330 },
  { n: 'Vino', a: ['vino', 'copa de vino', 'vino tinto', 'vino blanco', 'albarino', 'ribeiro'], kcal: 83, p: 0.1, c: 2.6, f: 0, g: 150, units: { copa: 150 } },
  { n: 'Refresco', a: ['refresco', 'coca cola', 'cocacola', 'fanta', 'aquarius', 'nestea'], kcal: 42, p: 0, c: 10.6, f: 0, g: 330 },
  { n: 'Refresco zero', a: ['coca cola zero', 'cocacola zero', 'refresco zero', 'zero', 'light'], kcal: 0.3, p: 0, c: 0, f: 0, g: 330 },
];

// Medidas caseras genéricas (gramos o ml)
const UNIT_G = {
  vaso: 250, taza: 200, tazon: 300, bol: 300, cuenco: 300, cucharada: 15, cucharadita: 5,
  rebanada: 30, punado: 25, loncha: 20, onza: 10, sobre: 8, chorrito: 5, copa: 150, jarra: 500,
};
const UNIT_ALIASES = {
  g: 'g', gr: 'g', grs: 'g', gramo: 'g', gramos: 'g', ml: 'g', kg: 'kg', kilo: 'kg', l: 'kg', litro: 'kg',
  vaso: 'vaso', vasos: 'vaso', taza: 'taza', tazas: 'taza', tazon: 'tazon', tazones: 'tazon', bol: 'bol', cuenco: 'cuenco',
  cucharada: 'cucharada', cucharadas: 'cucharada', cucharadita: 'cucharadita', cucharaditas: 'cucharadita',
  rebanada: 'rebanada', rebanadas: 'rebanada', plato: 'plato', platos: 'plato', racion: 'plato', raciones: 'plato',
  punado: 'punado', punados: 'punado', lata: 'lata', latas: 'lata', pieza: 'pieza', piezas: 'pieza',
  unidad: 'pieza', unidades: 'pieza', filete: 'plato', filetes: 'plato', loncha: 'loncha', lonchas: 'loncha',
  onza: 'onza', onzas: 'onza', sobre: 'sobre', sobres: 'sobre', chorrito: 'chorrito', copa: 'copa', copas: 'copa',
  cana: 'cana', canas: 'cana', tercio: 'tercio', jarra: 'jarra', scoop: 'scoop', scoops: 'scoop', cacito: 'cacito',
  porcion: 'porcion', porciones: 'porcion', trozo: 'trozo', trozos: 'trozo', botellin: 'botellin',
};
const NUM_WORDS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, medio: 0.5, media: 0.5 };
const STOPWORDS = new Set(('con y de del la el los las a al sin en un una uno unos unas mi mis poco poca un poco algo ' +
  'plancha frito frita fritos fritas horno asado asada cocido cocida hervido hervida casero casera natural grande pequeno ' +
  'pequena medio media dos tres cuatro cinco seis siete ocho g gr gramos ml vaso vasos taza tazas cucharada cucharadas racion ' +
  'plato platos para tomar desayuno comida cena merienda he comido tome hoy por').split(' '));

/* ---------------------------------------------------------
   ESTADO
   --------------------------------------------------------- */
let routines;  // { id: { label, type, items: [{ name, sets }] } } · tus rutinas
let trainLog;  // { 'YYYY-MM-DD': [{ id, type, routineId, title, km, sec, min, note, done, ex }] }
let kneeLog, profile, stravaCfg, food, myFoods;
let foodOffset = 0;   // 0 = hoy, -1 = ayer…
let kneeOffset = 0;
let calCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let estimate = null;  // estimación de calorías pendiente de añadir
let activities = [];
let stravaSyncedAt = null;
let stravaError = null;

// Caché local que NO se sincroniza con Drive (cada dispositivo pide Strava por su cuenta)
const cache = {
  get(k) { try { return JSON.parse(localStorage.getItem(`lifedash-cache:${k}`)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(`lifedash-cache:${k}`, JSON.stringify(v)); } catch { /* sin caché */ } },
};

const foodDay = () => dateKey(addDays(foodOffset));
const kneeDay = () => dateKey(addDays(kneeOffset));
const round1 = (v) => Math.round(v * 10) / 10;
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/(\d)([a-z])/g, '$1 $2').replace(/[,.](?!\d)/g, ' , ').replace(/[^a-z0-9.,]+/g, ' ').replace(/\s+/g, ' ').trim(); // "40g" → "40 g"

function loadHealthState() {
  // Si vienes de la versión anterior, se reaprovechan tus datos (sin escribir nada hasta que cambies algo)
  routines = store.get('routines', null) ?? routinesFromOldVersion();
  trainLog = store.get('trainLog', null) ?? trainLogFromOldVersion();
  kneeLog = store.get('knee', {});
  profile = store.get('profile', null);
  stravaCfg = store.get('strava', null);
  myFoods = store.get('myFoods', []);
  food = store.get(`food:${foodDay()}`, []);
  const cached = cache.get('strava');
  if (cached?.list && stravaCfg) { activities = cached.list; stravaSyncedAt = new Date(cached.at); }
}

function routinesFromOldVersion() {
  const old = store.get('routine', null);
  const out = {};
  if (!old) return out;
  const isOldDefault = (w) => (w.label === 'Tren superior' && w.items?.[0]?.name === 'Press banca' && w.items.length === 5)
    || (w.label === 'Piernas' && w.items?.[0]?.name === 'Sentadilla' && w.items.length === 5);
  Object.entries(old.workouts || {}).forEach(([id, w]) => {
    if (w.kind === 'rest' || isOldDefault(w) || (w.kind !== 'gym' && !w.items?.length)) return;
    out[id] = { label: w.label, type: TYPES[w.kind] ? w.kind : 'other', items: w.items || [] };
  });
  return out;
}

function trainLogFromOldVersion() {
  const log = {};
  const add = (key, e) => (log[key] ||= []).push({ id: uid(), done: true, title: '', ...e });
  (store.get('runs', null) || []).forEach((r) => add(r.date, { type: 'run', km: r.km, sec: r.sec }));
  Object.keys(store.get('gymLog', {})).forEach((k) => add(k, { type: 'gym' }));
  Object.entries(store.get('dayLog', {})).forEach(([k, d]) => {
    (d.done || []).filter((t) => t === 'bike' || t === 'other').forEach((t) => add(k, { type: t }));
    if (d.note) { if (log[k]?.length) log[k][0].note = d.note; else add(k, { type: 'other', note: d.note }); }
  });
  return log;
}

const saveTrainLog = () => store.set('trainLog', trainLog);
const saveRoutines = () => store.set('routines', routines);

/* ---------------------------------------------------------
   ENTRENOS · utilidades
   --------------------------------------------------------- */
function kindOf(type = '') {
  if (/Run/.test(type)) return 'run';
  if (/Ride|Cycl/.test(type)) return 'bike';
  if (/Weight|Workout|Crossfit|HIIT/.test(type)) return 'gym';
  return 'other';
}

// Lo que tienes apuntado un día (más tus actividades de Strava, si algún día conectas el puente)
function entriesOn(key) {
  const own = trainLog[key] || [];
  const strava = activities.filter((a) => a.start.slice(0, 10) === key).map((a) => ({
    id: `s${a.id}`, type: kindOf(a.type), title: a.name, km: a.km || null, sec: a.sec, done: true, strava: true,
  }));
  return [...own, ...strava];
}

const entryTitle = (e) => e.title || routines[e.routineId]?.label || TYPES[e.type]?.label || 'Entreno';

function entryDetail(e) {
  const bits = [];
  if (e.km) bits.push(`${e.km} km`);
  if (e.sec) bits.push(fmtDuration(e.sec));
  if (e.km && e.sec) bits.push(e.type === 'bike' ? `${round1(e.km / (e.sec / 3600))} km/h` : `${fmtPace(e.sec / e.km)} /km`);
  if (e.min) bits.push(`${e.min} min`);
  return bits.join(' · ');
}

// Todas las carreras con distancia y tiempo (para gráficas y rodillas)
function allRuns() {
  const runs = [];
  Object.keys(trainLog).forEach((key) => entriesOn(key).forEach((e) => {
    if (e.type === 'run' && e.done && e.km && e.sec) runs.push({ date: key, km: e.km, sec: e.sec, name: entryTitle(e) });
  }));
  activities.filter((a) => kindOf(a.type) === 'run' && a.km && !trainLog[a.start.slice(0, 10)])
    .forEach((a) => runs.push({ date: a.start.slice(0, 10), km: a.km, sec: a.sec, name: a.name }));
  return runs.sort((a, b) => a.date.localeCompare(b.date));
}

const fmtDuration = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
  return h ? `${h} h ${pad(m)} min` : `${m}:${pad(s)} min`;
};

// "5:30" → segundos ; acepta también "1:02:30"
const parseClock = (str) => (/^\d{1,3}:\d{2}(:\d{2})?$/.test(String(str).trim()) ? parseTime(String(str).trim()) : 0);

// Peor rodilla de un día, o null si ese día no apuntaste dolor
const maxPain = (entry) => (entry && (entry.l != null || entry.r != null) ? Math.max(entry.l ?? 0, entry.r ?? 0) : null);
const painClass = (v) => (v == null ? '' : v <= 3 ? 'ok' : v <= 6 ? 'warn' : 'bad');

/* ---------------------------------------------------------
   NUTRICIÓN · objetivo (Mifflin-St Jeor) y estimación de comida casera
   --------------------------------------------------------- */
// ¿Ese día tienes una carrera marcada como hecha?
const ranOn = (key) => (trainLog[key] || []).some((e) => e.type === 'run' && e.done);

// Objetivo de un día: tus objetivos fijos (con el extra de día de carrera) o el cálculo automático
function nutritionTargets(key = foodDay()) {
  const p = profile;
  const fx = p?.fixed;
  if (fx?.kcal) {
    const ran = ranOn(key);
    return {
      fixed: true, ran,
      kcal: fx.kcal + (ran ? fx.runKcal || 0 : 0),
      protein: fx.p, carbs: (fx.c || 0) + (ran ? fx.runCarbs || 0 : 0), fat: fx.f,
      water: fx.waterMin ? [fx.waterMin, fx.waterMax || fx.waterMin] : null,
      runKcal: fx.runKcal || 0, runCarbs: fx.runCarbs || 0,
    };
  }
  if (!p?.weight || !p?.height || !p?.age) return null;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5);
  const tdee = bmr * (p.activity || 1.55);
  const kcal = Math.round(tdee - (p.deficit ?? 400));
  const protein = Math.round(p.weight * (p.proteinPerKg || 1.8));
  const fat = Math.round((kcal * 0.3) / 9); // reparto orientativo: 30% grasa, el resto hidratos
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), deficit: p.deficit ?? 400, kcal, protein, fat,
    carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)), belowBmr: kcal < bmr, water: null,
  };
}

// Agua del día en mililitros
const waterOn = (key) => store.get(`water:${key}`, 0);
const fmtL = (ml) => `${(ml / 1000).toLocaleString('es-ES', { maximumFractionDigits: 2 })} L`;
const fmtRange = (r) => `${r[0].toLocaleString('es-ES')}–${r[1].toLocaleString('es-ES')} L`;

const sumFood = (list) => list.reduce((t, i) => ({
  kcal: t.kcal + i.kcal, p: t.p + i.p, c: t.c + i.c, f: t.f + i.f,
}), { kcal: 0, p: 0, c: 0, f: 0 });

// Lista de alimentos para buscar: primero tus comidas guardadas, luego la tabla casera
function foodIndex() {
  // Tus comidas se reconocen por su nombre y por los nombres alternativos que tengan
  const mine = myFoods.map((m) => ({ n: m.n, a: [m.n, ...(m.aliases || [])], mine: m, kcal: m.kcal, p: m.p, c: m.c, f: m.f, g: 1, each: 1 }));
  const list = [];
  [...mine, ...FOODS].forEach((f) => f.a.forEach((alias) => list.push({ alias: norm(alias), food: f })));
  return list.sort((a, b) => b.alias.length - a.alias.length);
}

// Cantidad escrita justo antes del alimento: "2", "200 g de", "un vaso de", "media"…
function quantityBefore(text, food, aliasUnit) {
  const m = text.match(/(\d+(?:[.,]\d+)?|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|medio|media)?\s*([a-z]+)?(?:\s+de)?\s*$/);
  if (!m) return null;
  const n = m[1] ? (NUM_WORDS[m[1]] ?? parseFloat(m[1].replace(',', '.'))) : null;
  const unit = m[2] && UNIT_ALIASES[m[2]] ? UNIT_ALIASES[m[2]] : null;
  if (n == null && !unit) return null;
  if (food.mine) {                                      // tus comidas: en raciones
    if (unit !== 'g' && unit !== 'kg') return n ?? 1;
    const grams = (n ?? 1) * (unit === 'kg' ? 1000 : 1);
    return food.mine.g ? grams / food.mine.g : 1;       // "200 g de fresas" si sabes cuánto pesa tu ración
  }
  const count = n ?? 1;
  if (unit === 'g') return count;
  if (unit === 'kg') return count * 1000;
  if (unit) {
    const g = food.units?.[unit] ?? { pieza: food.each, plato: food.g, lata: food.g, porcion: food.g, trozo: food.g }[unit] ?? UNIT_G[unit];
    return count * (g || food.g);
  }
  return count * (aliasUnit || food.each || food.g);
}

function estimateFood(text) {
  const t = ` ${norm(text)} `;
  const taken = new Array(t.length).fill(false);
  const parts = [];

  // Variantes de tus comidas, p. ej. "bol … con 1 yogur": se aplica el ajuste y no se cuenta otro yogur
  myFoods.filter((m) => m.variant?.re).forEach((m) => {
    if (![m.n, ...(m.aliases || [])].some((a) => t.includes(` ${norm(a)} `))) return;
    let re;
    try { re = new RegExp(m.variant.re); } catch { return; }
    const hit = re.exec(t);
    if (!hit) return;
    taken.fill(true, hit.index, hit.index + hit[0].length);
    const v = m.variant;
    parts.push({ pos: t.length + 1, food: { n: v.label, mine: { n: v.label }, kcal: v.kcal, p: v.p, c: v.c, f: v.f }, amount: 1, auto: true });
  });

  foodIndex().forEach(({ alias, food }) => {
    const re = new RegExp(`(?<= )${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?= )`, 'g');
    let m;
    while ((m = re.exec(t))) {
      const start = m.index, end = start + alias.length;
      if (taken.slice(start, end).some(Boolean)) continue;
      if (/\bsin\s+$/.test(t.slice(Math.max(0, start - 5), start))) { taken.fill(true, start, end); continue; } // "sin azúcar"
      // Texto anterior hasta la última comida reconocida o separador, para leer la cantidad
      let from = start;
      while (from > 0 && !taken[from - 1] && !/[,]/.test(t[from - 1])) from--;
      const before = t.slice(from, start).replace(/^.*\b(?:con|y)\s+/, '').trim();
      const aliasUnit = food.units?.[alias]; // "caña", "tercio"… ya dicen la cantidad
      const qty = quantityBefore(before, food, aliasUnit);
      const amount = qty ?? (aliasUnit || (food.mine ? 1 : food.g));
      taken.fill(true, start, end);
      parts.push({ pos: start, food, amount });
    }
  });
  parts.sort((a, b) => a.pos - b.pos);

  // En tostadas, el tomate es rallado (unos 20 g por tostada)
  const toast = parts.find((p) => p.food.n.startsWith('Tostada'));
  const tomato = parts.find((p) => p.food.n === 'Tomate');
  if (toast && tomato) {
    tomato.food = FOODS.find((f) => f.n === 'Tomate rallado');
    tomato.amount = Math.max(20, Math.round(toast.amount / (toast.food.each || 35)) * 20);
  }

  // Forma de cocinar: añade el aceite que no escribes
  if (/\bplancha\b/.test(t) && !parts.some((p) => p.food.n.startsWith('Aceite'))) {
    parts.push({ pos: t.length, food: { n: 'Aceite (plancha)', kcal: 884, p: 0, c: 0, f: 100, g: 5 }, amount: 5, auto: true });
  }
  if (/\b(frito|frita|fritos|fritas|rebozado|rebozada)\b/.test(t) && !parts.some((p) => /fritas|Aceite|frito/i.test(p.food.n))) {
    parts.push({ pos: t.length, food: { n: 'Aceite (fritura)', kcal: 884, p: 0, c: 0, f: 100, g: 10 }, amount: 10, auto: true });
  }

  // Palabras que no he reconocido
  const unknown = [];
  t.split(' ').reduce((pos, w) => {
    if (w && !taken[pos] && !STOPWORDS.has(w) && !/^\d+([.,]\d+)?$/.test(w) && !/^[.,]+$/.test(w) && !UNIT_ALIASES[w]) unknown.push(w);
    return pos + w.length + 1;
  }, 0);

  return { text, parts, unknown: [...new Set(unknown)] };
}

// Nutrientes de una parte de la estimación según la cantidad
function partNutrients(part) {
  const f = part.food;
  const factor = f.mine ? part.amount : part.amount / 100;
  return { kcal: f.kcal * factor, p: f.p * factor, c: f.c * factor, f: f.f * factor };
}

/* ---------------------------------------------------------
   TEXTO PARA EL BRIEFING (lo usa app.js)
   Solo cuenta lo que tú has apuntado: no propone entrenos.
   --------------------------------------------------------- */
function todayWorkout() {
  const e = (trainLog[TODAY] || [])[0];
  return e ? { kind: e.type, label: entryTitle(e) } : { kind: 'rest', label: 'Nada apuntado' };
}

function healthBriefing() {
  const parts = [];
  const today = trainLog[TODAY] || [];
  const done = today.filter((e) => e.done), planned = today.filter((e) => !e.done);
  const list = (arr) => joinEs(arr.map((e) => `<strong>${esc(entryTitle(e))}</strong>${entryDetail(e) ? ` (${esc(entryDetail(e))})` : ''}`));
  if (planned.length) parts.push(`Para hoy tienes apuntado: ${list(planned)}.`);
  if (done.length) parts.push(`Hoy ya has hecho: ${list(done)}.`);
  if (Object.keys(kneeLog).length && maxPain(kneeLog[TODAY]) == null) parts.push('Aún no has apuntado el dolor de rodillas de hoy.');
  const t = nutritionTargets(TODAY);
  if (t) {
    const s = sumFood(store.get(`food:${TODAY}`, []));
    const water = t.water ? ` Agua: ${fmtL(waterOn(TODAY))} de ${fmtRange(t.water)}.` : '';
    parts.push(`Llevas <strong>${Math.round(s.kcal)} de ${t.kcal} kcal</strong>${t.ran && t.runKcal ? ' (día de carrera)' : ''} y ${Math.round(s.p)} de ${t.protein} g de proteína.${water}`);
  }
  return parts.join(' ') || 'Hoy no tienes entrenos apuntados.';
}

/* ---------------------------------------------------------
   RENDER · Mis rutinas
   --------------------------------------------------------- */
function renderRoutines() {
  const list = Object.entries(routines);
  if (!list.length) {
    $('#routinesList').innerHTML = '<p class="muted small">Aún no tienes rutinas. Crea las tuyas con «Nueva rutina»: nombre, tipo y, si quieres, los ejercicios.</p>';
    return;
  }
  $('#routinesList').innerHTML = list.map(([id, r]) => {
    const t = TYPES[r.type] || TYPES.other;
    const days = routineDays(r);
    return `
      <details class="routine" data-routine="${id}">
        <summary class="routine-head">
          <span>${esc(r.label)}</span>
          <span class="tag" style="--c:var(--c-${t.color})">${t.label}</span>
          ${days ? `<span class="muted small">${days}</span>` : ''}
          <span class="routine-actions">
            <button class="btn btn-sm btn-ghost" type="button" data-routine-today="${id}">Hecha hoy</button>
            <button class="icon-btn" type="button" data-routine-edit="${id}" aria-label="Editar rutina">✎</button>
          </span>
        </summary>
        ${r.note ? `<p class="routine-note">${esc(r.note)}</p>` : ''}
        ${r.items.length ? `<ul class="routine-items">${r.items.map((i) => `<li><span>${esc(i.name)}</span>${i.sets ? `<em>${esc(i.sets)}</em>` : ''}</li>`).join('')}</ul>` : ''}
      </details>`;
  }).join('');
}

// "Lun · Jue" con los días que tú le pusiste a la rutina
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const routineDays = (r) => DAY_ORDER.filter((d) => r.days?.includes(d)).map((d) => WEEKDAYS[d].slice(0, 3)).join(' · ');

/* ---------------------------------------------------------
   RELLENAR EL CALENDARIO con los días de tus rutinas
   Solo días a partir de hoy y que aún no tengan nada apuntado.
   --------------------------------------------------------- */
function fillCalendar(fromKey, untilKey) {
  let added = 0;
  const log = { ...trainLog };
  for (let d = parseKey(fromKey); dateKey(d) <= untilKey; d = addDays(1, d)) {
    const key = dateKey(d);
    if (key < TODAY || log[key]?.length) continue;
    const todays = Object.entries(routines).filter(([, r]) => r.days?.includes(d.getDay()));
    if (!todays.length) continue;
    log[key] = todays.map(([id, r]) => ({ id: uid(), type: r.type, routineId: id, title: '', done: false }));
    added += todays.length;
  }
  trainLog = log;
  if (added) saveTrainLog();
  return added;
}

const hasRoutineDays = () => Object.values(routines).some((r) => r.days?.length);

/* ---------------------------------------------------------
   IMPORTAR una rutina desde un enlace (#importar=…)
   El contenido va en el fragmento de la URL: nunca llega a ningún servidor.
   --------------------------------------------------------- */
function readImportFromUrl() {
  const m = location.hash.match(/^#importar=([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    const data = JSON.parse(json);
    return (Array.isArray(data.routines) || Array.isArray(data.foods) || data.targets) ? data : null;
  } catch {
    alert('El enlace de importación no es válido.');
    return null;
  }
}

// Se aplica después de traer tus datos de Drive, para no pisar lo de otro dispositivo
let pendingImport = null;
function runPendingImport() {
  if (!pendingImport) return;
  const data = pendingImport;
  pendingImport = null;
  applyImport(data);
}

function applyImport(data) {
  const until = data.until || dateKey(addDays(42));
  const list = data.routines || [];
  const what = [];
  if (list.length) {
    what.push(`${list.length} rutinas${list.some((r) => r.days?.length)
      ? ` (apuntadas en el calendario hasta el ${parseKey(until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})` : ''}`);
  }
  if (data.foods?.length) what.push(`${data.foods.length} comidas habituales`);
  if (data.targets) what.push(`tus objetivos: ${data.targets.kcal} kcal · ${data.targets.p} P · ${data.targets.c} H · ${data.targets.f} G`);
  if (!confirm(`¿Importar ${joinEs(what)}?\n\nNo se borra nada de lo que ya tienes.`)) return;

  const done = [];
  if (data.targets) {
    const t = data.targets;
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    profile = { ...(profile || {}), fixed: {
      kcal: num(t.kcal), p: num(t.p), c: num(t.c), f: num(t.f),
      waterMin: num(t.waterMin), waterMax: num(t.waterMax), runKcal: num(t.runKcal), runCarbs: num(t.runCarbs),
    } };
    store.set('profile', profile);
    done.push('objetivos guardados');
  }
  if (data.foods?.length) {
    const incoming = data.foods.map((m) => ({
      id: uid(), n: String(m.n).slice(0, 60), group: m.group ? String(m.group).slice(0, 30) : '',
      desc: m.desc ? String(m.desc).slice(0, 200) : '',
      kcal: Number(m.kcal) || 0, p: Number(m.p) || 0, c: Number(m.c) || 0, f: Number(m.f) || 0,
      ...(Number(m.g) > 0 ? { g: Number(m.g) } : {}),                       // gramos de una ración
      ...(Array.isArray(m.aliases) ? { aliases: m.aliases.map((a) => String(a).slice(0, 60)).slice(0, 8) } : {}),
      ...(m.variant ? { variant: {
        re: String(m.variant.re || ''), label: String(m.variant.label || 'Variante').slice(0, 40),
        short: String(m.variant.short || '').slice(0, 12),
        kcal: Number(m.variant.kcal) || 0, p: Number(m.variant.p) || 0, c: Number(m.variant.c) || 0, f: Number(m.variant.f) || 0,
      } } : {}),
    }));
    const names = new Set(incoming.map((m) => norm(m.n)));
    myFoods = [...myFoods.filter((m) => !names.has(norm(m.n))), ...incoming]; // las de mismo nombre se actualizan
    store.set('myFoods', myFoods);
    done.push(`${incoming.length} comidas guardadas`);
  }
  if (!list.length) {
    renderHealth();
    renderBriefing();
    alert(`Listo: ${joinEs(done)}.`);
    return;
  }
  const byName = Object.fromEntries(Object.entries(routines).map(([id, r]) => [norm(r.label), id]));
  routines = { ...routines };
  list.forEach((r) => {
    const id = byName[norm(r.label)] || `r${uid()}`; // si ya existe con ese nombre, se actualiza
    routines[id] = {
      label: String(r.label).slice(0, 60),
      type: TYPES[r.type] ? r.type : 'other',
      items: (r.items || []).map((i) => ({ name: String(i.name || i).slice(0, 120), sets: String(i.sets || '').slice(0, 40) })),
      days: (r.days || []).filter((d) => d >= 0 && d <= 6),
      note: r.note ? String(r.note).slice(0, 500) : '',
    };
  });
  saveRoutines();
  const added = fillCalendar(TODAY, until);
  renderHealth();
  renderBriefing();
  done.unshift(`${list.length} rutinas guardadas y ${added} entrenos apuntados en el calendario`);
  alert(`Listo: ${joinEs(done)}.`);
}

/* ---------------------------------------------------------
   RENDER · Actividades → activities.js
   --------------------------------------------------------- */
const renderRunning = () => renderActivities();

/* ---------------------------------------------------------
   RENDER · Rodillas (solo tu registro de dolor)
   --------------------------------------------------------- */
function renderKnee() {
  const key = kneeDay();
  const entry = kneeLog[key] || {};
  const dayLabel = kneeOffset === 0 ? 'Hoy' : kneeOffset === -1 ? 'Ayer' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const slider = (side, label) => {
    const v = entry[side];
    return `
      <label class="pain">
        <span>${label}</span>
        <input type="range" min="0" max="10" step="1" value="${v ?? 0}" data-side="${side}" class="${v == null ? 'is-empty' : ''}">
        <b class="${painClass(v)}">${v ?? '–'}</b>
      </label>`;
  };
  const runsHere = (trainLog[key] || []).filter((e) => e.type === 'run' && e.km);

  $('#kneePanel').innerHTML = `
    <h3>Rodillas
      <span class="day-nav">
        <button class="icon-btn" data-knee-nav="-1" type="button" aria-label="Día anterior">‹</button>
        <span>${dayLabel}</span>
        <button class="icon-btn" data-knee-nav="1" type="button" aria-label="Día siguiente" ${kneeOffset >= 0 ? 'disabled' : ''}>›</button>
      </span>
    </h3>
    <p class="muted small">Dolor de 0 (nada) a 10 (máximo).</p>
    ${slider('l', 'Izquierda')}
    ${slider('r', 'Derecha')}
    <button class="btn btn-sm btn-ghost" type="button" data-knee-zero>Sin dolor en ninguna (0 y 0)</button>
    <input type="text" class="knee-note" data-side="note" maxlength="140" placeholder="Nota (p. ej. molestia al bajar escaleras)" value="${esc(entry.note || '')}">
    ${runsHere.length ? `<p class="muted small">Ese día corriste ${joinEs(runsHere.map((e) => `${fmtKm(e.km)} km`))}.</p>` : ''}
    ${kneeChart()}`;
}

// Últimos 28 días: dolor de cada rodilla (líneas) y km corridos (barras)
function kneeChart() {
  const W = 280, H = 82, DAYS = 28, top = 6, base = 78;
  const x = (i) => 4 + (i * (W - 8)) / (DAYS - 1);
  const y = (v) => base - (v / 10) * (base - top);
  const keys = Array.from({ length: DAYS }, (_, i) => dateKey(addDays(i - DAYS + 1)));
  const runsByDay = {};
  allRuns().forEach((r) => { runsByDay[r.date] = (runsByDay[r.date] || 0) + r.km; });
  const maxKm = Math.max(5, ...Object.values(runsByDay));
  const line = (side) => keys
    .map((k, i) => (kneeLog[k]?.[side] != null ? `${x(i).toFixed(1)},${y(kneeLog[k][side]).toFixed(1)}` : null))
    .filter(Boolean).join(' ');
  const bars = keys.map((k, i) => {
    const km = runsByDay[k];
    if (!km) return '';
    const h = (km / maxKm) * 40;
    return `<rect x="${(x(i) - 3).toFixed(1)}" y="${(base - h).toFixed(1)}" width="6" height="${h.toFixed(1)}" rx="1.5" class="kc-run"><title>${k}: ${round1(km)} km</title></rect>`;
  }).join('');
  return `
    <svg class="knee-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dolor de rodillas y kilómetros de los últimos 28 días">
      ${bars}
      <polyline points="${line('l')}" class="kc-l"/>
      <polyline points="${line('r')}" class="kc-r"/>
      <line x1="0" x2="${W}" y1="${base}" y2="${base}" class="kc-base"/>
    </svg>
    <div class="kc-axis"><span>hace 4 semanas</span><span>hace 2 semanas</span><span>hoy</span></div>
    <div class="legend">
      <span><i class="lg-l"></i>Izquierda</span><span><i class="lg-r"></i>Derecha</span><span><i class="lg-run"></i>km corridos</span>
    </div>`;
}

/* ---------------------------------------------------------
   RENDER · Calendario (lo que tú apuntas)
   --------------------------------------------------------- */
function renderCalendar() {
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // lunes primero
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const stats = { gym: 0, run: 0, runKm: 0, bike: 0, bikeKm: 0, other: 0 };

  let cells = '<span class="cal-pad"></span>'.repeat(offset);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(new Date(y, m, d));
    const entries = entriesOn(key);
    entries.filter((e) => e.done).forEach((e) => {
      stats[e.type] = (stats[e.type] || 0) + 1;
      if (e.type === 'run') stats.runKm += e.km || 0;
      if (e.type === 'bike') stats.bikeKm += e.km || 0;
    });
    const shown = entries.slice(0, 2);
    const title = entries.map((e) => `${e.done ? '✓' : '○'} ${entryTitle(e)}${entryDetail(e) ? ` · ${entryDetail(e)}` : ''}`).join('\n');
    cells += `
      <button type="button" class="cal-day ${key === TODAY ? 'is-today' : ''} ${key > TODAY ? 'is-future' : ''}" data-date="${key}" title="${esc(title || 'Toca para apuntar')}">
        <span class="cal-num">${d}</span>
        <span class="cal-plans">
          ${shown.map((e) => `<span class="cal-plan ${e.done ? '' : 'is-planned'}" style="--c:var(--c-${(TYPES[e.type] || TYPES.other).color})">${esc(entryTitle(e))}</span>`).join('')}
          ${entries.length > 2 ? `<span class="cal-more">+${entries.length - 2}</span>` : ''}
        </span>
        <span class="cal-dots">
          ${entries.map((e) => `<i class="${e.done ? '' : 'is-planned'}" style="--c:var(--c-${(TYPES[e.type] || TYPES.other).color})"></i>`).join('')}
        </span>
      </button>`;
  }

  $('#calTitle').textContent = capitalize(calCursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
  $('#fillCalendar').hidden = !hasRoutineDays();
  $('#calendar').innerHTML = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => `<span class="cal-wd">${d}</span>`).join('') + cells;
  $('#calStats').innerHTML = `
    <div class="stat" style="--c:var(--c-salud)"><b>${stats.gym}</b><span>Gimnasio</span><i></i></div>
    <div class="stat" style="--c:var(--c-viaje)"><b>${stats.run}</b><span>Carreras · ${round1(stats.runKm)} km</span><i></i></div>
    <div class="stat" style="--c:var(--c-proyecto)"><b>${stats.bike}</b><span>Bici · ${Math.round(stats.bikeKm)} km</span><i></i></div>
    ${stats.other ? `<div class="stat" style="--c:var(--c-uni)"><b>${stats.other}</b><span>Otros</span><i></i></div>` : ''}`;
}

/* ---------------------------------------------------------
   FICHA DE UN DÍA · añadir lo que vas a hacer o lo que hiciste
   --------------------------------------------------------- */
function openDay(key) {
  $('#dayDialog').dataset.date = key;
  $('#dayTitle').textContent = capitalize(parseKey(key).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
  resetEntryForm();
  renderDayEntries();
  $('#dayDialog').showModal();
}

function renderDayEntries() {
  const key = $('#dayDialog').dataset.date;
  const entries = entriesOn(key);
  $('#dayAddTitle').textContent = key > TODAY ? 'Apuntar lo que vas a hacer' : 'Apuntar lo que hiciste';
  if (!entries.length) {
    $('#dayEntries').innerHTML = '<li class="muted small">Nada apuntado este día.</li>';
    return;
  }
  $('#dayEntries').innerHTML = entries.map((e) => {
    const t = TYPES[e.type] || TYPES.other;
    const routine = routines[e.routineId];
    return `
      <li class="day-entry ${e.done ? '' : 'is-planned'}" data-entry="${e.id}" style="--c:var(--c-${t.color})">
        <div class="de-head">
          <span class="de-dot"></span>
          <span class="de-title">${esc(entryTitle(e))}</span>
          <span class="muted small">${esc(entryDetail(e))}</span>
          ${e.strava ? '<span class="muted small">Strava</span>' : `
            <label class="de-done"><input type="checkbox" data-entry-done ${e.done ? 'checked' : ''}> Hecho</label>
            <label class="de-move" title="Mover a otro día">Mover <input type="date" data-entry-move value="${key}" aria-label="Mover a otro día"></label>
            ${e.km ? '<button class="link-btn" type="button" data-entry-open>Ver</button>' : ''}
            <button class="icon-btn" type="button" data-entry-del aria-label="Borrar">×</button>`}
        </div>
        ${routine?.note ? `<p class="routine-note">${esc(routine.note)}</p>` : ''}
        ${routine?.items.length ? `<ul class="checklist de-ex">${routine.items.map((it, i) => `
          <li><label class="check"><input type="checkbox" data-entry-ex="${i}" ${e.ex?.includes(i) ? 'checked' : ''}>
            <span>${esc(it.name)}</span><em>${esc(it.sets || '')}</em></label></li>`).join('')}</ul>` : ''}
        ${e.note ? `<p class="de-note">${esc(e.note)}</p>` : ''}
      </li>`;
  }).join('');
}

function resetEntryForm() {
  const options = Object.entries(routines).map(([id, r]) => `<option value="${id}" data-type="${r.type}">${esc(r.label)}</option>`).join('');
  $('#enRoutine').innerHTML = `<option value="">— Sin rutina —</option>${options}`;
  $('#enRoutine').hidden = !Object.keys(routines).length;
  ['#enTitle', '#enKm', '#enTime', '#enMin', '#enNote'].forEach((s) => { $(s).value = ''; });
  updateEntryForm();
}

function updateEntryForm() {
  const type = $('#enType').value;
  $('#enDist').hidden = !(type === 'run' || type === 'bike');
  $('#enDur').hidden = type === 'run' || type === 'bike';
  $('#enTime').placeholder = $('#enMode').value === 'pace' ? 'ritmo mm:ss /km' : 'tiempo mm:ss';
}

function addEntryFromForm() {
  const key = $('#dayDialog').dataset.date;
  const type = $('#enType').value;
  const entry = { id: uid(), type, title: $('#enTitle').value.trim(), done: key <= TODAY };
  const routineId = $('#enRoutine').value;
  if (routineId) entry.routineId = routineId;
  if (type === 'run' || type === 'bike') {
    const km = parseFloat(String($('#enKm').value).replace(',', '.'));
    const clock = parseClock($('#enTime').value);
    if (km > 0) entry.km = Math.round(km * 100) / 100;
    if (clock) entry.sec = $('#enMode').value === 'pace' && km > 0 ? Math.round(clock * km) : clock;
    if ($('#enTime').value && !clock) { $('#enTime').focus(); return; }
  } else {
    const min = Number($('#enMin').value);
    if (min > 0) entry.min = min;
  }
  const note = $('#enNote').value.trim();
  if (note) entry.note = note;
  trainLog = { ...trainLog, [key]: [...(trainLog[key] || []), entry] };
  saveTrainLog();
  resetEntryForm();
  renderDayEntries();
  refreshTraining();
}

function updateEntry(key, id, change) {
  trainLog = { ...trainLog, [key]: (trainLog[key] || []).map((e) => (e.id === id ? change(e) : e)).filter(Boolean) };
  if (!trainLog[key].length) delete trainLog[key];
  saveTrainLog();
  renderDayEntries();
  refreshTraining();
}

function refreshTraining() {
  renderRunning();
  renderKnee();
  renderCalendar();
  renderNutrition(); // el objetivo de calorías cambia si marcas una carrera
  renderBriefing();
}

/* ---------------------------------------------------------
   RENDER · Nutrición
   --------------------------------------------------------- */
function renderNutrition() {
  const key = foodDay();
  const t = nutritionTargets(key);
  const total = sumFood(food);

  if (!t) {
    $('#nutriSummary').innerHTML = `
      <h3>Calorías</h3>
      <p class="muted small">Pon tus objetivos (o tu peso, altura y edad para calcularlos) en «Mis datos».</p>
      <button class="btn btn-primary btn-sm" type="button" data-open-profile>Poner mis datos</button>
      <p class="muted small">Llevas ${Math.round(total.kcal)} kcal y ${Math.round(total.p)} g de proteína.</p>
      ${waterHTML(null)}`;
  } else {
    const left = t.kcal - total.kcal;
    const pct = clamp((total.kcal / t.kcal) * 100, 0, 100);
    const macro = (label, v, goal, cls) => `
      <div class="macro">
        <div class="muted small"><span>${label}</span><span>${Math.round(v)}${goal ? ` / ${goal}` : ''} g</span></div>
        <div class="bar" style="--c:var(--c-${cls})"><span style="--p:${goal ? clamp((v / goal) * 100, 0, 100) : 0}%"></span></div>
      </div>`;
    const how = t.fixed
      ? `Tu objetivo fijo${t.ran && t.runKcal ? ` + ${t.runKcal} kcal y ${t.runCarbs} g de hidratos por día de carrera 🏃` : t.runKcal ? ` (los días que corres sube a ${t.kcal + t.runKcal} kcal)` : ''}.`
      : `Gasto estimado ${t.tdee} kcal (metabolismo basal ${t.bmr} × actividad) − déficit ${t.deficit}.`;
    $('#nutriSummary').innerHTML = `
      <h3>Calorías <span class="muted small">${key === TODAY ? 'hoy' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></h3>
      <div class="kcal-big"><b>${Math.round(total.kcal)}</b><span>/ ${t.kcal} kcal</span></div>
      <div class="bar kcal-bar ${left < 0 ? 'is-over' : ''}" style="--c:var(--c-personal)"><span style="--p:${pct}%"></span></div>
      <p class="small ${left < 0 ? 'bad-text' : 'muted'}">${left >= 0 ? `Te quedan ${Math.round(left)} kcal` : `Te has pasado ${Math.round(-left)} kcal`}</p>
      ${macro('Proteína', total.p, t.protein, 'salud')}
      ${macro('Hidratos', total.c, t.carbs, 'uni')}
      ${macro('Grasas', total.f, t.fat, 'personal')}
      ${waterHTML(t.water)}
      <p class="muted small calc-note">${how}
        <button class="link-btn" type="button" data-open-profile>Cambiar mis objetivos</button></p>
      ${t.belowBmr ? '<p class="small bad-text">Tu objetivo queda por debajo de tu metabolismo basal: es un déficit muy agresivo. Coméntalo con un profesional.</p>' : ''}`;
  }

  $('#foodDayLabel').textContent = foodOffset === 0 ? 'Hoy' : foodOffset === -1 ? 'Ayer' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  $('[data-food-nav="1"]').disabled = foodOffset >= 0;
  renderMyFoods();

  if (!food.length) {
    $('#foodList').innerHTML = '<p class="muted small">Aún no has apuntado nada este día.</p>';
    return;
  }
  $('#foodList').innerHTML = MEAL_NAMES.map((meal) => {
    const items = food.filter((i) => i.meal === meal);
    if (!items.length) return '';
    const s = sumFood(items);
    return `
      <div class="meal">
        <div class="meal-head"><span>${meal}</span><span class="muted small">${Math.round(s.kcal)} kcal · ${Math.round(s.p)} g prot.</span></div>
        <ul>
          ${items.map((i) => `
            <li title="${esc((i.parts || []).map((p) => `${p.n}: ${p.qty} · ${Math.round(p.kcal)} kcal`).join('\n'))}">
              <span class="food-name">${esc(i.name)}</span>
              <span class="food-kcal">${Math.round(i.kcal)}</span>
              <button class="icon-btn" type="button" data-food-del="${i.id}" aria-label="Quitar">×</button>
            </li>`).join('')}
        </ul>
      </div>`;
  }).join('');
}

// Agua: barra con tu objetivo y botones de vaso / botella
function waterHTML(range) {
  const ml = waterOn(foodDay());
  const goal = range ? range[0] * 1000 : 2000;
  const pct = clamp((ml / goal) * 100, 0, 100);
  const reached = range && ml >= goal;
  return `
    <div class="water">
      <div class="muted small"><span>💧 Agua</span><span>${fmtL(ml)}${range ? ` / ${fmtRange(range)}` : ''}</span></div>
      <div class="bar" style="--c:var(--c-viaje)"><span style="--p:${pct}%"></span></div>
      <div class="water-actions">
        <button class="btn btn-sm btn-ghost" type="button" data-water="250">+ vaso</button>
        <button class="btn btn-sm btn-ghost" type="button" data-water="500">+ 500 ml</button>
        <button class="btn btn-sm btn-ghost" type="button" data-water="1000">+ 1 L</button>
        <button class="icon-btn" type="button" data-water="-250" aria-label="Quitar un vaso" ${ml ? '' : 'disabled'}>−</button>
        ${reached ? '<span class="small ok-text">Objetivo cumplido</span>' : ''}
      </div>
    </div>`;
}

function renderMyFoods() {
  if (!myFoods.length) {
    $('#myFoods').innerHTML = '<span class="muted small">Cuando guardes comidas aparecerán aquí para añadirlas con un toque.</span>';
    return;
  }
  // Agrupadas como las guardaste (Desayunos, Snacks…); las que no tienen grupo, al final
  const groups = [...new Set(myFoods.map((m) => m.group || 'Otras'))].sort((a, b) => (a === 'Otras') - (b === 'Otras'));
  $('#myFoods').innerHTML = groups.map((g) => `
    ${groups.length > 1 ? `<div class="chip-group">${esc(g)}</div>` : ''}
    ${myFoods.filter((m) => (m.group || 'Otras') === g).map((m) => `
      <span class="chip" title="${esc([m.desc, `${Math.round(m.p)} g prot · ${Math.round(m.c)} g hid · ${Math.round(m.f)} g grasa`].filter(Boolean).join('\n'))}">
        <button type="button" data-myfood-add="${m.id}">${esc(m.n)} <em>${Math.round(m.kcal)} kcal</em></button>
        ${m.variant ? `<button type="button" class="chip-variant" data-myfood-variant="${m.id}" title="${esc(m.variant.label)}: ${Math.round(m.kcal + m.variant.kcal)} kcal">${esc(m.variant.short || 'variante')}</button>` : ''}
        <button type="button" class="chip-x" data-myfood-del="${m.id}" aria-label="Borrar de mis comidas">×</button>
      </span>`).join('')}`).join('');
}

function renderEstimate() {
  const box = $('#foodEstimate');
  if (!estimate) { box.hidden = true; return; }
  box.hidden = false;
  const total = sumFood(estimate.parts.map(partNutrients));
  box.innerHTML = `
    ${estimate.parts.length ? `
    <table class="est-table">
      ${estimate.parts.map((p, i) => `
        <tr>
          <td>${esc(p.food.n)}${p.auto ? ' <em>(añadido)</em>' : ''}</td>
          <td class="est-qty"><input type="number" min="0" step="${p.food.mine ? '0.5' : '5'}" value="${round1(p.amount)}" data-est-qty="${i}" aria-label="Cantidad"> ${p.food.mine ? 'ración' : 'g'}</td>
          <td class="est-kcal">${Math.round(partNutrients(p).kcal)}</td>
          <td><button class="icon-btn" type="button" data-est-del="${i}" aria-label="Quitar">×</button></td>
        </tr>`).join('')}
      <tr class="est-total"><td>Total</td><td></td><td class="est-kcal">${Math.round(total.kcal)} kcal</td><td></td></tr>
    </table>
    <p class="muted small">${Math.round(total.p)} g proteína · ${Math.round(total.c)} g hidratos · ${Math.round(total.f)} g grasa · estimación casera, ajusta los gramos si hace falta.</p>`
    : '<p class="muted small">No he reconocido ningún alimento. Prueba con otras palabras o añádelo a mano.</p>'}
    ${estimate.unknown.length ? `<p class="small warn-text">No he reconocido: ${esc(estimate.unknown.join(', '))}. Añádelo a mano si cuenta.</p>` : ''}
    <div class="est-actions">
      <input type="text" id="estName" value="${esc(estimate.text)}" maxlength="80" aria-label="Nombre">
      <label class="check"><input type="checkbox" id="estSave"><span>Guardar en mis comidas</span></label>
      <button class="btn btn-primary btn-sm" type="button" id="estAdd" ${estimate.parts.length ? '' : 'disabled'}>Añadir</button>
    </div>`;
}

/* ---------------------------------------------------------
   EDITOR DE RUTINAS
   --------------------------------------------------------- */
function openRoutineEditor(id = null) {
  const r = id ? routines[id] : { label: '', type: 'gym', items: [] };
  const f = $('#routineForm');
  f.dataset.id = id || '';
  f.elements.label.value = r.label;
  f.elements.type.value = r.type;
  f.elements.items.value = r.items.map((i) => (i.sets ? `${i.name} | ${i.sets}` : i.name)).join('\n');
  f.elements.note.value = r.note || '';
  f.querySelectorAll('[name="days"]').forEach((c) => { c.checked = (r.days || []).includes(Number(c.value)); });
  $('#routineTitle').textContent = id ? 'Editar rutina' : 'Nueva rutina';
  $('#routineDelete').hidden = !id;
  $('#routineDialog').showModal();
}

/* ---------------------------------------------------------
   STRAVA (opcional, a través de tu puente de Google Apps Script)
   --------------------------------------------------------- */
async function loadStrava(force = false) {
  if (!stravaCfg?.url || !stravaCfg?.key) return;
  const cached = cache.get('strava');
  if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return;
  try {
    const after = Math.floor(startOfDay(addDays(-HEALTH.stravaDays)).getTime() / 1000);
    const res = await fetch(stravaCfg.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key: stravaCfg.key, after }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    activities = (data.activities || []).filter((a) => a.start);
    cache.set('strava', { at: Date.now(), list: activities });
    stravaSyncedAt = new Date();
    stravaError = null;
  } catch (e) {
    stravaError = e.message;
  }
  renderHealth();
  renderBriefing();
}

/* ---------------------------------------------------------
   RENDER GLOBAL Y EVENTOS
   --------------------------------------------------------- */
function renderHealth() {
  renderRoutines();
  renderRunning();
  renderKnee();
  renderCalendar();
  renderNutrition();
}

function bindHealth() {
  bindActivities(); // activities.js
  // Rutinas
  $('#newRoutine').addEventListener('click', () => openRoutineEditor());
  $('#routinesList').addEventListener('click', (e) => {
    const edit = e.target.closest('[data-routine-edit]');
    if (edit) { e.preventDefault(); openRoutineEditor(edit.dataset.routineEdit); return; }
    const today = e.target.closest('[data-routine-today]');
    if (today) {
      e.preventDefault();
      const r = routines[today.dataset.routineToday];
      trainLog = { ...trainLog, [TODAY]: [...(trainLog[TODAY] || []), { id: uid(), type: r.type, routineId: today.dataset.routineToday, title: '', done: true }] };
      saveTrainLog();
      refreshTraining();
      openDay(TODAY);
    }
  });
  $('#routineForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;
    const f = e.target.elements;
    const id = e.target.dataset.id || `r${uid()}`;
    routines = {
      ...routines,
      [id]: {
        label: f.label.value.trim() || 'Rutina',
        type: f.type.value,
        items: f.items.value.split('\n').map((l) => l.trim()).filter(Boolean)
          .map((l) => { const [name, sets = ''] = l.split('|').map((s) => s.trim()); return { name, sets }; }),
        days: [...e.target.querySelectorAll('[name="days"]:checked')].map((c) => Number(c.value)),
        note: f.note.value.trim(),
      },
    };
    saveRoutines();
    renderRoutines();
    renderCalendar();
  });
  $('#routineDelete').addEventListener('click', () => {
    const id = $('#routineForm').dataset.id;
    if (!id || !confirm(`¿Borrar la rutina «${routines[id].label}»? Los entrenos ya apuntados se mantienen.`)) return;
    const { [id]: removed, ...rest } = routines;
    routines = rest;
    // Los entrenos apuntados con esa rutina guardan su nombre
    Object.values(trainLog).forEach((list) => list.forEach((en) => {
      if (en.routineId === id) { en.title = en.title || removed.label; delete en.routineId; }
    }));
    saveRoutines();
    saveTrainLog();
    $('#routineDialog').close();
    renderHealth();
  });

  // Running: apuntar una carrera de hoy
  $('#runMode').addEventListener('change', () => {
    $('#runTime').placeholder = $('#runMode').value === 'pace' ? 'ritmo mm:ss /km' : 'tiempo mm:ss';
  });
  $('#runForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const km = parseFloat(String($('#runKm').value).replace(',', '.'));
    const clock = parseClock($('#runTime').value);
    if (!(km > 0) || !clock) { (!(km > 0) ? $('#runKm') : $('#runTime')).focus(); return; }
    const sec = $('#runMode').value === 'pace' ? Math.round(clock * km) : clock;
    const type = $('#runType').value;
    const now = new Date();
    saveActivity(TODAY, {
      id: uid(), type, title: defaultTitle(type, now), km, sec, done: true,
      kcal: estimateKcal(type, km, sec), kcalEst: true, startTime: fmtHour(now), source: 'manual',
    });
    e.target.reset();
  });

  // Rodillas
  const kneePanel = $('#kneePanel');
  const saveKnee = (side, value) => {
    const key = kneeDay();
    kneeLog = { ...kneeLog, [key]: { ...(kneeLog[key] || {}), [side]: value } };
    store.set('knee', kneeLog);
  };
  kneePanel.addEventListener('input', (e) => {
    const side = e.target.dataset.side;
    if (side === 'l' || side === 'r') {
      e.target.classList.remove('is-empty');
      const b = e.target.nextElementSibling;
      b.textContent = e.target.value;
      b.className = painClass(Number(e.target.value));
    }
  });
  kneePanel.addEventListener('change', (e) => {
    const side = e.target.dataset.side;
    if (!side) return;
    saveKnee(side, side === 'note' ? e.target.value.trim() : Number(e.target.value));
    renderKnee();
    renderBriefing();
  });
  kneePanel.addEventListener('click', (e) => {
    if (e.target.closest('[data-knee-zero]')) {
      saveKnee('l', 0);
      saveKnee('r', 0);
      renderKnee();
      renderBriefing();
      return;
    }
    const nav = e.target.closest('[data-knee-nav]');
    if (!nav) return;
    kneeOffset = Math.min(0, kneeOffset + Number(nav.dataset.kneeNav));
    renderKnee();
  });

  // Calendario y ficha del día
  $('#calendar').addEventListener('click', (e) => {
    const day = e.target.closest('.cal-day');
    if (day) openDay(day.dataset.date);
  });
  $('#fillCalendar').addEventListener('click', () => {
    const until = dateKey(addDays(41));
    if (!confirm(`¿Apuntar tus rutinas en sus días hasta el ${parseKey(until).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}?\n\nLos días que ya tengan algo apuntado no se tocan.`)) return;
    const added = fillCalendar(TODAY, until);
    refreshTraining();
    alert(added ? `${added} entrenos apuntados.` : 'No había días libres que rellenar.');
  });
  document.querySelectorAll('[data-cal-nav]').forEach((b) => b.addEventListener('click', () => {
    calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + Number(b.dataset.calNav), 1);
    renderCalendar();
  }));
  $('#enType').addEventListener('change', updateEntryForm);
  $('#enMode').addEventListener('change', updateEntryForm);
  $('#enRoutine').addEventListener('change', () => {
    const opt = $('#enRoutine').selectedOptions[0];
    if (opt?.dataset.type) { $('#enType').value = opt.dataset.type; updateEntryForm(); }
  });
  $('#enAdd').addEventListener('click', addEntryFromForm);
  $('#dayEntries').addEventListener('change', (e) => {
    const li = e.target.closest('[data-entry]');
    if (!li) return;
    const key = $('#dayDialog').dataset.date;
    if (e.target.matches('[data-entry-done]')) updateEntry(key, li.dataset.entry, (en) => ({ ...en, done: e.target.checked }));
    if (e.target.matches('[data-entry-move]')) {
      const to = e.target.value;
      if (!to || to === key) return;
      const moving = (trainLog[key] || []).find((en) => en.id === li.dataset.entry);
      // Si lo mueves al futuro queda pendiente; al pasado, como hecho
      updateEntry(key, li.dataset.entry, () => null);
      trainLog = { ...trainLog, [to]: [...(trainLog[to] || []), { ...moving, done: to <= TODAY ? moving.done : false }] };
      saveTrainLog();
      refreshTraining();
      renderDayEntries();
    }
    if (e.target.matches('[data-entry-ex]')) {
      const i = Number(e.target.dataset.entryEx);
      updateEntry(key, li.dataset.entry, (en) => {
        const ex = new Set(en.ex || []);
        e.target.checked ? ex.add(i) : ex.delete(i);
        return { ...en, ex: [...ex] };
      });
    }
  });
  $('#dayEntries').addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-entry-open]');
    if (openBtn) { const key = $('#dayDialog').dataset.date; $('#dayDialog').close(); openActivity(key, openBtn.closest('[data-entry]').dataset.entry); return; }
    if (!e.target.closest('[data-entry-del]')) return;
    updateEntry($('#dayDialog').dataset.date, e.target.closest('[data-entry]').dataset.entry, () => null);
  });

  // Perfil (peso, altura…)
  const profileDialog = $('#profileDialog');
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-profile]')) return;
    const p = { sex: 'm', activity: 1.55, deficit: 400, proteinPerKg: 1.8, ...(profile || {}) };
    const f = $('#profileForm');
    ['sex', 'age', 'height', 'weight', 'activity', 'deficit', 'proteinPerKg'].forEach((k) => { f.elements[k].value = p[k] ?? ''; });
    const fx = p.fixed || {};
    f.elements.useFixed.checked = !!fx.kcal;
    [['fxKcal', 'kcal'], ['fxP', 'p'], ['fxC', 'c'], ['fxF', 'f'], ['fxWaterMin', 'waterMin'], ['fxWaterMax', 'waterMax'], ['fxRunKcal', 'runKcal'], ['fxRunCarbs', 'runCarbs']]
      .forEach(([field, k]) => { f.elements[field].value = fx[k] ?? ''; });
    $('#fixedFields').disabled = !fx.kcal;
    profileDialog.showModal();
  });
  $('#profileForm').elements.useFixed.addEventListener('change', (e) => { $('#fixedFields').disabled = !e.target.checked; });
  $('#profileForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;
    const f = e.target.elements;
    const n = (el) => (el.value === '' ? null : Number(el.value));
    profile = {
      sex: f.sex.value, age: n(f.age), height: n(f.height), weight: n(f.weight),
      activity: Number(f.activity.value), deficit: Number(f.deficit.value), proteinPerKg: Number(f.proteinPerKg.value),
      fixed: f.useFixed.checked && n(f.fxKcal) ? {
        kcal: n(f.fxKcal), p: n(f.fxP) || 0, c: n(f.fxC) || 0, f: n(f.fxF) || 0,
        waterMin: n(f.fxWaterMin) || 0, waterMax: n(f.fxWaterMax) || n(f.fxWaterMin) || 0,
        runKcal: n(f.fxRunKcal) || 0, runCarbs: n(f.fxRunCarbs) || 0,
      } : null,
    };
    store.set('profile', profile);
    if (profile.weight) {
      const weights = store.get('weightLog', {});
      if (weights[TODAY] !== profile.weight) store.set('weightLog', { ...weights, [TODAY]: profile.weight });
    }
    renderNutrition();
    renderBriefing();
  });

  // Agua
  $('#nutriSummary').addEventListener('click', (e) => {
    const b = e.target.closest('[data-water]');
    if (!b) return;
    const key = foodDay();
    store.set(`water:${key}`, Math.max(0, waterOn(key) + Number(b.dataset.water)));
    renderNutrition();
    renderBriefing();
  });

  // Comidas: escribe lo que has comido y calcula
  const addFood = (item) => {
    food = [...food, { id: uid(), meal: $('#foodMeal').value, ...item }];
    store.set(`food:${foodDay()}`, food);
    renderNutrition();
    renderBriefing();
  };
  $('#foodForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#foodText').value.trim();
    if (!text) { $('#foodText').focus(); return; }
    estimate = estimateFood(text);
    renderEstimate();
  });
  $('#foodText').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#foodForm').requestSubmit(); }
  });
  $('#foodEstimate').addEventListener('input', (e) => {
    const i = e.target.dataset.estQty;
    if (i == null) return;
    estimate.parts[Number(i)].amount = Number(e.target.value) || 0;
    const kcalCell = e.target.closest('tr').querySelector('.est-kcal');
    kcalCell.textContent = Math.round(partNutrients(estimate.parts[Number(i)]).kcal);
    const total = sumFood(estimate.parts.map(partNutrients));
    $('#foodEstimate .est-total .est-kcal').textContent = `${Math.round(total.kcal)} kcal`;
  });
  $('#foodEstimate').addEventListener('click', (e) => {
    const del = e.target.closest('[data-est-del]');
    if (del) { estimate.parts.splice(Number(del.dataset.estDel), 1); renderEstimate(); return; }
    if (!e.target.closest('#estAdd')) return;
    const s = sumFood(estimate.parts.map(partNutrients));
    const name = $('#estName').value.trim() || estimate.text;
    const item = {
      name, kcal: s.kcal, p: round1(s.p), c: round1(s.c), f: round1(s.f),
      parts: estimate.parts.map((p) => ({ n: p.food.n, qty: p.food.mine ? `${round1(p.amount)} ración` : `${Math.round(p.amount)} g`, kcal: partNutrients(p).kcal })),
    };
    if ($('#estSave').checked) {
      myFoods = [...myFoods.filter((m) => norm(m.n) !== norm(name)), { id: uid(), n: name, kcal: s.kcal, p: round1(s.p), c: round1(s.c), f: round1(s.f) }];
      store.set('myFoods', myFoods);
    }
    addFood(item);
    estimate = null;
    $('#foodText').value = '';
    renderEstimate();
  });
  $('#manualFood').addEventListener('click', () => {
    const name = $('#mfName').value.trim();
    const kcal = Number($('#mfKcal').value);
    if (!name || !(kcal >= 0) || $('#mfKcal').value === '') { (!name ? $('#mfName') : $('#mfKcal')).focus(); return; }
    const item = { name, kcal, p: Number($('#mfProt').value) || 0, c: 0, f: 0 };
    if ($('#mfSave').checked) {
      myFoods = [...myFoods.filter((m) => norm(m.n) !== norm(name)), { id: uid(), n: name, kcal, p: item.p, c: 0, f: 0 }];
      store.set('myFoods', myFoods);
    }
    addFood(item);
    ['#mfName', '#mfKcal', '#mfProt'].forEach((s) => { $(s).value = ''; });
    $('#mfSave').checked = false;
  });
  $('#myFoods').addEventListener('click', (e) => {
    const add = e.target.closest('[data-myfood-add]');
    if (add) {
      const m = myFoods.find((x) => x.id === add.dataset.myfoodAdd);
      if (m) addFood({ name: m.n, kcal: m.kcal, p: m.p, c: m.c, f: m.f });
      return;
    }
    const variant = e.target.closest('[data-myfood-variant]');
    if (variant) {
      const m = myFoods.find((x) => x.id === variant.dataset.myfoodVariant);
      const v = m?.variant;
      if (v) addFood({ name: `${m.n} (${v.short || v.label})`, kcal: m.kcal + v.kcal, p: m.p + v.p, c: m.c + v.c, f: m.f + v.f });
      return;
    }
    const del = e.target.closest('[data-myfood-del]');
    if (del) {
      myFoods = myFoods.filter((x) => x.id !== del.dataset.myfoodDel);
      store.set('myFoods', myFoods);
      renderMyFoods();
    }
  });
  $('#foodList').addEventListener('click', (e) => {
    const del = e.target.closest('[data-food-del]');
    if (!del) return;
    food = food.filter((i) => i.id !== del.dataset.foodDel);
    store.set(`food:${foodDay()}`, food);
    renderNutrition();
    renderBriefing();
  });
  document.querySelectorAll('[data-food-nav]').forEach((b) => b.addEventListener('click', () => {
    foodOffset = Math.min(0, foodOffset + Number(b.dataset.foodNav));
    food = store.get(`food:${foodDay()}`, []);
    renderNutrition();
  }));
  const h = new Date().getHours();
  $('#foodMeal').value = h < 11 ? 'Desayuno' : h < 16 ? 'Comida' : h < 19 ? 'Merienda' : 'Cena';

  // Strava (solo si algún día configuras el puente)
  $('#stravaForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;
    const url = $('#stravaUrl').value.trim();
    const key = $('#stravaKey').value.trim();
    stravaCfg = url && key ? { url, key } : null;
    store.set('strava', stravaCfg);
    if (!stravaCfg) { activities = []; cache.set('strava', null); }
    renderHealth();
    loadStrava(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadStrava(false);
  });
}
