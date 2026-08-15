# SPEC.md — Runner Bahía Blanca

## 1. Concepto

Juego tipo **runner 2D de desplazamiento horizontal**, con estética retro **8-bit**.

El jugador controla a un personaje que corre por las calles del centro de **Bahía Blanca**.

La cámara muestra al personaje **de perfil**, desplazándose siempre hacia adelante. El personaje no puede retroceder.

El objetivo es avanzar por las calles, evitar obstáculos, esquivar o atacar palomas, cruzar esquinas evitando autos y recolectar monedas para comprar cubanitos que permiten recuperar vida.

---

## 2. Plataforma

### Objetivo inicial

El juego debe ejecutarse en un navegador web.

Debe ser posible jugarlo desde:

- Computadora
- Teléfono Android
- iPhone/iPad

La interfaz debe adaptarse a pantallas horizontales.

### Objetivo futuro

La arquitectura debe permitir empaquetar el juego como:

- APK para Android
- Aplicación para iOS

La versión web es la prioridad inicial.

---

## 3. Orientación

El juego se desarrolla en **pantalla horizontal (landscape)**.

El diseño debe estar pensado principalmente para teléfonos celulares.

En dispositivos móviles los controles deben ser táctiles.

---

# 4. Personaje principal

## Apariencia

El personaje debe utilizar el diseño visual previamente definido:

- Niño
- Rubio
- Anteojos
- Marco de los anteojos azul
- Estética pixel art / 8-bit
- Vista lateral

El personaje corre permanentemente hacia la derecha.

Debe disponer de animaciones pixel art para:

- Correr
- Saltar
- Caer
- Patada aérea
- Golpe a una paloma
- Recibir daño
- Morir
- Comprar/consumir cubanito

---

# 5. Movimiento

El personaje puede desplazarse:

- Hacia adelante
- Hacia arriba
- Hacia abajo

No puede desplazarse hacia atrás.

### Movimiento vertical

El movimiento vertical permite cambiar entre diferentes zonas de la pantalla.

Por ejemplo:

```text
       ↑
       │
  vereda superior
       │
───────┼──────── calle
       │
  vereda inferior
       │
       ↓
```

El jugador puede cambiar de posición para evitar obstáculos y enemigos.

### Salto

El personaje puede saltar.

El salto se utiliza principalmente para:

- Evitar obstáculos
- Evitar palomas
- Atacar palomas mediante una patada aérea

---

# 6. Mundo del juego

El juego representa calles del centro de **Bahía Blanca**.

La escena debe contener:

### Veredas

Las veredas son las zonas principales por donde circula el personaje y los peatones.

Debe haber:

- Peatones
- Comercios
- Puertas
- Ventanas
- Carteles
- Árboles
- Farolas
- Otros elementos urbanos

### Calles

Entre las veredas existen calles por donde circulan vehículos.

Los autos constituyen un peligro para el personaje.

---

# 7. Veredas dinámicas

Las veredas no siempre tienen el mismo ancho.

En determinados puntos pueden:

- Angostarse repentinamente
- Presentar obstáculos
- Obligar al jugador a cambiar de posición
- Generar situaciones inesperadas

El objetivo es evitar que el recorrido sea completamente predecible.

Los cambios deben estar diseñados para poder reaccionar a tiempo.

---

# 8. Esquinas

Las esquinas son zonas especialmente peligrosas.

Al llegar a una esquina puede aparecer un automóvil.

Si el jugador continúa avanzando sin frenar o cambiar de posición, puede ser atropellado.

Los autos deben tener:

- Aparición variable
- Velocidad variable
- Trayectorias predecibles pero con dificultad creciente

La aparición del automóvil debe permitir una reacción razonable al jugador.

---

# 9. Palomas

Las palomas son el enemigo principal.

Son enemigos voladores que aparecen durante el recorrido.

Pueden desplazarse:

- Horizontalmente
- Desde diferentes alturas
- En diferentes velocidades

El jugador puede:

### Esquivarlas

Cambiar de posición o saltar para evitar la paloma.

### Atacarlas

El jugador puede saltar y realizar una **patada aérea**.

Si la patada impacta contra una paloma:

