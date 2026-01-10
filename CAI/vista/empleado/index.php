<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();
$n= new Noticia();

$u->autenticar_ingreso();

$noticias_arr= $n->obtener_noticias_a($c->getConex());

require_once '../../inc/fecha.php';

require_once '../../inc/menu_empleado.php'; 
?>

<h4 class="titulo_color">Noticias</h4>

<hr>

<?php

if (!$noticias_arr[0]) {
	echo '<h2>Actualmente no hay noticias publicadas.</h2>';
} else {

	$noticias_obj= $n->obtener_noticias_o($c->getConex());

	while($noticia=mysql_fetch_array($noticias_obj)){
		echo '<div class="row">
			<div class="col-xs-3 col-md-2">';
			if ($noticia["imagen"]){
				echo '<a data-toggle="modal" data-target="#detalles_noticia" href="detalles_noticia.php?id_noticia='.$noticia["id_noticia"].'"><div class="text-center"><img src="'.$noticia["imagen"].'" class="noticia_img"></div></a>';
			} else {
				echo '<a data-toggle="modal" data-target="#detalles_noticia" href="detalles_noticia.php?id_noticia='.$noticia["id_noticia"].'"><div class="text-center"><i class="fa fa-commenting-o fa-5x icono_noticia"></i></div></a>';
			}
		    
		    echo '</div>
		    <div class="col-xs-9 col-md-10">';
		    	echo '<h3 class="titulo_noticia"><a data-toggle="modal" data-target="#detalles_noticia" href="detalles_noticia.php?id_noticia='.$noticia["id_noticia"].'">'.$noticia["titulo"].'</a></h3>';
		    	echo $noticia["fecha"].'
		    </div>
		</div>
		<hr>
		';
	}

}
	
?>

<div class="modal fade" id="detalles_noticia" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
    <div class="modal-dialog" role="document">
        <div class="modal-content">

        </div>
    </div>
</div>

<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>