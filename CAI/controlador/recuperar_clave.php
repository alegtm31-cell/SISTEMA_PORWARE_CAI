<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$fila= $u->usuario_por_correo($c->getConex(), $_POST['correo']);

if (!$fila[0]) {
	echo '<div class="alert alert-danger text-center" role="alert"><b>Este correo no esta registrado en el sistema, por favor verifique sus datos.</b></div>';
}
else {

    $an = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $su = strlen($an) - 1;
    $clave_aleatoria= substr($an, rand(0, $su), 1) . substr($an, rand(0, $su), 1) . substr($an, rand(0, $su), 1) . substr($an, rand(0, $su), 1) . substr($an, rand(0, $su), 1) . substr($an, rand(0, $su), 1);

    $clave_encriptada= sha1($clave_aleatoria);

    $u->actualizar_clave($c->getConex(), $clave_encriptada, $fila['correo']);

    if (mail($fila['correo'], "Recuperación de Clave - Control de Acceso de Invitados", "Su nueva clave temporal es: ".$clave_aleatoria)) {
    	echo '<div class="alert alert-info text-center" role="alert"><b>Le hemos enviado un correo electronico con su nueva clave temporal.</b></div>';
    } else {
    	echo '<div class="alert alert-danger text-center" role="alert"><b>Ha ocurrido un error durante el envio del correo electronico con su nueva clave temporal, por favor contacte al administrador.</b></div>';
    }
}

mysql_close($c->getConex());
?>