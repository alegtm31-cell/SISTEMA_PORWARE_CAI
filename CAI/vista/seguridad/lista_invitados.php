<?php
require_once '../../inc/subcabeza.php'; 
require_once '../../modelo/clases.php';

$c = new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();
$invitados_arr= $i->obtener_invitados_hoy_a($c->getConex());


require_once '../../inc/fecha.php';

require_once '../../inc/menu_seguridad.php'; 
?>

<META HTTP-EQUIV="REFRESH" CONTENT="120;URL=lista_invitados.php">

<div class="pull-right">	
	<form role="form" id="form-cedula-buscar-invitado-por-seguridad">
        <div class="form-group row">
            <div class="col-xs-2">
            	<button type="submit" class="btn btn-primary btn-md"><i class="fa fa-search fa-lg"></i></button>
            </div>
            <div class="col-xs-10">
                <input name="cedula_invitado" id="cedula_buscar_invitado_por_seguridad" type="text" class="form-control input-md" placeholder='Buscar invitado por cedula' maxlength="8" onkeypress="return permite(event, 'num')" required>
            </div>                       
        </div>
    </form>
</div>

<h4 class="titulo_color">Lista de Invitados</h4>

<div class="clearfix"></div>

<div id="resultado_buscar_cedula_invitado_por_seguridad"></div>

<hr>

<?php
if ($invitados_arr[0]) {
	$invitados_obj= $i->obtener_invitados_hoy($c->getConex());
	?>

	<div class="row">
		<div class="col-xs-12">
			<div class="table-responsive">
				<table class="table table-striped table-hover texto_medio">
					<thead>
						<tr>
							<th><b>Cedula</b></th>
							<th><b>Nombre</b></th>
							<th><b>Fecha</b></th>
							<th><b>Anfitrión</b></th>
							<th><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Acción&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b></th>
						</tr>
					</thead>
					<tbody>	

	<?php
		while($invitado=mysql_fetch_array($invitados_obj)){
			echo "<tr><td>".$invitado['cedula_invitado']."</td>";
			echo "<td>".$invitado['nombre_invitado']." ".$invitado['apellido_invitado']."</td>";
			echo "<td>".$invitado['fecha']."</td>";
			echo "<td>".$invitado['nombre']." ".$invitado['apellido']."</td>";
			echo '
			<td>
			<a data-toggle="modal" data-target="#hora_entrada" href="hora_entrada.php?id_invitado='.$invitado["id_invitado"].'"><i class="fa fa-arrow-down fa-lg"></i></a>

			&nbsp;|&nbsp

			<a data-toggle="modal" data-target="#hora_salida" href="hora_salida.php?id_invitado='.$invitado["id_invitado"].'"><i class="fa fa-arrow-up fa-lg"></i></a>

			&nbsp;|&nbsp

			<a data-toggle="modal" data-target="#denegar_acceso" href="denegar_acceso.php?id_invitado='.$invitado["id_invitado"].'"><i class="fa fa-ban fa-lg"></i></a>

			</td>';
		}
	?>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div class="modal fade" id="hora_entrada" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
	    <div class="modal-dialog" role="document">
	        <div class="modal-content">

	        </div>
	    </div>
	</div>

	<div class="modal fade" id="hora_salida" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
	    <div class="modal-dialog" role="document">
	        <div class="modal-content">

	        </div>
	    </div>
	</div>

	<div class="modal fade" id="denegar_acceso" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
	    <div class="modal-dialog" role="document">
	        <div class="modal-content">

	        </div>
	    </div>
	</div>
<?php
} else{
	echo '<h2>Actualmente no hay invitados registrados para el día de hoy.</h2>';
}

?>

<?php mysql_close($c->getConex()); require_once '../../inc/subpie.php'; ?>