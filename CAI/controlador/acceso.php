<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->login_usuario($c->getConex(), $_POST['correo'], $_POST['clave']);

mysql_close($c->getConex());
?>