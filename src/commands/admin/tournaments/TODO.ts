//Primer tipo a realizar: Eliminación simple


/**
 * !creartorneo
 * Quiero crear un torneo con los siguientes datos:
 * Del usuario:
 *  Nombre,
 *  TIPO DE TORNEO
 *  Descripción,
 *  Fecha de inicio (dia y hora),
 *  lapso de tiempo para jugar (Ventana de juego),
 *  rangos que podrán participar,
 * En código: id, fecha de creación y el end_date se pueden calcular
 *
 * Se guarda en DB
 * Se notifica al grupo principal que se ha creado un torneo y están listos para poder unirse antes de que empiece
 */  

/**
 * !listatorneos
 * Muestra la lista de torneos disponibles
 * Categorizando los:
 * - Candidatos (No activo y no Terminado)
 * - Activos
 * - Terminados
 * (Reutilizar este codigo para lo siguiente)
 */

/**
 * !avisartorneo (Iniciar no significa que empiece desde ahora, es solo activarlo, dado que ya tienen una fecha de inicio)
 * Se muestra una lista de los torneos creados pero no activos y tampoco que ya hayan terminado
 * Se da a elegir cual se quiera iniciar
 *
 * Prompt de confirmación
 * Se inicia lo que hace que:
 *  - Se envia una notificación a todos los miembros del torneo indicando la fecha de inicio del torneo
 */


////                  BOT


/**
 * Hacer testing con torneos de 1 hora o torneos relámpagos
 */
//El crud al final, ya que puedo editar la base de datos yo mismo metiendole mano
/**
 * !editartorneo (No se podrá editar lo que ya han terminado)
 * Mostrar un listado de los torneos candidatos
 * Se da a elegir cual se quiere editar
 * Dar a elegir que opción va a poder editar
 *  - Nombre
 *  - Descripción
 *  - Fecha de inicio
 *  - Ventana de juego
 *  - Rangos que podrán participar
 *  - Imagen cover/portada del torneo
 * Prompt de confirmación
 * Guardar los cambios
 * (No cambia la fecha de creación, ni el id, pero el end_date puede cambiar si se modifica la Ventana de juego)
 */
