<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$n= new Noticia();

$u->autenticar_ingreso();
$n->eliminar_noticia($c->getConex(), $_POST['id_noticia']);

mysql_close($c->getConex());
?>