-- ============================================================================
--  RUMBO - catalogos de referencia
--  Correr DESPUES de 01-esquema.sql, en Supabase > SQL Editor.
--  Es idempotente: vuelve a correrse sin duplicar nada (on conflict do nothing).
--
--  Estos datos son iguales para todos los usuarios. No tienen user_id: se leen,
--  no se escriben desde la app. Cada persona sigue teniendo sus propios
--  ejercicios (public.ejercicios) y alimentos (public.alimentos).
-- ============================================================================


-- ---------------------------------------------------------------------------
--  1. Ejercicios
--
--  'patron' es el movimiento, no el musculo. Una rutina seria se arma cubriendo
--  patrones (empujar, traccionar, flexionar la rodilla, bisagra de cadera,
--  llevar algo de un lado al otro) y recien despues se elige con que ejercicio
--  cubrir cada uno segun el equipo que haya. Por eso el generador filtra por
--  patron + equipo + nivel.
--
--  equipo: barra | mancuernas | maquina | polea | peso_corporal | kettlebell
--          | banda | cardio | otro
-- ---------------------------------------------------------------------------

insert into public.ejercicios_base (nombre, patron, grupos, equipo, nivel, notas) values

-- Empuje horizontal
('Press banca con barra',            'empuje_horizontal', '{pecho,triceps,hombros}', 'barra',        'intermedio',   'Omoplatos juntos y hacia abajo. La barra baja a la linea del pezon.'),
('Press banca con mancuernas',       'empuje_horizontal', '{pecho,triceps,hombros}', 'mancuernas',   'principiante', 'Mas rango que la barra y mas amable con el hombro.'),
('Press inclinado con barra',        'empuje_horizontal', '{pecho,hombros,triceps}', 'barra',        'intermedio',   'Banco a 30 grados. Mas inclinacion ya es press de hombros.'),
('Press inclinado con mancuernas',   'empuje_horizontal', '{pecho,hombros,triceps}', 'mancuernas',   'principiante', null),
('Press plano en maquina',           'empuje_horizontal', '{pecho,triceps}',         'maquina',      'principiante', 'Buena primera opcion: no hay que estabilizar la carga.'),
('Flexiones de brazos',              'empuje_horizontal', '{pecho,triceps,core}',    'peso_corporal','principiante', 'Cuerpo en una linea. Si es facil, subi los pies.'),
('Flexiones con pies elevados',      'empuje_horizontal', '{pecho,hombros,triceps}', 'peso_corporal','intermedio',   null),
('Aperturas con mancuernas',         'empuje_horizontal', '{pecho}',                 'mancuernas',   'principiante', 'Codos apenas flexionados y fijos.'),
('Cruce en polea',                   'empuje_horizontal', '{pecho}',                 'polea',        'principiante', null),
('Fondos en paralelas',              'empuje_horizontal', '{pecho,triceps}',         'peso_corporal','avanzado',     'Inclinar el torso adelante carga mas pecho.'),

-- Empuje vertical
('Press militar con barra',          'empuje_vertical',   '{hombros,triceps,core}',  'barra',        'intermedio',   'Gluteos y abdomen firmes: la espalda no se arquea.'),
('Press de hombros con mancuernas',  'empuje_vertical',   '{hombros,triceps}',       'mancuernas',   'principiante', null),
('Press Arnold',                     'empuje_vertical',   '{hombros,triceps}',       'mancuernas',   'intermedio',   null),
('Press de hombros en maquina',      'empuje_vertical',   '{hombros,triceps}',       'maquina',      'principiante', null),
('Flexiones pike',                   'empuje_vertical',   '{hombros,triceps}',       'peso_corporal','intermedio',   'La version en casa del press de hombros.'),
('Press con kettlebell',             'empuje_vertical',   '{hombros,core}',          'kettlebell',   'intermedio',   null),

-- Traccion horizontal
('Remo con barra',                   'traccion_horizontal','{espalda,biceps}',       'barra',        'intermedio',   'Torso a 45 grados, la barra va al ombligo.'),
('Remo con mancuerna a una mano',    'traccion_horizontal','{espalda,biceps}',       'mancuernas',   'principiante', null),
('Remo en polea baja',               'traccion_horizontal','{espalda,biceps}',       'polea',        'principiante', null),
('Remo en maquina',                  'traccion_horizontal','{espalda,biceps}',       'maquina',      'principiante', null),
('Remo invertido',                   'traccion_horizontal','{espalda,biceps,core}',  'peso_corporal','principiante', 'Con una barra baja o anillas. Cuanto mas horizontal, mas dificil.'),
('Remo Pendlay',                     'traccion_horizontal','{espalda,biceps}',       'barra',        'avanzado',     'Cada repeticion arranca con la barra en el piso.'),
('Face pull',                        'traccion_horizontal','{hombros,espalda}',      'polea',        'principiante', 'Salud del hombro. Entra bien al final de cualquier dia de torso.'),