- La paloma muere
- El jugador recibe una moneda

---

# 10. Ataque de las palomas

Las palomas tienen un ataque especial:

**Defecar sobre el personaje.**

La paloma puede realizar el ataque cuando pasa sobre el jugador.

Si impacta:

- El personaje recibe daño
- Se descuenta vida
- Se reproduce una animación/efecto apropiado

El ataque debe ser claramente visible para que el jugador pueda intentar esquivarlo.

---

# 11. Monedas

Las monedas son el principal recurso recolectable.

Se obtienen principalmente al eliminar palomas.

### Regla inicial

Cada paloma eliminada:

**+1 moneda**

Las monedas permanecen almacenadas durante la partida.

---

# 12. Puesto de cubanitos

Durante el recorrido pueden aparecer puestos callejeros que venden **cubanitos**.

Los cubanitos funcionan como objeto de recuperación de vida.

### Compra

El jugador utiliza monedas para comprar cubanitos.

El precio inicial deberá ser configurable.

Ejemplo:

```text
Cubanito
Precio: 3 monedas
Recupera: 50 HP
```

El precio debe estar definido como una variable para poder modificarlo durante el balanceo del juego.

### Consumo

Al consumir un cubanito:

**+50 HP**

La vida nunca puede superar:

**100 HP**

---

# 13. Sistema de vida

El personaje comienza con:

**100 HP**

La barra de vida se muestra permanentemente en pantalla.

### Daño

| Peligro | Daño |
|---|---:|
| Pozo | -10 HP |
| Paloma | -15 HP |
| Auto | -50 HP |

### Recuperación

| Objeto | Recuperación |
|---|---:|
| Cubanito | +50 HP |

La vida máxima es:

**100 HP**

---

# 14. Pozos

Los pozos aparecen sobre las veredas.

Cuando el personaje atraviesa un pozo:

**-10 HP**

Los pozos deben poder aparecer:

- Individualmente
- En grupos
- En posiciones variables

La frecuencia y posición deben aumentar progresivamente la dificultad.

---

# 15. Muerte

Cuando:

**HP <= 0**

el personaje muere.

Debe reproducirse una animación de muerte y posteriormente aparecer una pantalla de:

**GAME OVER**

La pantalla debe mostrar:

- Distancia recorrida
- Monedas obtenidas
- Nivel
- Opción de volver a jugar

---

# 16. Niveles

Los primeros niveles representan calles reales del centro de Bahía Blanca.

### Nivel 1

**ALSINA**

### Nivel 2

**BELGRANO**

### Nivel 3

**LAS HERAS**

Cada nivel debe tener identidad visual propia basada en la calle correspondiente.

Los nombres de las calles pueden aparecer al comenzar cada nivel.

Ejemplo:

```text
════════════════════════
       NIVEL 1
        ALSINA
════════════════════════
```

---

# 17. Progresión de dificultad

La dificultad debe aumentar progresivamente.

Variables que pueden aumentar:

- Velocidad del desplazamiento
- Cantidad de palomas
- Velocidad de palomas
- Frecuencia de ataques
- Cantidad de pozos
- Frecuencia de calles/esquinas
- Frecuencia de autos
- Velocidad de los autos
- Angostamiento de las veredas

El primer nivel debe funcionar como introducción a las mecánicas.

---

# 18. Cámara

La cámara debe desplazarse horizontalmente hacia la derecha.

El personaje permanece aproximadamente en la zona izquierda/central de la pantalla.

El mundo se desplaza hacia el personaje.

La cámara debe mantener una vista lateral clara.

---

# 19. Interfaz

La interfaz debe mostrar permanentemente:

```text
❤️ VIDA: ██████████ 100

🪙 MONEDAS: 12
```

También puede mostrar:

- Nivel actual
- Distancia recorrida
- Indicadores de daño
- Indicador de cubanito disponible

La interfaz debe ser legible en pantallas pequeñas.

---

# 20. Controles

## Computadora

Controles iniciales:

```text
↑       Subir
↓       Bajar
SPACE   Saltar
```

El personaje avanza automáticamente.

No existe tecla para retroceder.

## Pantalla táctil

