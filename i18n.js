'use strict';
/* =========================================================
   PANEL DE VIDA · i18n.js
   Panel en inglés: traduce los textos de la interfaz en pantalla.
   Tus datos (comidas, rutinas, tareas, correos, notas…) no se traducen.
   Las fechas y los números ya salen en inglés gracias a LOCALE (app.js).
   ========================================================= */

const I18N_EXACT = {
  // Navegación y cabeceras
  'Panel de vida': 'Life dashboard', 'Resumen': 'Overview', 'Uni & Proyectos': 'Uni & Projects', 'Hoja de ruta': 'Roadmap',
  'Salud & Deporte': 'Health & Sport', 'Entrenos': 'Workouts', 'Nutrición': 'Nutrition', 'Agenda & Viajes': 'Calendar & Travel',
  'Herramientas': 'Tools', 'Finanzas ↗': 'Finance ↗', 'Colores': 'Colours', 'Conectar Google': 'Connect Google',
  'Reconectar Google': 'Reconnect Google', 'Activar Gmail': 'Enable Gmail', 'Sincronizando…': 'Syncing…', 'Guardando…': 'Saving…',
  'Error al sincronizar': 'Sync error', 'Falta configurar Google': 'Google not set up', 'Falta marcar algún permiso': 'A permission is missing',
  'Google aún no ha cargado': 'Google has not loaded yet', '↻ Actualizar briefing': '↻ Refresh briefing', '✦ Briefing del día': '✦ Daily briefing',
  'Correos no leídos': 'Unread emails', 'Marcar todo visto': 'Mark all as seen', 'Ejemplo': 'Example', 'Ejemplo · conecta Google': 'Example · connect Google',
  'Hub universitario & proyectos': 'University & projects hub', 'Arrastra las tarjetas entre columnas': 'Drag cards between columns',
  'Añadir': 'Add', 'Pendiente': 'To do', 'En proceso': 'In progress', 'Hecho': 'Done', 'Arrastra tareas aquí': 'Drag tasks here',
  'Sin fecha': 'No date', 'Completada': 'Completed', 'Hoja de ruta · Futuro': 'Roadmap · Future', 'Ahora': 'Now', 'Pasado': 'Past',
  'Salud & deporte': 'Health & sport', '+ Nueva rutina': '+ New routine', 'Mis rutinas': 'My routines', 'Hecha hoy': 'Done today',
  'Actividades': 'Activities', '📷 Capturas': '📷 Screenshots', '⬆ GPX': '⬆ GPX', 'Atajo iPhone': 'iPhone shortcut',
  '🏃 Carrera': '🏃 Run', '🚴 Bici': '🚴 Ride', 'Último ritmo /km': 'Last pace /km', 'Media últimas 5': 'Average of last 5',
  'Última km/h': 'Last km/h', 'km esta semana': 'km this week', 'km este mes': 'km this month', 'Carrera': 'Run', 'Bici': 'Ride',
  'Tiempo total': 'Total time', 'Ritmo /km': 'Pace /km', 'Apuntar hoy': 'Log today', 'Rodillas': 'Knees', 'Hoy': 'Today', 'Ayer': 'Yesterday',
  'Mañana': 'Tomorrow', 'Dolor de 0 (nada) a 10 (máximo).': 'Pain from 0 (none) to 10 (worst).', 'Izquierda': 'Left', 'Derecha': 'Right',
  'Sin dolor en ninguna (0 y 0)': 'No pain in either (0 and 0)', 'hace 4 semanas': '4 weeks ago', 'hace 2 semanas': '2 weeks ago', 'hoy': 'today',
  'km corridos': 'km run', 'Calendario de entrenos': 'Workout calendar', 'Rellenar con mis rutinas': 'Fill with my routines',
  'Gimnasio': 'Gym', 'Running': 'Running', 'Otro': 'Other', 'Otro entreno': 'Other workout', 'Descanso': 'Rest',
  'Toca un día para apuntar lo que vas a hacer o lo que hiciste': 'Tap a day to log what you will do or what you did',
  'Carreras': 'Runs', 'Salidas': 'Rides', 'Otros': 'Others', 'Toca para apuntar': 'Tap to log',
  'Nutrición & calorías': 'Nutrition & calories', 'Mis datos': 'My data', '¿Qué has comido?': 'What did you eat?',
  'Calcular calorías': 'Calculate calories', 'Mis comidas': 'My meals', 'Añadir a mano (sé las calorías)': 'Add manually (I know the calories)',
  'Guardar en mis comidas': 'Save to my meals', 'Comidas': 'Meals', 'Calorías': 'Calories', 'Proteína': 'Protein', 'Hidratos': 'Carbs',
  'Grasas': 'Fat', '💧 Agua': '💧 Water', '+ vaso': '+ glass', 'Objetivo cumplido': 'Goal reached', 'Cambiar mis objetivos': 'Change my goals',
  'Poner mis datos': 'Enter my data', 'Aún no has apuntado nada este día.': 'Nothing logged for this day yet.',
  'Pon tus objetivos (o tu peso, altura y edad para calcularlos) en «Mis datos».': 'Set your goals (or your weight, height and age to calculate them) in “My data”.',
  'Desayuno': 'Breakfast', 'Comida': 'Lunch', 'Merienda': 'Afternoon snack', 'Cena': 'Dinner', 'Snack': 'Snack', 'Total': 'Total',
  '(añadido)': '(added)', 'No he reconocido ningún alimento. Prueba con otras palabras o añádelo a mano.': 'I did not recognise any food. Try other words or add it manually.',
  'Cuando guardes comidas aparecerán aquí para añadirlas con un toque.': 'Meals you save will appear here so you can add them with one tap.',
  'Próximos eventos': 'Upcoming events', 'No tienes eventos próximos.': 'No upcoming events.', '📝 Próximos exámenes': '📝 Upcoming exams',
  '📝 Próximo examen:': '📝 Next exam:', 'Examen': 'Exam', '✈ Milán · Diciembre': '✈ Milan · December', 'días': 'days', 'horas': 'hours',
  'seg': 'sec', 'Herramientas conectadas': 'Connected tools', 'Mi app de finanzas': 'My finance app', 'Campus virtual UVigo': 'UVigo virtual campus',
  'Correo': 'Email', 'Hojas de cálculo': 'Spreadsheets', 'Informes y dashboards': 'Reports and dashboards',
  // Categorías
  'Universidad': 'University', 'Proyecto': 'Project', 'Personal': 'Personal', 'Urgente': 'Urgent', 'Salud': 'Health', 'Viaje': 'Travel',
  'Finanzas': 'Finance',
  // Briefing
  'Hoy no tienes eventos en el calendario.': 'You have no calendar events today.', 'Hoy no tienes entrenos apuntados.': 'No workouts logged for today.',
  'Para hoy tienes apuntado:': 'Planned for today:', 'Hoy ya has hecho:': 'Done today:', 'Aún no has apuntado el dolor de rodillas de hoy.': 'You have not logged today’s knee pain yet.',
  'Tienes': 'You have', 'Hoy tienes': 'Today you have', 'Llevas': 'So far', 'Hoja de ruta:': 'Roadmap:', 'y': 'and', 'en': 'in', 'de': 'of',
  'Bandeja al día: no tienes correos sin leer.': 'Inbox zero: no unread emails.', 'Tareas pendientes': 'Pending tasks', 'Correos sin leer': 'Unread emails',
  'Días para Milán': 'Days to Milan', 'Sin entreno apuntado': 'No workout logged',
  // Ficha del día, rutinas y actividades
  'Apuntar lo que hiciste': 'Log what you did', 'Apuntar lo que vas a hacer': 'Log what you will do', 'Nada apuntado este día.': 'Nothing logged this day.',
  'Mover': 'Move', 'Ver': 'View', 'Borrar': 'Delete', 'Cerrar': 'Close', 'Cancelar': 'Cancel', 'Guardar': 'Save', 'Listo': 'Done',
  '— Sin rutina —': '— No routine —', 'Nueva rutina': 'New routine', 'Editar rutina': 'Edit routine', 'Nombre': 'Name', 'Tipo': 'Type',
  'Ejercicios (opcional, uno por línea)': 'Exercises (optional, one per line)', 'Qué días la haces (para rellenar el calendario)': 'Which days you do it (to fill the calendar)',
  'Notas (opcional)': 'Notes (optional)',
  'Aún no tienes rutinas. Crea las tuyas con «Nueva rutina»: nombre, tipo y, si quieres, los ejercicios.': 'You have no routines yet. Create yours with “New routine”: name, type and, if you like, the exercises.',
  'Actividad': 'Activity', 'Nueva actividad': 'New activity', 'Actividad desde capturas': 'Activity from screenshots', 'Fecha': 'Date', 'Km': 'Km',
  'Tiempo (h:mm:ss)': 'Time (h:mm:ss)', 'Guardar actividad': 'Save activity', 'km': 'km', 'en movimiento': 'moving time', 'ritmo /km': 'pace /km',
  'kcal': 'kcal', 'desnivel +': 'elevation gain', 'ppm media': 'avg bpm', 'pasos/min': 'steps/min', 'Altitud': 'Elevation', 'Parciales': 'Splits',
  'Sin recorrido: esta actividad llegó desde el atajo o a mano. Sube su GPX para ver el mapa.': 'No route: this activity came from the shortcut or was entered manually. Upload its GPX to see the map.',
  'Todas las carreras': 'All runs', 'Todas las salidas en bici': 'All rides', 'No hay actividades.': 'No activities.',
  'A mano': 'Manual', 'GPX': 'GPX', 'Atajo de iPhone': 'iPhone shortcut', 'Capturas de Fitness': 'Fitness screenshots',
  'Revisa los datos leídos de las capturas antes de guardar.': 'Check the data read from the screenshots before saving.',
  'Las calorías van estimadas con tu peso; cámbialas si tu reloj dice otra cosa.': 'Calories are estimated from your weight; change them if your watch says otherwise.',
  '* Calorías estimadas con tu peso.': '* Calories estimated from your weight.', 'Preparando el lector de capturas… (la primera vez tarda un poco más)': 'Preparing the screenshot reader… (the first time takes a bit longer)',
  'Aún no hay carreras.': 'No runs yet.', 'Aún no hay salidas en bici.': 'No rides yet.',
  'Súbelas con capturas, un GPX, el atajo o a mano.': 'Add them with screenshots, a GPX, the shortcut or manually.',
  // Mis objetivos / perfil
  'Mis objetivos': 'My goals', 'Se guardan solo en tu navegador y en tu Drive privado, nunca en GitHub.': 'Stored only in your browser and your private Drive, never on GitHub.',
  'Usar mis objetivos fijos': 'Use my fixed goals', 'Calorías al día': 'Calories per day', 'Proteína (g)': 'Protein (g)', 'Hidratos (g)': 'Carbs (g)',
  'Grasas (g)': 'Fat (g)', 'Agua (L, de…)': 'Water (L, from…)', '…a (L)': '…to (L)', 'Día de carrera: + kcal': 'Run day: + kcal',
  'Día de carrera: + hidratos (g)': 'Run day: + carbs (g)', 'Para el cálculo automático (si no usas objetivos fijos)': 'For the automatic calculation (if you do not use fixed goals)',
  'Sexo': 'Sex', 'Hombre': 'Male', 'Mujer': 'Female', 'Edad': 'Age', 'Altura (cm)': 'Height (cm)', 'Peso (kg)': 'Weight (kg)',
  'Actividad (con todo lo que entrenas)': 'Activity level (including all your training)', 'Sedentaria · casi no entreno': 'Sedentary · barely train',
  'Ligera · 1–3 días a la semana': 'Light · 1–3 days a week', 'Moderada · 3–5 días a la semana': 'Moderate · 3–5 days a week',
  'Alta · 6–7 días a la semana': 'High · 6–7 days a week', 'Muy alta · doble sesión o trabajo físico': 'Very high · two sessions or physical job',
  'Déficit': 'Deficit', 'Mantener (0 kcal)': 'Maintain (0 kcal)', 'Suave (−250 kcal)': 'Mild (−250 kcal)', 'Moderado (−400 kcal)': 'Moderate (−400 kcal)',
  'Agresivo (−750 kcal)': 'Aggressive (−750 kcal)', 'Proteína (g por kg)': 'Protein (g per kg)',
  'Cálculo: metabolismo basal (fórmula Mifflin-St Jeor) × actividad − déficit. Es una estimación.': 'Calculation: basal metabolism (Mifflin-St Jeor) × activity − deficit. It is an estimate.',
  // Colores, Strava, Google
  'Códigos de color': 'Colour codes', 'Cambia el color de cada categoría. Se guarda en este navegador.': 'Change the colour of each category. Saved in this browser.',
  'Restablecer': 'Reset', 'Desconectar Google': 'Disconnect Google', 'Conectar Strava': 'Connect Strava', 'URL del puente': 'Bridge URL',
  'Clave del panel': 'Dashboard key', 'Guardar y conectar': 'Save and connect',
  // Viaje
  'Check-in online': 'Online check-in', 'DNI / pasaporte': 'ID / passport', 'Reservar Última Cena (Da Vinci)': 'Book the Last Supper (Da Vinci)',
  'Abrigo y paraguas': 'Coat and umbrella', 'Vuelo a Milán Malpensa (MXP)': 'Flight to Milan Malpensa (MXP)', '4 noches': '4 nights',
  '¡Viaje completado! Ciao, Milano 👋': 'Trip completed! Ciao, Milano 👋', '¡Estás en Milán! Buon viaggio ✨': 'You are in Milan! Buon viaggio ✨',
  // Días de la semana (abreviados y letras del calendario)
  'Lun': 'Mon', 'Mar': 'Tue', 'Mié': 'Wed', 'Jue': 'Thu', 'Vie': 'Fri', 'Sáb': 'Sat', 'Dom': 'Sun',
  'L': 'M', 'M': 'T', 'X': 'W', 'J': 'T', 'V': 'F', 'S': 'S', 'D': 'S',
  // Hoja de ruta
  'Inicio de 3º ADE': 'Start of 3rd year (Business)', '3º de ADE': '3rd year of Business (ADE)', 'Base Microsoft (sin gastar dinero)': 'Microsoft foundations (for free)',
  'Final de 3º': 'End of 3rd year', 'Prácticas en Altia': 'Internship at Altia', '4º de ADE': '4th year of Business (ADE)', 'Consolidación': 'Consolidation',
  'El salto global': 'The global leap', 'La meta final': 'The final goal', 'Curso 2026/27': 'Academic year 2026/27', 'Curso 2027/28': 'Academic year 2027/28',
  'Ene 2027': 'Jan 2027', 'Mar – Jun 2027': 'Mar – Jun 2027', 'Verano 2027': 'Summer 2027', 'Años 1–2': 'Years 1–2', 'Años 3–5': 'Years 3–5', 'Año 6+': 'Year 6+',
  'Entrar a 3º con ventaja y acostumbrar el ojo a la terminología en inglés (ETL, Star Schema, Measures).': 'Start 3rd year ahead and get used to English terminology (ETL, Star Schema, Measures).',
  'Perfil híbrido ADE + Python + Power BI + SQL, y desbloquear el límite de créditos para las prácticas.': 'Hybrid profile Business + Python + Power BI + SQL, and unlock the credit limit for internships.',
  'Aprovechar la baja carga lectiva para preparar PL-300 y DP-600 con material oficial y entornos gratuitos.': 'Use the lighter course load to prepare PL-300 and DP-600 with official material and free environments.',
  'Asegurar la plaza de verano en Data & Analytics / Business Intelligence de Altia en Vigo.': 'Secure the summer place in Data & Analytics / Business Intelligence at Altia in Vigo.',
  'Demostrar solvencia técnica y visión de negocio desde el primer día para seguir durante 4º.': 'Show technical skill and business sense from day one to stay on during 4th year.',
  'Graduarme con más de un año de experiencia real en consultoría.': 'Graduate with more than a year of real consulting experience.',
  'Blindar el CV con la acreditación de Microsoft y un máster oficial mientras genero ingresos en Vigo.': 'Strengthen the CV with the Microsoft certification and an official master’s while earning in Vigo.',
  'Multiplicar el salario (45–65k €+) en remoto o en multinacionales: inglés + PL-300 + experiencia.': 'Multiply the salary (45–65k €+) remote or at multinationals: English + PL-300 + experience.',
  'Superar los 80–100k € anuales con autonomía, liderazgo de equipos y flexibilidad geográfica.': 'Go beyond 80–100k € a year with autonomy, team leadership and geographic flexibility.',
  'Subir los primeros dashboards al portfolio (Kaggle / GitHub)': 'Upload the first dashboards to the portfolio (Kaggle / GitHub)',
  'Compartir los primeros hitos en LinkedIn': 'Share the first milestones on LinkedIn', 'Cambiar el sistema operativo y los programas a inglés': 'Switch the operating system and apps to English',
  'Recuperar las 2 materias pendientes y superar los 120 ECTS': 'Pass the 2 pending subjects and exceed 120 ECTS',
  'Microcredencial de Python para Análisis de Datos (UVigo & Santander)': 'Python for Data Analysis micro-credential (UVigo & Santander)',
  'Dominar Pandas y NumPy': 'Master Pandas and NumPy', 'Aprender la sintaxis básica de SQL': 'Learn basic SQL syntax',
  'Simulación Forage · Accenture Data': 'Forage simulation · Accenture Data', 'Simulación Forage · Deloitte Consulting': 'Forage simulation · Deloitte Consulting',
  'Ruta de Microsoft Learn para PL-300 (con laboratorios)': 'Microsoft Learn path for PL-300 (with labs)', 'Ruta de Microsoft Learn para DP-600': 'Microsoft Learn path for DP-600',
  'Activar la prueba gratuita de Fabric (60 días) a principios de enero': 'Activate the free Fabric trial (60 days) in early January',
  'Crear un Lakehouse, ingerir datos y conectarlo a Power BI': 'Create a Lakehouse, ingest data and connect it to Power BI',
  'Modelado y primeros pasos con DAX (Datdata, en español)': 'Modelling and first steps with DAX (Datdata, in Spanish)',
  'Arquitectura de Fabric con Guy in a Cube y DAX avanzado con SQLBI': 'Fabric architecture with Guy in a Cube and advanced DAX with SQLBI',
  'Tramitar el convenio de prácticas extracurriculares (Telepráctica UVigo)': 'Process the extracurricular internship agreement (UVigo Telepráctica)',
  'Portfolio con 4–5 proyectos prácticos': 'Portfolio with 4–5 practical projects',
  'Presentar el portfolio de Power BI y Python a los responsables de Altia': 'Present the Power BI and Python portfolio to Altia’s managers',
  'Aplicar modelado Star Schema, flujos ETL y dashboards ejecutivos': 'Apply Star Schema modelling, ETL flows and executive dashboards',
  'Familiarizarme con Microsoft Fabric': 'Get familiar with Microsoft Fabric', 'Metodologías ágiles (Scrum / Jira)': 'Agile methodologies (Scrum / Jira)',
  'Enlazar con prácticas curriculares en Altia para convalidar créditos': 'Continue with curricular internship at Altia to validate credits',
  'Solicitar la convalidación de créditos optativos': 'Apply for elective credit recognition', 'TFG aplicado a Business Intelligence / analítica empresarial': 'Final project applied to Business Intelligence / business analytics',
  'Contrato fijo en Altia como Junior BI Consultant (20–26k)': 'Permanent contract at Altia as Junior BI Consultant (20–26k)',
  'Máster oficial compatible con el trabajo (Beca MEC)': 'Official master’s compatible with work (MEC grant)',
  'Aprobar la certificación Microsoft PL-300 (Power BI Data Analyst)': 'Pass the Microsoft PL-300 certification (Power BI Data Analyst)',
  'CV y LinkedIn 100% en inglés': 'CV and LinkedIn 100% in English', 'Big Four (Deloitte, PwC) o full remote para Reino Unido, EE. UU. o norte de Europa': 'Big Four (Deloitte, PwC) or full remote for the UK, US or northern Europe',
  'Lead Data Consultant, BI Manager o responsable de datos en cliente internacional': 'Lead Data Consultant, BI Manager or head of data at an international client',
  // Alimentos de la tabla casera (aparecen en la estimación)
  'Aceite (plancha)': 'Oil (grilled)', 'Aceite (fritura)': 'Oil (fried)', 'Aceite de oliva': 'Olive oil', 'Pechuga de pollo': 'Chicken breast',
  'Arroz blanco cocido': 'Cooked white rice', 'Ensalada': 'Salad', 'Café con leche (semidesnatada)': 'White coffee (semi-skimmed)',
  'Tostada de pan': 'Toast', 'Tomate rallado': 'Grated tomato', 'Pasta cocida': 'Cooked pasta', 'Huevo': 'Egg', 'Huevo frito': 'Fried egg',
  'Patatas fritas caseras': 'Home-made chips', 'Patata cocida': 'Boiled potato', 'Lentejas guisadas': 'Lentil stew', 'Yogur griego': 'Greek yoghurt',
  'Yogur natural': 'Plain yoghurt', 'Plátano': 'Banana', 'Manzana': 'Apple', 'Leche semidesnatada': 'Semi-skimmed milk', 'Azúcar': 'Sugar',
  'Pescado blanco (merluza…)': 'White fish (hake…)', 'Salmón': 'Salmon', 'Atún al natural (lata)': 'Tuna in water (can)', 'Pizza': 'Pizza',
  'Cerveza': 'Beer', 'Vino': 'Wine', 'Agua': 'Water', 'Tortilla de patatas': 'Spanish omelette', 'Empanada gallega': 'Galician empanada',
  'Croquetas': 'Croquettes', 'Proteína en polvo (batido)': 'Protein powder (shake)', 'Copos de avena': 'Oat flakes', 'Fruta': 'Fruit',
  // Atributos (placeholder, title, aria-label)
  'Capturas de la ficha del entreno en Fitness': 'Screenshots of the workout details in Fitness', 'Comida del día': "Today's food",
  'Dolor de rodillas y kilómetros de los últimos 28 días': 'Knee pain and kilometres over the last 28 days', 'Día anterior': 'Previous day',
  'Día siguiente': 'Next day', 'Kilómetros': 'Kilometres', 'Mes anterior': 'Previous month', 'Mes siguiente': 'Next month',
  'Mover atrás': 'Move back', 'Mover adelante': 'Move forward', 'Eliminar': 'Delete', 'Marcar como leído': 'Mark as read', 'Quitar': 'Remove',
  'Quitar un vaso': 'Remove a glass', 'Cantidad': 'Amount', 'Minutos': 'Minutes', 'Tiempo o ritmo': 'Time or pace', 'minutos (opcional)': 'minutes (optional)',
  'tiempo mm:ss': 'time mm:ss', 'ritmo mm:ss /km': 'pace mm:ss /km', 'Notas: series, pesos, sensaciones…': 'Notes: sets, weights, how it felt…',
  'Nota (p. ej. molestia al bajar escaleras)': 'Note (e.g. discomfort going downstairs)', 'p. ej. 1750': 'e.g. 1750',
  'p. ej. Dejar 1–2 reps en recámara': 'e.g. Leave 1–2 reps in reserve', 'Borrar de mis comidas': 'Remove from my meals',
  'Nombre (opcional)': 'Name (optional)', 'Nueva tarea…': 'New task…', 'Rutina': 'Routine', 'p. ej. Pecho y tríceps, Rodaje suave…': 'e.g. Chest and triceps, Easy run…',
  'Pega la URL de tu puente de Google Apps Script y su clave. Los pasos están en el README del repositorio (sección «Conectar Strava»).': 'Paste the URL of your Google Apps Script bridge and its key. The steps are in the repository README (“Conectar Strava” section).',
  'URL del puente': 'Bridge URL', 'Clave del panel': 'Dashboard key',
};

