<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();
$u->modificar_empleado($c->getConex(), $_POST['id_usuario']);

mysql_close($c->getConex());
?>