-- Traccion vertical
('Dominadas',                        'traccion_vertical', '{espalda,biceps}',        'peso_corporal','avanzado',     null),
('Dominadas asistidas',              'traccion_vertical', '{espalda,biceps}',        'maquina',      'principiante', 'El camino hacia la dominada completa.'),
('Jalon al pecho',                   'traccion_vertical', '{espalda,biceps}',        'polea',        'principiante', null),
('Jalon agarre neutro',              'traccion_vertical', '{espalda,biceps}',        'polea',        'principiante', null),
('Pullover en polea',                'traccion_vertical', '{espalda,pecho}',         'polea',        'intermedio',   null),

-- Rodilla (sentadilla)
('Sentadilla con barra',             'rodilla',           '{cuadriceps,gluteos,core}','barra',       'intermedio',   'El patron mas importante del tren inferior. Profundidad hasta donde la cadera no se meta para adentro.'),
('Sentadilla frontal',               'rodilla',           '{cuadriceps,core}',       'barra',        'avanzado',     'Mas cuadriceps y mas exigencia de torso erguido.'),
('Sentadilla goblet',                'rodilla',           '{cuadriceps,gluteos,core}','kettlebell',  'principiante', 'La mejor forma de aprender a sentadillar.'),
('Prensa de piernas',                'rodilla',           '{cuadriceps,gluteos}',    'maquina',      'principiante', null),
('Sentadilla bulgara',               'rodilla',           '{cuadriceps,gluteos}',    'mancuernas',   'intermedio',   'Unilateral: corrige diferencias entre una pierna y la otra.'),
('Sentadilla libre',                 'rodilla',           '{cuadriceps,gluteos}',    'peso_corporal','principiante', null),
('Hack squat',                       'rodilla',           '{cuadriceps}',            'maquina',      'intermedio',   null),

-- Cadera (bisagra)
('Peso muerto convencional',         'cadera',            '{isquios,gluteos,espalda}','barra',       'intermedio',   'La espalda no se redondea. Si se redondea, baja el peso.'),
('Peso muerto rumano',               'cadera',            '{isquios,gluteos}',       'barra',        'intermedio',   'Rodillas casi fijas, cadera atras. Se siente atras del muslo.'),
('Peso muerto con mancuernas',       'cadera',            '{isquios,gluteos}',       'mancuernas',   'principiante', null),
('Hip thrust',                       'cadera',            '{gluteos,isquios}',       'barra',        'principiante', 'Menton metido y costillas abajo arriba del todo.'),
('Puente de gluteos',                'cadera',            '{gluteos}',               'peso_corporal','principiante', null),
('Swing con kettlebell',             'cadera',            '{gluteos,isquios,core}',  'kettlebell',   'intermedio',   'Es un movimiento de cadera, no de brazos ni de sentadilla.'),
('Buenos dias',                      'cadera',            '{isquios,espalda}',       'barra',        'avanzado',     null),
('Peso muerto a una pierna',         'cadera',            '{isquios,gluteos,core}',  'mancuernas',   'intermedio',   'Mucho equilibrio: ideal para deportes con apoyos en una pierna.'),

-- Zancada
('Zancadas con mancuernas',          'zancada',           '{cuadriceps,gluteos}',    'mancuernas',   'principiante', null),
('Zancadas caminando',               'zancada',           '{cuadriceps,gluteos}',    'mancuernas',   'intermedio',   null),
('Step up al cajon',                 'zancada',           '{cuadriceps,gluteos}',    'mancuernas',   'principiante', 'Subir empujando con la pierna de arriba, no impulsandose con la de abajo.'),
('Zancada inversa',                  'zancada',           '{cuadriceps,gluteos}',    'peso_corporal','principiante', 'Mas amable con la rodilla que la zancada hacia adelante.'),

-- Aislados de pierna
('Extension de cuadriceps',          'cuadriceps_aislado','{cuadriceps}',            'maquina',      'principiante', null),
('Curl femoral acostado',            'isquios_aislado',   '{isquios}',               'maquina',      'principiante', null),
('Curl nordico',                     'isquios_aislado',   '{isquios}',               'peso_corporal','avanzado',     'El ejercicio con mas evidencia para prevenir desgarros de isquiotibiales.'),
('Elevacion de talones de pie',      'pantorrilla',       '{pantorrillas}',          'maquina',      'principiante', null),
('Elevacion de talones sentado',     'pantorrilla',       '{pantorrillas}',          'maquina',      'principiante', null),
('Elevacion de talones a una pierna','pantorrilla',       '{pantorrillas}',          'peso_corporal','principiante', null),