// Frases con números o partes variables (se comparan con el texto completo de cada trozo)
const I18N_RULES = [
  [/^\((\d+)\/(\d+)\)\. Siguiente paso: (.+)\.$/, (_, a, b, s) => `(${a}/${b}). Next step: ${tr(s)}.`],
  [/^Buen(os días|as tardes|as noches), (.+)$/, (_, p, n) => `${{ 'os días': 'Good morning', 'as tardes': 'Good afternoon', 'as noches': 'Good evening' }[p]}, ${n}`],
  [/^(\d+) tareas? pendientes?$/, (_, n) => `${n} pending task${n === '1' ? '' : 's'}`],
  [/^\((\d+) en proceso\)( y)?\.?$/, (_, n, y) => `(${n} in progress)${y ? ' and' : '.'}`],
  [/^vence(n?) en 2 días o menos\.$/, () => 'due in 2 days or less.'],
  [/^(\d+) correos? sin leer$/, (_, n) => `${n} unread email${n === '1' ? '' : 's'}`],
  [/^\((.+)\)\.(?: Lo importante: (.+)\.)?$/, (_, cats, imp) => `(${cats.replace(/(\d+) de ([a-záéíóú]+)/g, (__, n, c) => `${n} ${(I18N_EXACT[c.charAt(0).toUpperCase() + c.slice(1)] || c).toLowerCase()}`).replace(/ y /g, ' and ')}).${imp ? ` Important: ${imp.replace(/» de /g, '» from ')}.` : ''}`],
  [/^(\d+) eventos?$/, (_, n) => `${n} event${n === '1' ? '' : 's'}`],
  [/^en (\d+) días$/, (_, n) => `in ${n} days`],
  [/^(\d+) días$/, (_, n) => `${n} days`],
  [/^\((.+)\)\.(?: Tienes (\d+) exámenes en las próximas 2 semanas\.)?$/, (_, d, n) => `(${d}).${n ? ` You have ${n} exams in the next 2 weeks.` : ''}`],
  [/^(\d+) de (\d+) kcal$/, (_, a, b) => `${a} of ${b} kcal`],
  [/^(?:\(día de carrera\) )?y (\d+) de (\d+) g de proteína\.(?: Agua: (.+) de (.+)\.)?$/, (m, a, b, w1, w2) => `${m.includes('día de carrera') ? '(run day) ' : ''}and ${a} of ${b} g of protein.${w1 ? ` Water: ${w1} of ${w2}.` : ''}`],
  [/^\(día de carrera\) y (\d+) de (\d+) g de proteína\.(.*)$/, (_, a, b, rest) => `(run day) and ${a} of ${b} g of protein.${rest.replace(' Agua: ', ' Water: ').replace(/ de /, ' of ')}`],
  [/^⏰ Recordatorio: (.*)$/, (_, r) => `⏰ Reminder: ${r}`],
  [/^Recordatorio: (.*)$/, (_, r) => `Reminder: ${r}`],
  [/^En (\d+) días$/, (_, n) => `In ${n} days`],
  [/^Venció hace (\d+) d$/, (_, n) => `Overdue by ${n} d`],
  [/^Ver todas \((\d+)\)$/, (_, n) => `See all (${n})`],
  [/^Carreras · (.+) km$/, (_, n) => `Runs · ${n} km`],
  [/^Bici · (.+) km$/, (_, n) => `Rides · ${n} km`],
  [/^km semana · (.+) mes$/, (_, n) => `km week · ${n} month`],
  [/^(.+) km semana · (.+) mes$/, (_, a, b) => `${a} km week · ${b} month`],
  [/^Te quedan (\d+) kcal$/, (_, n) => `${n} kcal left`],
  [/^Te has pasado (\d+) kcal$/, (_, n) => `${n} kcal over`],
  [/^Tu objetivo fijo \(los días que corres sube a (\d+) kcal\)\.$/, (_, n) => `Your fixed goal (on run days it goes up to ${n} kcal).`],
  [/^Tu objetivo fijo \+ (\d+) kcal y (\d+) g de hidratos por día de carrera 🏃\.$/, (_, a, b) => `Your fixed goal + ${a} kcal and ${b} g of carbs for a run day 🏃.`],
  [/^Tu objetivo fijo\.$/, () => 'Your fixed goal.'],
  [/^Gasto estimado (\d+) kcal \(metabolismo basal (\d+) × actividad\) − déficit (\d+)\.$/, (_, a, b, c) => `Estimated expenditure ${a} kcal (basal metabolism ${b} × activity) − deficit ${c}.`],
  [/^Llevas (\d+) kcal y (\d+) g de proteína\.$/, (_, a, b) => `So far ${a} kcal and ${b} g of protein.`],
  [/^(\d+) g proteína · (\d+) g hidratos · (\d+) g grasa · estimación casera, ajusta los gramos si hace falta\.$/, (_, p, c, f) => `${p} g protein · ${c} g carbs · ${f} g fat · home-cooking estimate, adjust the grams if needed.`],
  [/^No he reconocido: (.+)\. Añádelo a mano si cuenta\.$/, (_, w) => `I did not recognise: ${w}. Add it manually if it matters.`],
  [/^(\d+) kcal · (\d+) g prot\.$/, (_, a, b) => `${a} kcal · ${b} g prot.`],
  [/^Ese día corriste (.+)\.$/, (_, k) => `That day you ran ${k.replace(/ y /g, ' and ')}.`],
  [/^Sincronizado (\d\d:\d\d)$/, (_, h) => `Synced ${h}`],
  [/^(\d+) m de desnivel$/, (_, n) => `${n} m elevation gain`],
  [/^(\d+) parciales$/, (_, n) => `${n} splits`],
  [/^Leyendo captura (\d+) de (\d+)…$/, (_, a, b) => `Reading screenshot ${a} of ${b}…`],
  [/^cada (.+) km$/, (_, n) => `every ${n} km`],
  [/^Revisa los datos leídos de las capturas antes de guardar\. No he encontrado las calorías: van estimadas\.$/, () => 'Check the data read from the screenshots before saving. I could not find the calories: they are estimated.'],
  [/^Semana del (.+)$/, (_, d) => `Week of ${d}`],
  [/^Hoy: (.+)$/, (_, x) => `Today: ${tr(x)}`],
  [/^(.+) \(elegido para este día\)$/, (_, s) => `${tr(s)} (chosen for this day)`],
];

