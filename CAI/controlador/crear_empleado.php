<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();
$u->crear_empleado($c->getConex());

mysql_close($c->getConex());
?>