-- Hombro y brazos
('Elevaciones laterales',            'hombro_lateral',    '{hombros}',               'mancuernas',   'principiante', null),
('Elevaciones laterales en polea',   'hombro_lateral',    '{hombros}',               'polea',        'principiante', null),
('Pajaros (deltoides posterior)',    'hombro_lateral',    '{hombros,espalda}',       'mancuernas',   'principiante', null),
('Curl con barra',                   'biceps',            '{biceps}',                'barra',        'principiante', null),
('Curl con mancuernas',              'biceps',            '{biceps}',                'mancuernas',   'principiante', null),
('Curl martillo',                    'biceps',            '{biceps,antebrazo}',      'mancuernas',   'principiante', null),
('Curl en polea',                    'biceps',            '{biceps}',                'polea',        'principiante', null),
('Extension de triceps en polea',    'triceps',           '{triceps}',               'polea',        'principiante', null),
('Press frances',                    'triceps',           '{triceps}',               'barra',        'intermedio',   null),
('Fondos en banco',                  'triceps',           '{triceps,hombros}',       'peso_corporal','principiante', null),
('Patada de triceps',                'triceps',           '{triceps}',               'mancuernas',   'principiante', null),

-- Core
('Plancha',                          'core_anti_extension','{core}',                 'peso_corporal','principiante', 'Gluteos apretados. Si la cadera se hunde, se termino la serie.'),
('Plancha con peso',                 'core_anti_extension','{core}',                 'peso_corporal','intermedio',   null),
('Rueda abdominal',                  'core_anti_extension','{core}',                 'peso_corporal','avanzado',     null),
('Dead bug',                         'core_anti_extension','{core}',                 'peso_corporal','principiante', 'La zona lumbar no se despega del piso en ningun momento.'),
('Pallof press',                     'core_anti_rotacion','{core}',                  'polea',        'principiante', 'Aguantar sin girar. Es el core que sirve en los deportes.'),
('Plancha lateral',                  'core_anti_rotacion','{core}',                  'peso_corporal','principiante', null),
('Giro ruso',                        'core_anti_rotacion','{core}',                  'mancuernas',   'intermedio',   null),
('Paseo del granjero a una mano',    'core_anti_rotacion','{core,antebrazo}',        'mancuernas',   'intermedio',   null),
('Elevacion de piernas colgado',     'core_flexion',      '{core}',                  'peso_corporal','avanzado',     null),
('Crunch en polea',                  'core_flexion',      '{core}',                  'polea',        'principiante', null),
('Elevacion de rodillas',            'core_flexion',      '{core}',                  'peso_corporal','principiante', null),

-- Potencia
('Cargada de potencia',              'potencia',          '{cuerpo_entero}',         'barra',        'avanzado',     'Requiere tecnica. Si no la tenes aprendida, usa el envion o los saltos.'),
('Envion (push press)',              'potencia',          '{hombros,piernas}',       'barra',        'intermedio',   null),
('Salto al cajon',                   'potencia',          '{piernas}',               'peso_corporal','principiante', 'Bajar del cajon caminando, no saltando.'),
('Salto vertical',                   'potencia',          '{piernas}',               'peso_corporal','principiante', null),
('Lanzamiento de pelota medicinal',  'potencia',          '{core,cuerpo_entero}',    'otro',         'principiante', null),
('Sentadilla con salto',             'potencia',          '{piernas}',               'peso_corporal','intermedio',   null),
('Swing pesado con kettlebell',      'potencia',          '{gluteos,isquios}',       'kettlebell',   'intermedio',   null),

-- Pliometria y velocidad
('Saltos laterales',                 'pliometria',        '{piernas}',               'peso_corporal','principiante', null),
('Skipping alto',                    'pliometria',        '{piernas}',               'peso_corporal','principiante', null),
('Multisaltos',                      'pliometria',        '{piernas}',               'peso_corporal','intermedio',   null),
('Drop jump',                        'pliometria',        '{piernas}',               'peso_corporal','avanzado',     'Minimo tiempo de contacto con el piso.'),
('Sprints cortos',                   'pliometria',        '{piernas}',               'peso_corporal','intermedio',   '20 a 40 metros, con descanso completo entre repeticiones.'),

-- Prevencion y movilidad
('Copenhagen (aductores)',           'prevencion',        '{aductores,core}',        'peso_corporal','intermedio',   'Prevencion de pubalgia. Clave en futbol y hockey.'),
('Rotacion externa con banda',       'prevencion',        '{hombros}',               'banda',        'principiante', 'Manguito rotador. Imprescindible en deportes de lanzamiento.'),
('Y-T-W en banco',                   'prevencion',        '{hombros,espalda}',       'mancuernas',   'principiante', null),
('Elevacion de talones excentrica',  'prevencion',        '{pantorrillas}',          'peso_corporal','principiante', 'Prevencion de tendinopatia de aquiles. Bajar lento, en 3 segundos.'),
('Movilidad de cadera 90/90',        'prevencion',        '{cadera}',                'peso_corporal','principiante', null),
('Perro-pajaro (bird dog)',          'prevencion',        '{core,espalda}',          'peso_corporal','principiante', null),

