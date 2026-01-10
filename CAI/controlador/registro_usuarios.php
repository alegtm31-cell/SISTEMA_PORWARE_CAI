<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$fila= $u->usuario_por_cedula($c->getConex(), $_POST['cedula']);

if (!$fila[0]) {
	echo '<div class="alert alert-danger text-center" role="alert"><b>Esta cedula no esta registrada en el sistema, por favor contacte al administrador.</b></div>';
}
elseif ($fila['clave']) {
	echo '<div class="alert alert-danger text-center" role="alert"><b>El usuario con esta cedula ya esta registrado, por favor verifique sus datos.</b></div>';
}
else {
	echo '<p class="msg-azul text-left">Hola <b>'.$fila['nombre'].'</b> ya puedes registrarte.<button type="button" class="btn btn-md pull-right" data-toggle="modal" data-target="#registrate_formulario" href="modificar_perfil_modal.php?id_usuario='.$fila["id_usuario"].'"><b>Registrarme</b></button></p>';
}

mysql_close($c->getConex());
?>