function i18nRule(core) {
  for (const [re, fn] of I18N_RULES) {
    const m = core.match(re);
    if (m) return fn(...m);
  }
  return null;
}

// Traduce un texto conservando los espacios de alrededor
function tr(s) {
  if (LANG !== 'en' || !s) return s;
  if (s.includes('\n')) return s.split('\n').map(tr).join('\n');
  const core = s.trim();
  if (!core) return s;
  let out = I18N_EXACT[core] ?? i18nRule(core);
  // Etiquetas compuestas con « · » (p. ej. "Running · A mano"): se traduce cada parte
  if (out == null && core.includes(' · ')) {
    const parts = core.split(' · ');
    const tp = parts.map((p) => I18N_EXACT[p] ?? i18nRule(p) ?? p);
    if (tp.some((p, i) => p !== parts[i])) out = tp.join(' · ');
  }
  if (out == null) return s;
  return s.slice(0, s.indexOf(core)) + out + s.slice(s.indexOf(core) + core.length);
}

if (LANG === 'en') {
  document.documentElement.lang = 'en';
  // No se traduce lo que escribes tú
  const SKIP = '[data-no-i18n], script, style, textarea, .tool-icon, .avatar, .kcard-title, #emailList, .event-title, .exam-title, .food-name, .de-title, .de-note, .de-ex, .routine-items, .routine-head > span:first-child, .routine-note, .act-body b, #actTitle, .chip button > span, .knee-note';
  const done = new WeakMap(); // nodo → último texto traducido (evita traducir dos veces)
  const ATTRS = ['placeholder', 'title', 'aria-label'];

  const doText = (node) => {
    if (done.get(node) === node.nodeValue) return;
    const el = node.parentElement;
    if (!el || el.closest(SKIP)) return;
    const t = tr(node.nodeValue);
    if (t !== node.nodeValue) node.nodeValue = t;
    done.set(node, node.nodeValue);
  };
  const doAttrs = (el) => {
    if (el.closest(SKIP)) return;
    ATTRS.forEach((a) => {
      const v = el.getAttribute(a);
      if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); }
    });
  };
  const walk = (root) => {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.matches?.('[placeholder],[title],[aria-label]')) doAttrs(root);
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(doAttrs);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) doText(n);
  };

  new MutationObserver((list) => list.forEach((m) => {
    if (m.type === 'characterData') doText(m.target);
    else if (m.type === 'attributes') doAttrs(m.target);
    else m.addedNodes.forEach(walk);
  })).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  document.addEventListener('DOMContentLoaded', () => { walk(document.body); i18nStatic(); });

  // Avisos y confirmaciones: se traduce cada línea
  const trMsg = (msg) => String(msg).split('\n').map((l) => tr(I18N_MSG(l))).join('\n');
  const nativeAlert = window.alert.bind(window), nativeConfirm = window.confirm.bind(window);
  window.alert = (m) => nativeAlert(trMsg(m));
  window.confirm = (m) => nativeConfirm(trMsg(m));
}