-- Con banda elastica y peso corporal.
-- Sin estos, entrenar en casa deja los dias de traccion practicamente vacios:
-- casi todo lo que tira necesita barra, polea o mancuernas.
('Remo con banda',                   'traccion_horizontal','{espalda,biceps}',       'banda',        'principiante', null),
('Face pull con banda',              'traccion_horizontal','{hombros,espalda}',      'banda',        'principiante', null),
('Remo invertido pies elevados',     'traccion_horizontal','{espalda,biceps,core}',  'peso_corporal','intermedio',   null),
('Jalon con banda',                  'traccion_vertical', '{espalda,biceps}',        'banda',        'principiante', 'Banda anclada arriba de una puerta.'),
('Dominadas negativas',              'traccion_vertical', '{espalda,biceps}',        'peso_corporal','principiante', 'Arrancas arriba y bajas en 5 segundos. Es el camino a la dominada.'),
('Dominadas con banda',              'traccion_vertical', '{espalda,biceps}',        'banda',        'principiante', null),
('Curl con banda',                   'biceps',            '{biceps}',                'banda',        'principiante', null),
('Extension de triceps con banda',   'triceps',           '{triceps}',               'banda',        'principiante', null),
('Elevaciones laterales con banda',  'hombro_lateral',    '{hombros}',               'banda',        'principiante', null),
('Pajaros con banda',                'hombro_lateral',    '{hombros,espalda}',       'banda',        'principiante', null),
('Press de pecho con banda',         'empuje_horizontal', '{pecho,triceps}',         'banda',        'principiante', null),
('Press de hombros con banda',       'empuje_vertical',   '{hombros,triceps}',       'banda',        'principiante', null),
('Sentadilla con banda',             'rodilla',           '{cuadriceps,gluteos}',    'banda',        'principiante', null),
('Peso muerto con banda',            'cadera',            '{isquios,gluteos}',       'banda',        'principiante', null),
('Puente de gluteos a una pierna',   'cadera',            '{gluteos,isquios}',       'peso_corporal','intermedio',   null),
('Curl femoral deslizante',          'isquios_aislado',   '{isquios}',               'peso_corporal','intermedio',   'Con los talones sobre un trapo en piso liso.'),
('Abduccion de cadera con banda',    'prevencion',        '{gluteos,cadera}',        'banda',        'principiante', 'Gluteo medio: estabiliza la rodilla al correr y al frenar.'),

-- Cardio
('Trote continuo',                   'cardio',            '{cardio}',                'cardio',       'principiante', null),
('Bicicleta fija',                   'cardio',            '{cardio}',                'cardio',       'principiante', 'Bajo impacto: sirve cuando hay molestias en rodilla o tobillo.'),
('Remoergometro',                    'cardio',            '{cardio,espalda}',        'cardio',       'intermedio',   null),
('Soga',                             'cardio',            '{cardio,pantorrillas}',   'cardio',       'principiante', null),
('Intervalos 30/30',                 'cardio',            '{cardio}',                'cardio',       'intermedio',   '30 segundos fuerte, 30 suave. Entre 8 y 15 vueltas.'),
('Sprints en cuesta',                'cardio',            '{cardio,piernas}',        'cardio',       'avanzado',     null)

on conflict (nombre) do nothing;


-- ---------------------------------------------------------------------------
--  2. Alimentos
--
--  Valores por cada 100 g de producto, como vienen en la etiqueta.
--  Las carnes y los cereales estan en CRUDO salvo que diga "cocido": es como
--  se pesan en la cocina, y cocido pesa distinto segun cuanta agua tomo.
--  porcion_g es la medida casera habitual, para cargar rapido.
-- ---------------------------------------------------------------------------

insert into public.alimentos_base
  (nombre, categoria, kcal_100, prot_100, carb_100, gras_100, fibra_100, porcion_g, porcion_nombre) values

