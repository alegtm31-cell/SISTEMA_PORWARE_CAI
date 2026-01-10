<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();
$i->eliminar_invitado($c->getConex(), $_POST['id_invitado']);

mysql_close($c->getConex());
?>