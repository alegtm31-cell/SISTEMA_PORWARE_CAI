<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();
$i->crear_invitado($c->getConex());

mysql_close($c->getConex());
?>