// Mensajes de avisos y confirmaciones
function I18N_MSG(l) {
  const rules = [
    [/^¿Borrar la rutina «(.+)»\? Los entrenos ya apuntados se mantienen\.$/, (_, n) => `Delete the routine “${n}”? Workouts already logged are kept.`],
    [/^¿Apuntar tus rutinas en sus días hasta el (.+)\?$/, (_, d) => `Log your routines on their days until ${d}?`],
    [/^Los días que ya tengan algo apuntado no se tocan\.$/, () => 'Days that already have something logged are not changed.'],
    [/^(\d+) entrenos apuntados\.$/, (_, n) => `${n} workouts logged.`],
    [/^No había días libres que rellenar\.$/, () => 'There were no free days to fill.'],
    [/^No se borra nada de lo que ya tienes\.$/, () => 'Nothing you already have is deleted.'],
    [/^¿Importar (.+)\?$/, (_, w) => `Import ${w.replace(/ rutinas/, ' routines').replace(/ comidas habituales/, ' usual meals').replace(/tus objetivos/, 'your goals').replace(/ y /g, ' and ')}?`],
    [/^Listo: (.+)\.$/, (_, w) => `Done: ${w.replace(/ rutinas guardadas y (\d+) entrenos apuntados en el calendario/, ' routines saved and $1 workouts added to the calendar').replace(/objetivos guardados/, 'goals saved').replace(/ comidas guardadas/, ' meals saved').replace(/ y /g, ' and ')}.`],
    [/^Ya tienes una actividad casi igual ese día\. ¿Guardarla de todas formas\?$/, () => 'You already have an almost identical activity that day. Save it anyway?'],
    [/^¿Guardar esta actividad de hoy\?$/, () => 'Save this activity for today?'],
    [/^(Carrera|Bici) de (.+) km(.*)$/, (_, t, k, r) => `${t === 'Bici' ? 'Ride' : 'Run'} of ${k} km${r.replace(' en ', ' in ')}`],
    [/^¿Borrar esta actividad\?$/, () => 'Delete this activity?'],
    [/^El enlace de importación no es válido\.$/, () => 'The import link is not valid.'],
    [/^El archivo no es un GPX válido\.$/, () => 'The file is not a valid GPX.'],
    [/^El GPX no tiene puntos de recorrido\.$/, () => 'The GPX has no track points.'],
    [/^No he encontrado distancia ni tiempo en las capturas\. (.*)$/, () => 'I could not find distance or time in the screenshots. Try the “Workout Details” screen.'],
    [/^No se pudieron leer las capturas\.$/, () => 'The screenshots could not be read.'],
  ];
  for (const [re, fn] of rules) { const m = l.match(re); if (m) return fn(...m); }
  return l;
}

