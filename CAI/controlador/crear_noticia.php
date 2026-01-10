<?php
require_once '../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();
$n= new Noticia();

$u->autenticar_ingreso();

if ($_FILES['imagen']['error'] == 4){

	$n->crear_noticia($c->getConex());

} elseif ($_FILES['imagen']['error'] == 1) {

	echo '<script language = javascript>
			alert("El servidor no soporta el peso de la imagen, por favor intente con una imagen menos pesada.");
			self.location = "../vista/administrador/noticias.php";
		</script>';

} elseif (copy($_FILES['imagen']['tmp_name'], "../img/noticias/".$_FILES['imagen']['name'])) {

	$n->crear_noticia_imagen($c->getConex(), "../../img/noticias/".$_FILES['imagen']['name']);

} else{

	echo '<script language = javascript>
			alert("Ha ocurrido un error al cargar la imagen al servidor.");
			self.location = "../vista/administrador/noticias.php";
		</script>';
}

    echo '<script language = javascript>
			self.location = "../vista/administrador/noticias.php"
		</script>';

?>