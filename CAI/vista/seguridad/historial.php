<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();

$invitados_arr= $i->obtener_invitados_a($c->getConex());

require_once '../../inc/fecha.php';

require_once '../../inc/menu_seguridad.php'; 
?>

<META HTTP-EQUIV="REFRESH" CONTENT="300;URL=historial.php">

<div class="pull-right">	
	<form role="form" id="form-cedula-buscar-invitado">
        <div class="form-group row">
            <div class="col-xs-2">
            	<button type="submit" class="btn btn-primary btn-md"><i class="fa fa-search fa-lg"></i></button>
            </div>
            <div class="col-xs-10">
                <input name="cedula_invitado" id="cedula_buscar_invitado" type="text" class="form-control input-md" placeholder='Buscar invitado por cedula' maxlength="8" onkeypress="return permite(event, 'num')" required>
            </div>                       
        </div>
    </form>
</div>

<h4 class="titulo_color">Historial de Invitados</h4>

<div class="clearfix"></div>

<div id="resultado_buscar_cedula_invitado"></div>

<hr>

<?php
if ($invitados_arr[0]) {
	$invitados_obj= $i->obtener_invitados($c->getConex());
	?>

	<div class="row">
		<div class="col-xs-12">
			<div class="table-responsive">
				<table class="table table-striped table-hover texto_medio">
					<thead>
						<tr>
							<th><b>Cedula</b></th>
							<th><b>Nombre</b></th>
							<th><b>Apellido</b></th>
							<th><b>Fecha</b></th>
							<th><b>Acción</b></th>
						</tr>
					</thead>
					<tbody>	

	<?php
		while($invitado=mysql_fetch_array($invitados_obj)){
			echo "<tr><td>".$invitado['cedula_invitado']."</td>";
			echo "<td>".$invitado['nombre_invitado']."</td>";
			echo "<td>".$invitado['apellido_invitado']."</td>";
			echo "<td>".$invitado['fecha']."</td>";
			echo '
			<td>
			<a data-toggle="modal" data-target="#detalles_invitado" href="detalles_invitado.php?id_invitado='.$invitado["id_invitado"].'"><i class="fa fa-file-text-o fa-lg"></i></a>
			</td>';
		}
	?>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div class="modal fade" id="detalles_invitado" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
	    <div class="modal-dialog" role="document">
	        <div class="modal-content">

	        </div>
	    </div>
	</div>
<?php
} else{
	echo '<h2>Actualmente no hay invitados registrados.</h2>';
}

?>

<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>