-- Carnes
('Pechuga de pollo',        'carnes',   165, 31.0,  0.0,  3.6, 0,   200, 'una pechuga'),
('Pata muslo de pollo',     'carnes',   209, 18.0,  0.0, 15.0, 0,   150, 'un muslo'),
('Carne picada comun',      'carnes',   250, 17.0,  0.0, 20.0, 0,   150, 'una porcion'),
('Carne picada magra',      'carnes',   160, 21.0,  0.0,  8.0, 0,   150, 'una porcion'),
('Nalga',                   'carnes',   135, 21.5,  0.0,  5.0, 0,   200, 'un bife'),
('Peceto',                  'carnes',   130, 22.0,  0.0,  4.5, 0,   200, 'una porcion'),
('Bife de chorizo',         'carnes',   230, 21.0,  0.0, 16.0, 0,   250, 'un bife'),
('Asado de tira',           'carnes',   290, 19.0,  0.0, 24.0, 0,   250, 'una porcion'),
('Vacio',                   'carnes',   215, 21.0,  0.0, 14.0, 0,   250, 'una porcion'),
('Matambre',                'carnes',   245, 19.0,  0.0, 19.0, 0,   200, 'una porcion'),
('Lomo de cerdo',           'carnes',   143, 21.0,  0.0,  6.0, 0,   200, 'una porcion'),
('Bondiola de cerdo',       'carnes',   250, 18.0,  0.0, 20.0, 0,   200, 'una porcion'),
('Jamon cocido',            'carnes',   145, 18.0,  1.5,  7.5, 0,    30, 'una feta'),
('Jamon crudo',             'carnes',   240, 27.0,  0.5, 15.0, 0,    25, 'una feta'),
('Salame',                  'carnes',   407, 22.0,  2.0, 34.0, 0,    30, 'cinco fetas'),
('Mortadela',               'carnes',   311, 16.0,  3.0, 25.0, 0,    30, 'una feta'),
('Chorizo',                 'carnes',   455, 16.0,  2.0, 42.0, 0,   100, 'un chorizo'),
('Milanesa de carne',       'carnes',   290, 19.0, 16.0, 16.0, 1,   150, 'una milanesa'),

-- Pescados y mariscos
('Merluza',                 'pescados',  90, 18.0,  0.0,  1.3, 0,   200, 'un filet'),
('Salmon',                  'pescados', 208, 20.0,  0.0, 13.0, 0,   150, 'una porcion'),
('Atun al natural',         'pescados', 116, 26.0,  0.0,  1.0, 0,   120, 'una lata escurrida'),
('Atun al aceite',          'pescados', 190, 25.0,  0.0, 10.0, 0,   120, 'una lata escurrida'),
('Caballa en lata',         'pescados', 205, 19.0,  0.0, 14.0, 0,   125, 'una lata'),
('Langostinos',             'pescados',  99, 21.0,  0.2,  1.0, 0,   150, 'una porcion'),

-- Huevos
('Huevo entero',            'huevos',   143, 12.6,  0.7,  9.5, 0,    50, 'una unidad'),
('Clara de huevo',          'huevos',    52, 11.0,  0.7,  0.2, 0,    33, 'una clara'),

-- Lacteos
('Leche entera',            'lacteos',   61,  3.2,  4.8,  3.3, 0,   200, 'un vaso'),
('Leche descremada',        'lacteos',   34,  3.4,  5.0,  0.1, 0,   200, 'un vaso'),
('Yogur natural',           'lacteos',   59,  3.5,  4.7,  3.3, 0,   190, 'un pote'),
('Yogur descremado',        'lacteos',   41,  4.3,  5.5,  0.2, 0,   190, 'un pote'),
('Yogur griego',            'lacteos',   97,  9.0,  4.0,  5.0, 0,   150, 'un pote'),
('Queso port salut',        'lacteos',  330, 23.0,  1.0, 26.0, 0,    30, 'una feta'),
('Queso cremoso',           'lacteos',  300, 20.0,  2.0, 24.0, 0,    30, 'una feta'),
('Queso mozzarella',        'lacteos',  280, 22.0,  2.2, 20.0, 0,    50, 'una porcion'),
('Queso rallado',           'lacteos',  392, 35.0,  3.0, 27.0, 0,    10, 'una cucharada'),
('Ricota',                  'lacteos',  174, 11.0,  3.0, 13.0, 0,   100, 'una porcion'),
('Queso untable',           'lacteos',  245, 10.0,  4.0, 21.0, 0,    30, 'una cucharada'),
('Queso untable light',     'lacteos',  150, 11.0,  4.0, 10.0, 0,    30, 'una cucharada'),
('Manteca',                 'grasas',   717,  0.9,  0.1, 81.0, 0,    10, 'una cucharadita'),