// Bloques largos con mucho formato: se sustituyen enteros en inglés
function i18nStatic() {
  const sc = document.querySelector('#shortcutDialog');
  if (!sc) return;
  sc.querySelector('h2').textContent = '“Upload workout” shortcut';
  const ps = sc.querySelectorAll(':scope > p');
  ps[0].textContent = 'After a workout recorded with the Apple Watch or the iPhone, run the shortcut and the activity is saved here with the km, time and calories from the Health app. The map cannot be read from Shortcuts: for the route, upload the GPX.';
  sc.querySelector('.dlg-sub').textContent = 'How to build it (Shortcuts app → +)';
  sc.querySelector('.steps-list').innerHTML = `
    <li><b>Choose from Menu</b> with two options: <code>Carrera</code> and <code>Bici</code>. In each, add <b>Text</b> with <code>run</code> or <code>bike</code> and <b>Set Variable</b> <code>Tipo</code>.</li>
    <li><b>Ask for Input</b> of type number: “How many minutes did it last?”. Set the variable <code>Minutos</code>.</li>
    <li><b>Find Health Samples</b>: type <i>Walking + Running Distance</i> (in the second branch: <i>Cycling Distance</i>), with “Start Date is in the last <code>Minutos</code> minutes”. Then <b>Calculate Statistics → Sum</b> and set it to <code>Km</code>.</li>
    <li><b>Find Health Samples</b> of <i>Active Energy</i> in the same minutes → <b>Calculate Statistics → Sum</b> → variable <code>Kcal</code>.</li>
    <li><b>URL</b> with this text, replacing the capitalised words with your variables:<br><code class="url-code">${document.querySelector('#shortcutUrl')?.textContent || ''}</code></li>
    <li><b>Open URLs</b>. The dashboard will ask whether to save the activity.</li>`;
  ps[1].innerHTML = 'Give the shortcut an icon and add it to your Home Screen or Apple Watch. If you use <code>tipo=bike</code> in the URL it is saved as a ride. You can add <code>&amp;titulo=Easy run</code>.';
}
