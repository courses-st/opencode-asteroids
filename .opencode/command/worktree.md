---
description: Crea un worktree local en .worktrees/ a partir del argumento dado
agent: build
---

El argumento recibido es: $ARGUMENTS

Generá un nombre corto para el worktree a partir de ese texto (si tiene espacios o caracteres especiales, convertilos a guiones o eliminálos; que quede en minúsculas, sin acentos).

Luego ejecutá únicamente el comando:

git worktree add .worktrees/<nombre-generado>

No hagas nada más: no cambies de directorio, no crees otros archivos, no ejecutes ningún otro comando. Solo corré ese comando.