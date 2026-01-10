<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();
$i= new Invitado();

$u->autenticar_ingreso();

$invitados_arr = $i->invitados_por_cedula_empleado_a($c->getConex(), $_POST['cedula_invitado'], $_SESSION['id_usuario']);

if (!$invitados_arr[0]) {
	echo '<div class="alert alert-danger text-center" role="alert"><b>Esta cedula no esta registrada en el sistema.</b></div>';
} else {
	
	$invitados_obj= $i->invitados_por_cedula_empleado_O($c->getConex(), $_POST['cedula_invitado'], $_SESSION['id_usuario']);

	echo '
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
	';
	while($fila=mysql_fetch_array($invitados_obj)){
	echo "<tr><td>".$fila['cedula_invitado']."</td>";
	echo "<td>".$fila['nombre_invitado']."</td>";
	echo "<td>".$fila['apellido_invitado']."</td>";
	echo "<td>".$fila['fecha']."</td>";


	echo '
		<td>
		<a data-toggle="modal" data-target="#modificar_invitado" href="modificar_invitado.php?id_invitado='.$fila["id_invitado"].'"><i class="fa fa-pencil fa-lg"></i></a>

		&nbsp;&nbsp;|&nbsp;&nbsp

		<a data-toggle="modal" data-target="#eliminar_invitado" href="eliminar_invitado.php?id_invitado='.$fila["id_invitado"].'"><i class="fa fa-trash-o fa-lg"></i></a>

		</td>';
	}
}

mysql_close($c->getConex());
?>