-- Cereales y derivados
('Arroz blanco crudo',      'cereales', 360,  7.0, 79.0,  0.6, 1.3, 80, 'una taza cruda'),
('Arroz blanco cocido',     'cereales', 130,  2.7, 28.0,  0.3, 0.4, 200,'un plato'),
('Arroz integral cocido',   'cereales', 123,  2.7, 26.0,  1.0, 1.8, 200,'un plato'),
('Fideos secos',            'cereales', 371, 13.0, 75.0,  1.5, 3.2, 80, 'una porcion cruda'),
('Fideos cocidos',          'cereales', 131,  5.0, 25.0,  1.1, 1.2, 250,'un plato'),
('Fideos integrales secos', 'cereales', 350, 14.0, 68.0,  2.5, 8.0, 80, 'una porcion cruda'),
('Avena',                   'cereales', 389, 16.9, 66.0,  6.9,10.6, 40, 'cuatro cucharadas'),
('Polenta cocida',          'cereales',  85,  2.0, 18.0,  0.4, 1.0, 250,'un plato'),
('Quinoa cocida',           'cereales', 120,  4.4, 21.0,  1.9, 2.8, 180,'un plato'),
('Harina 000',              'cereales', 364, 10.0, 76.0,  1.0, 2.7, 30, 'dos cucharadas'),
('Galletas de arroz',       'cereales', 387,  8.0, 81.0,  3.0, 3.0,  9, 'una unidad'),

-- Panificados
('Pan frances',             'panificados', 270,  9.0, 53.0,  1.5, 2.5, 60, 'un pancito'),
('Pan lactal blanco',       'panificados', 265,  8.0, 49.0,  3.5, 2.2, 28, 'una rebanada'),
('Pan lactal integral',     'panificados', 250, 10.0, 43.0,  4.0, 6.0, 28, 'una rebanada'),
('Pan integral',            'panificados', 247, 13.0, 41.0,  3.4, 7.0, 50, 'una rodaja'),
('Medialuna',               'panificados', 380,  7.0, 44.0, 19.0, 1.5, 45, 'una unidad'),
('Factura',                 'panificados', 400,  7.0, 45.0, 21.0, 1.5, 55, 'una unidad'),
('Galletitas de agua',      'panificados', 430,  9.0, 72.0, 12.0, 2.5, 30, 'seis unidades'),
('Tortilla de trigo',       'panificados', 310,  8.0, 50.0,  8.0, 2.5, 50, 'una unidad'),

-- Legumbres
('Lentejas cocidas',        'legumbres', 116,  9.0, 20.0,  0.4, 8.0, 200, 'un plato'),
('Porotos cocidos',         'legumbres', 127,  8.7, 23.0,  0.5, 6.4, 200, 'un plato'),
('Garbanzos cocidos',       'legumbres', 164,  8.9, 27.0,  2.6, 7.6, 200, 'un plato'),
('Arvejas',                 'legumbres',  81,  5.4, 14.0,  0.4, 5.1, 150, 'una porcion'),
('Soja texturizada seca',   'legumbres', 330, 50.0, 30.0,  1.5,13.0,  30, 'una porcion seca'),

-- Verduras
('Tomate',                  'verduras',   18,  0.9,  3.9,  0.2, 1.2, 120, 'una unidad'),
('Lechuga',                 'verduras',   15,  1.4,  2.9,  0.2, 1.3,  50, 'un plato'),
('Zanahoria',               'verduras',   41,  0.9, 10.0,  0.2, 2.8,  80, 'una unidad'),
('Zapallo',                 'verduras',   26,  1.0,  6.5,  0.1, 1.5, 200, 'una porcion'),
('Brocoli',                 'verduras',   34,  2.8,  7.0,  0.4, 2.6, 150, 'una porcion'),
('Espinaca',                'verduras',   23,  2.9,  3.6,  0.4, 2.2, 100, 'un atado cocido'),
('Acelga',                  'verduras',   19,  1.8,  3.7,  0.2, 1.6, 100, 'un atado cocido'),
('Cebolla',                 'verduras',   40,  1.1,  9.3,  0.1, 1.7, 100, 'una unidad'),
('Morron',                  'verduras',   31,  1.0,  6.0,  0.3, 2.1, 120, 'una unidad'),
('Zucchini',                'verduras',   17,  1.2,  3.1,  0.3, 1.0, 150, 'una unidad'),
('Berenjena',               'verduras',   25,  1.0,  6.0,  0.2, 3.0, 200, 'una unidad'),
('Choclo',                  'verduras',   86,  3.3, 19.0,  1.4, 2.7, 150, 'una espiga'),
('Papa',                    'verduras',   77,  2.0, 17.0,  0.1, 2.2, 150, 'una unidad mediana'),
('Papa cocida',             'verduras',   87,  2.0, 20.0,  0.1, 1.8, 200, 'una porcion'),
('Batata',                  'verduras',   86,  1.6, 20.0,  0.1, 3.0, 150, 'una unidad'),
('Palta',                   'grasas',    160,  2.0,  9.0, 15.0, 7.0, 100, 'media unidad'),

