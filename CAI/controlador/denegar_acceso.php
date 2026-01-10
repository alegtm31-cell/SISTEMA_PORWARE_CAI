<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();
$i->denegar_acceso($c->getConex(), $_POST['id_invitado'], $_POST['observacion']);

mysql_close($c->getConex());
?>