Debe existir una interfaz táctil.

Posibles controles:

```text
        ↑
      SUBIR

    SALTAR

        ↓
      BAJAR
```

Los botones deben ser grandes y fáciles de utilizar.

---

# 21. Estilo visual

Todo el juego debe mantener el estilo del personaje generado previamente.

### Características

- Pixel art
- 8-bit
- Resolución visual retro
- Colores limitados
- Sprites claramente definidos
- Animaciones por frames
- Vista lateral

El personaje, palomas, autos, peatones, edificios, monedas, pozos y puestos de cubanitos deben compartir el mismo lenguaje visual.

No utilizar gráficos 3D.

---

# 22. Sonido

El juego debe contemplar efectos de sonido para:

- Pasos
- Salto
- Caída
- Golpe a una paloma
- Paloma atacando
- Daño
- Moneda recolectada
- Compra de cubanito
- Consumo de cubanito
- Auto
- Game Over

La música debe tener una estética retro acorde al estilo 8-bit.

---

# 23. Arquitectura técnica

El proyecto debe estar diseñado para que la versión inicial pueda ejecutarse directamente en navegador.

La arquitectura debe separar:

- Lógica del juego
- Física
- Entidades
- Niveles
- Controles
- Audio
- Renderizado
- Interfaz
- Datos/configuración

Los valores de balance del juego deben poder modificarse sin tener que reescribir la lógica principal.

Por ejemplo:

```text
PLAYER_MAX_HP = 100

POTHOLE_DAMAGE = 10

PIGEON_DAMAGE = 15

CAR_DAMAGE = 50

CUBANITO_HEAL = 50

PIGEON_COIN_REWARD = 1

CUBANITO_PRICE = 3
```

---

# 24. Compatibilidad futura con APK

La implementación web debe utilizar tecnologías que permitan posteriormente empaquetar el juego como aplicación móvil.

La lógica del juego no debe depender exclusivamente de funciones específicas de escritorio.

El diseño debe permitir utilizar posteriormente un wrapper o framework de empaquetado para:

- Android
- iOS

La versión web debe ser completamente funcional antes de realizar el empaquetado móvil.

---

# 25. Requisitos mínimos de jugabilidad

El primer prototipo funcional debe permitir:

- Iniciar el juego
- Controlar al personaje
- Correr automáticamente
- Subir
- Bajar
- Saltar
- Detectar colisiones
- Recibir daño
- Mostrar vida
- Encontrar pozos
- Encontrar palomas
- Atacar palomas
- Recibir ataque de palomas
- Obtener monedas
- Encontrar autos
- Ser atropellado
- Encontrar un puesto de cubanitos
- Comprar un cubanito
- Recuperar vida
- Morir
- Reiniciar la partida

---

# 26. Primer objetivo de desarrollo

No intentar implementar los tres niveles inmediatamente.

El primer prototipo debe implementar únicamente:

**Nivel 1 — ALSINA**

Debe contener:

1. Personaje principal
2. Vereda
3. Calle
4. Peatones
5. Pozos
6. Palomas
7. Autos
8. Monedas
9. Puesto de cubanitos
10. Barra de vida
11. Sistema de daño
12. Sistema de curación
13. Game Over
14. Controles de teclado
15. Controles táctiles

Una vez que el Nivel 1 sea jugable y estable, se utilizará como base para construir:

**Nivel 2 — BELGRANO**

y posteriormente:

**Nivel 3 — LAS HERAS**

---

# 27. Criterio de aceptación del prototipo

El prototipo será considerado funcional cuando un jugador pueda:

**Iniciar → correr → esquivar obstáculos → saltar → matar palomas → conseguir monedas → comprar cubanitos → recuperar vida → evitar autos → recorrer el nivel → morir o completar el recorrido.**

La experiencia debe sentirse como un runner arcade retro de desplazamiento lateral.

---

# 28. Regla principal de diseño

El juego debe ser:

**Simple de entender, difícil de dominar y divertido de jugar.**

El jugador debe poder comprender las mecánicas básicas durante los primeros segundos, pero la combinación de pozos, palomas, calles, autos y veredas cambiantes debe generar dificultad progresiva.