-- Frutas
('Banana',                  'frutas',     89,  1.1, 23.0,  0.3, 2.6, 120, 'una unidad'),
('Manzana',                 'frutas',     52,  0.3, 14.0,  0.2, 2.4, 180, 'una unidad'),
('Naranja',                 'frutas',     47,  0.9, 12.0,  0.1, 2.4, 180, 'una unidad'),
('Mandarina',               'frutas',     53,  0.8, 13.0,  0.3, 1.8, 100, 'una unidad'),
('Pera',                    'frutas',     57,  0.4, 15.0,  0.1, 3.1, 180, 'una unidad'),
('Uva',                     'frutas',     69,  0.7, 18.0,  0.2, 0.9, 150, 'un racimo chico'),
('Frutilla',                'frutas',     32,  0.7,  7.7,  0.3, 2.0, 150, 'una taza'),
('Durazno',                 'frutas',     39,  0.9, 10.0,  0.3, 1.5, 150, 'una unidad'),
('Kiwi',                    'frutas',     61,  1.1, 15.0,  0.5, 3.0,  75, 'una unidad'),
('Anana',                   'frutas',     50,  0.5, 13.0,  0.1, 1.4, 150, 'dos rodajas'),
('Sandia',                  'frutas',     30,  0.6,  8.0,  0.2, 0.4, 250, 'una porcion'),
('Melon',                   'frutas',     34,  0.8,  8.0,  0.2, 0.9, 200, 'una porcion'),
('Ciruela',                 'frutas',     46,  0.7, 11.0,  0.3, 1.4,  70, 'una unidad'),

-- Frutos secos y semillas
('Almendras',               'frutos_secos', 579, 21.0, 22.0, 50.0, 12.5, 30, 'un puñado'),
('Nueces',                  'frutos_secos', 654, 15.0, 14.0, 65.0,  6.7, 30, 'un puñado'),
('Mani',                    'frutos_secos', 567, 26.0, 16.0, 49.0,  8.5, 30, 'un puñado'),
('Castanas de caju',        'frutos_secos', 553, 18.0, 30.0, 44.0,  3.3, 30, 'un puñado'),
('Semillas de chia',        'frutos_secos', 486, 17.0, 42.0, 31.0, 34.0, 15, 'una cucharada'),
('Semillas de girasol',     'frutos_secos', 584, 21.0, 20.0, 51.0,  8.6, 15, 'una cucharada'),
('Mantequilla de mani',     'frutos_secos', 588, 25.0, 20.0, 50.0,  6.0, 20, 'una cucharada'),

-- Grasas y aderezos
('Aceite de oliva',         'grasas',   884,  0.0,  0.0, 100.0, 0, 10, 'una cucharada'),
('Aceite de girasol',       'grasas',   884,  0.0,  0.0, 100.0, 0, 10, 'una cucharada'),
('Mayonesa',                'grasas',   680,  1.0,  2.0,  75.0, 0, 15, 'una cucharada'),
('Aceitunas',               'grasas',   115,  0.8,  6.0,  11.0, 3.2, 30, 'diez unidades'),

-- Suplementos
('Proteina de suero (whey)','suplementos', 380, 78.0,  8.0,  4.0, 0, 30, 'un scoop'),
('Creatina monohidrato',    'suplementos',   0,  0.0,  0.0,  0.0, 0,  5, 'una cucharadita'),

-- Dulces
('Azucar',                  'dulces',   387,  0.0, 100.0,  0.0, 0,  5, 'una cucharadita'),
('Miel',                    'dulces',   304,  0.3,  82.0,  0.0, 0, 20, 'una cucharada'),
('Dulce de leche',          'dulces',   315,  6.0,  55.0,  7.0, 0, 20, 'una cucharada'),
('Mermelada',               'dulces',   250,  0.4,  62.0,  0.1, 1, 20, 'una cucharada'),
('Chocolate con leche',     'dulces',   535,  7.6,  59.0, 30.0, 2, 25, 'una barrita'),
('Chocolate amargo 70%',    'dulces',   598,  7.8,  46.0, 43.0, 11, 25, 'una barrita'),
('Alfajor simple',          'dulces',   420,  5.0,  60.0, 18.0, 1.5, 45, 'una unidad'),
('Helado de crema',         'dulces',   207,  3.5,  24.0, 11.0, 0.7, 100, 'una bocha grande'),

-- Bebidas
('Agua',                    'bebidas',    0,  0.0,  0.0, 0.0, 0, 500, 'un vaso grande'),
('Gaseosa comun',           'bebidas',   42,  0.0, 10.6, 0.0, 0, 350, 'una lata'),
('Gaseosa light',           'bebidas',    1,  0.0,  0.0, 0.0, 0, 350, 'una lata'),
('Jugo de naranja',         'bebidas',   45,  0.7, 10.0, 0.2, 0.2, 250, 'un vaso'),
('Cerveza',                 'bebidas',   43,  0.5,  3.6, 0.0, 0, 330, 'una botella'),
('Vino tinto',              'bebidas',   85,  0.1,  2.6, 0.0, 0, 150, 'una copa'),
('Cafe sin azucar',         'bebidas',    2,  0.1,  0.0, 0.0, 0, 200, 'una taza'),
('Mate cocido',             'bebidas',    2,  0.0,  0.4, 0.0, 0, 200, 'una taza')

