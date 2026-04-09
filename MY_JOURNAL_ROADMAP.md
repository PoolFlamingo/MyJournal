# Roadmap para el desarrollo de "My Journal"

## Introducción y resumen del proyecto
"My Journal" es una aplicación de diario personal que permite a los usuarios registrar sus pensamientos, emociones y experiencias diarias. El objetivo de esta aplicación es proporcionar un espacio seguro y privado para que los usuarios puedan reflexionar sobre su vida y mejorar su bienestar emocional o plasmar sus ideas y metas.

En esencia la app contará con una barra lateral izquierda con un calendario de navegación para elegir el día en el que se quiere escribir, una sección central para escribir el diario (`ueberdosis/tiptap`) con todas las capacidades que tiene para poder escribir con formato, insertar imágenes, etc.

Se podrán crear varios diarios (solo uno abierto a la vez) y cada diario tendrá su propia configuración de privacidad, etiquetas, etc. Podrás crear un diario público o privado, y compartirlo con amigos o mantenerlo solo para ti. Cuando es privado se requerirá una contraseña para acceder a él, podrá ser cambiada en cualquier momento introduciendo la contraseña actual y eligiendo una nueva.

Cuando se vuelva a abrir la aplicación, se mostrará el último diario abierto, o si no hay ninguno, se mostrará una pantalla de bienvenida con la opción de crear un nuevo diario o abrir uno existente. Si el diario es privado, se solicitará la contraseña para acceder a él.

## Menu de herramientas
La aplicación contará con un menú de herramientas que permitirá a los usuarios acceder a funciones comunes como crear un nuevo diario, abrir un nuevo diario, guardar cambios, deshacer/rehacer acciones, etc.; y otras funciones adicionales, como la exportación de entradas, la importación de datos, la configuración de privacidad, configuración de la aplicación, etc. Algo similar a aplicaciones de edición de texto como Word o Google Docs o VS Code, pero adaptado a las necesidades de un diario personal.

## Sistema de temas y configuración de la aplicación
"My Journal" contará con un sistema de temas que permitirá a los usuarios personalizar la apariencia de la aplicación. Los usuarios podrán elegir entre varios temas predefinidos, más adelante, en la versión 2 se podrá crear su propio tema personalizado. Esto estará en una sección de configuración de la aplicación, donde también podrán ajustar otras preferencias como el idioma, las notificaciones, etc. Los temas predefinidos los encontrarás en `src/assets/themes/`.

## Barra lateral de navegación
La barra lateral izquierda de la aplicación contará con un calendario de navegación que permitirá a los usuarios seleccionar el día para el que desean escribir su entrada de diario. Además, se mostrarán los diarios disponibles y se podrá acceder a ellos fácilmente desde esta barra lateral. También se podrán organizar los diarios por categorías o etiquetas para facilitar su búsqueda y acceso.

## Zona de escritura
La zona central de la aplicación estará dedicada a la escritura del diario. Utilizaremos `ueberdosis/tiptap` para proporcionar una experiencia de escritura rica y flexible, permitiendo a los usuarios dar formato a su texto, insertar imágenes, enlaces, listas, etc. Esta zona de escritura será el corazón de la aplicación, donde los usuarios podrán expresar sus pensamientos y emociones de manera libre y creativa.

## Guardado de las entradas
Aunque lo más cómodo sería guardar todos los cambios en la base de datos local (sqlite), el contenido de las entradas serán guardados localmente en archivos de texto md/html (dependiendo de la complejidad de la entrada) para evitar problemas de rendimiento. Los archivos se guardarán con un formato personalizado `.myj`, que incluirá metadatos como la fecha de creación, etiquetas, configuración de privacidad, etc. La base de datos local se utilizará para almacenar información sobre los diarios, como su nombre, configuración de privacidad, etiquetas, etc., y para mantener un índice de los archivos de entradas.

## Diarios privados
Los diarios privados estarán protegidos por contraseña y serán encriptados dentro del propio archivo `.myj` para garantizar la seguridad de la información. Para acceder a un diario privado, el usuario deberá ingresar la contraseña correcta, que se utilizará para desencriptar el contenido del diario. Si el usuario olvida la contraseña, no podrá acceder al contenido del diario, por lo que se recomienda tener un sistema de recuperación de contraseña o una advertencia clara sobre la importancia de recordar la contraseña. Para evitar que si el usuario cambia la contraseña y por lo tanto no pueda acceder al contenido por la desencriptación, se guardará y se usará de forma interna exclusivamente la contraseña original para encriptar y desencriptar el contenido, y la contraseña visible para el usuario se podrá cambiar sin afectar a la seguridad del diario.

## Exportar e importar diarios
"My Journal" permitirá a los usuarios exportar sus diarios en formato `.zip`. Si el diario es privado, el zip estará protegido por contraseña y contendrá los archivos `.myj` correspondientes a las entradas del diario. Si el diario es público, el zip contendrá los archivos `.myj` sin protección. Además, los usuarios podrán importar diarios desde archivos `.zip`, lo que les permitirá restaurar sus diarios o transferirlos a otro dispositivo.

A la hora de exportar o importar, se realizará una verificación de integridad para asegurarse de que los archivos `.myj` están completos y no han sido corrompidos durante el proceso. Si se detecta algún problema con los archivos, se mostrará un mensaje de error al usuario. También se pedirá al usuario que introduzca la contraseña del diario privado al importar y al exportar para garantizar la seguridad de los datos.

