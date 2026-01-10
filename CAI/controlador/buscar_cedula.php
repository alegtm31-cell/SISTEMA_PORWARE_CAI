<?php
require_once '../modelo/clases.php';

$c= new Conexion();
$u= new Usuario();

$u->autenticar_ingreso();
$fila= $u->usuario_por_cedula($c->getConex(), $_POST['cedula']);

if (!$fila[0]) {
	echo '<div class="alert alert-danger text-center" role="alert"><b>Esta cedula no esta registrada en el sistema.</b></div>';
} else {

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
							<th><b>Rol</b></th>
							<th><b>Acción</b></th>
						</tr>
					</thead>
					<tbody>
	';

	echo "<tr><td>".$fila['cedula']."</td>";
	echo "<td>".$fila['nombre']."</td>";
	echo "<td>".$fila['apellido']."</td>";
	echo "<td>";
	switch ($fila['rol']) {

		case 1:
		echo "Administrador";
		break;

		case 2:
		echo "Empleado";
		break;

		case 3:
		echo "Seguridad";
		break;

		default:
		exit('Error en la base de datos, consulte al administrador');
		break;
	}
	echo "</td>";

	echo '
	<td>
	<a data-toggle="modal" data-target="#modificar_empleado" href="modificar_empleado.php?id_usuario='.$fila["id_usuario"].'"><i class="fa fa-pencil fa-lg"></i></a>

	&nbsp;&nbsp;|&nbsp;&nbsp

	<a data-toggle="modal" data-target="#eliminar_empleado" href="eliminar_empleado.php?id_usuario='.$fila["id_usuario"].'"><i class="fa fa-trash-o fa-lg"></i></a>

	</td>';
}

mysql_close($c->getConex());
?>