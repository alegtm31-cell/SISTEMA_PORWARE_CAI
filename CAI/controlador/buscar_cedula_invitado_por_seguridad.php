<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();

$invitados_arr = $i->invitados_por_cedula_a_hoy($c->getConex(), $_POST['cedula_invitado']);

if (!$invitados_arr[0]) {
	echo '<div class="alert alert-danger text-center" role="alert"><b>Esta cedula no esta registrada en el sistema.</b></div>';
} else {
	
	$invitados_obj= $i->invitados_por_cedula_o_hoy($c->getConex(), $_POST['cedula_invitado']);

	echo '
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
	';
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
}

mysql_close($c->getConex());
?>