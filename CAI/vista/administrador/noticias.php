<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();
$n= new Noticia();

$u->autenticar_ingreso();

$noticias_arr= $n->obtener_noticias_a($c->getConex());

require_once '../../inc/fecha.php';

require_once '../../inc/menu_administrador.php'; 
?>

<div class="pull-right">	
	<a data-toggle="modal" data-target="#crear_noticia" href="crear_noticia.php" class="texto_medio"><b>Publicar Noticias</b>&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa fa-comments-o fa-3x"></i></a>
</div>

<h4 class="titulo_color">Noticias</h4>

<div class="clearfix"></div>

<hr>

<?php

if (!$noticias_arr[0]) {
	echo '<h2>Actualmente no hay noticias publicadas.</h2>';
} else {

	$noticias_obj= $n->obtener_noticias_o($c->getConex());
	echo '
	<div class="row">
		<div class="col-xs-12">
			<div class="table-responsive">
				<table class="table table-striped table-hover texto_medio">
					<thead>
						<tr>
							<th><b>Título</b></th>
							<th><b>&nbsp;&nbsp;&nbsp;&nbsp;Fecha&nbsp;&nbsp;&nbsp;&nbsp;</b></th>
							<th><b>&nbsp;&nbsp;Acción&nbsp;&nbsp;</b></th>
						</tr>
					</thead>
					<tbody>
	';

	while($noticia=mysql_fetch_array($noticias_obj)){
		echo "<tr><td>".$noticia['titulo']."</td>";
		echo "<td>".$noticia['fecha']."</td>";
		echo '
		<td>
		<a data-toggle="modal" data-target="#modificar_noticia" href="modificar_noticia.php?id_noticia='.$noticia["id_noticia"].'"><i class="fa fa-pencil fa-lg"></i></a>

		&nbsp;&nbsp;|&nbsp;&nbsp

		<a data-toggle="modal" data-target="#eliminar_noticia" href="eliminar_noticia.php?id_noticia='.$noticia["id_noticia"].'"><i class="fa fa-trash-o fa-lg"></i></a>

		</td>';
	}
}
	
?>
				</tbody>
			</table>
		</div>
	</div>
</div>

<div class="modal fade" id="crear_noticia" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">

        </div>
    </div>
</div>

<div class="modal fade" id="modificar_noticia" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
    <div class="modal-dialog" role="document">
        <div class="modal-content">

        </div>
    </div>
</div>

<div class="modal fade" id="eliminar_noticia" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
    <div class="modal-dialog" role="document">
        <div class="modal-content" id="modal-box">

        </div>
    </div>
</div>

<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>