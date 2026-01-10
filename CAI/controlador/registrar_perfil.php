<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->registrar_perfil($c->getConex(), $_POST['id_usuario']);

mysql_close($c->getConex());
?>