on conflict (nombre) do nothing;


-- ---------------------------------------------------------------------------
--  3. Prioridad de cada ejercicio dentro de su patron
--
--  1 = el basico de referencia, 5 = aislado (es el valor por defecto).
--  El generador recorre los candidatos en este orden, asi el ejercicio
--  principal del dia sale un press de banca y no unas aperturas.
--  Solo se listan los que no son aislados; el resto se queda en 5.
-- ---------------------------------------------------------------------------

update public.ejercicios_base e
set prioridad = v.p
from (values
  -- Empuje horizontal
  ('Press banca con barra',1),('Press banca con mancuernas',1),
  ('Press inclinado con barra',2),('Press inclinado con mancuernas',2),
  ('Fondos en paralelas',2),('Press plano en maquina',3),
  ('Flexiones de brazos',3),('Flexiones con pies elevados',3),
  ('Press de pecho con banda',4),
  -- Empuje vertical
  ('Press militar con barra',1),('Press de hombros con mancuernas',1),
  ('Press Arnold',2),('Press de hombros en maquina',3),
  ('Press con kettlebell',3),('Flexiones pike',3),
  ('Press de hombros con banda',4),
  -- Traccion horizontal
  ('Remo con barra',1),('Remo con mancuerna a una mano',1),
  ('Remo Pendlay',2),('Remo en polea baja',2),
  ('Remo en maquina',3),('Remo invertido pies elevados',3),('Remo invertido',3),
  ('Remo con banda',4),
  -- Traccion vertical
  ('Dominadas',1),('Jalon al pecho',1),
  ('Jalon agarre neutro',2),('Dominadas asistidas',2),
  ('Dominadas negativas',3),('Dominadas con banda',3),('Jalon con banda',4),
  -- Rodilla
  ('Sentadilla con barra',1),('Sentadilla frontal',2),('Sentadilla goblet',2),
  ('Prensa de piernas',3),('Hack squat',3),('Sentadilla bulgara',3),
  ('Sentadilla libre',4),('Sentadilla con banda',4),
  -- Cadera
  ('Peso muerto convencional',1),('Peso muerto rumano',1),
  ('Hip thrust',2),('Peso muerto con mancuernas',2),
  ('Swing con kettlebell',3),('Buenos dias',3),('Peso muerto a una pierna',3),
  ('Puente de gluteos a una pierna',4),('Puente de gluteos',4),('Peso muerto con banda',4),
  -- Zancada
  ('Zancadas con mancuernas',1),('Zancadas caminando',2),
  ('Step up al cajon',2),('Zancada inversa',3),
  -- Potencia
  ('Cargada de potencia',1),('Envion (push press)',1),
  ('Swing pesado con kettlebell',2),('Salto al cajon',2),
  ('Sentadilla con salto',3),('Salto vertical',3),('Lanzamiento de pelota medicinal',3),
  -- Core
  ('Plancha',1),('Pallof press',1),('Plancha lateral',1),
  ('Dead bug',2),('Plancha con peso',2),('Paseo del granjero a una mano',2),
  ('Rueda abdominal',3),('Giro ruso',3),
  ('Elevacion de rodillas',1),('Crunch en polea',2),('Elevacion de piernas colgado',3),
  -- Aislados de pierna y pantorrilla
  ('Curl femoral acostado',1),('Curl nordico',2),('Curl femoral deslizante',3),
  ('Extension de cuadriceps',1),
  ('Elevacion de talones de pie',1),('Elevacion de talones sentado',2),
  ('Elevacion de talones a una pierna',3),
  -- Hombro y brazos
  ('Elevaciones laterales',1),('Pajaros (deltoides posterior)',2),
  ('Elevaciones laterales en polea',2),('Elevaciones laterales con banda',3),
  ('Pajaros con banda',3),
  ('Curl con barra',1),('Curl con mancuernas',1),('Curl martillo',2),
  ('Curl en polea',2),('Curl con banda',3),
  ('Extension de triceps en polea',1),('Press frances',1),('Fondos en banco',2),
  ('Patada de triceps',3),('Extension de triceps con banda',3),
  -- Cardio
  ('Trote continuo',1),('Bicicleta fija',2),('Remoergometro',2),
  ('Soga',3),('Intervalos 30/30',3),('Sprints en cuesta',4)
) as v(nombre, p)
where e.nombre = v.nombre;
